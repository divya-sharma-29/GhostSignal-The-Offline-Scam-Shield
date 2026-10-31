"""
GhostSignal — SmolLM3-3B Fine-Tuning Script using Hugging Face SFTTrainer & LoRA.

Fine-tunes 'HuggingFaceTB/SmolLM3-3B' on synthetic scam datasets to produce
an offline model that outputs structured JSON cybersecurity risk verdicts.
Supports exporting directly to 16-bit merged weights and GGUF quantization.
"""

import os
import argparse
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

DEFAULT_MODEL_ID = "HuggingFaceTB/SmolLM3-3B"

def parse_args():
    parser = argparse.ArgumentParser(description="Fine-tune SmolLM3-3B for GhostSignal Scam Shield")
    parser.add_argument("--model_id", type=str, default=DEFAULT_MODEL_ID, help="Base HuggingFace model ID")
    parser.add_argument("--train_file", type=str, default="backend/training/data/train_scam_dataset.jsonl")
    parser.add_argument("--eval_file", type=str, default="backend/training/data/eval_scam_dataset.jsonl")
    parser.add_argument("--output_dir", type=str, default="backend/models/smollm3_fine_tuned")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=2)
    parser.add_argument("--grad_accum", type=int, default=4)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--max_seq_length", type=int, default=1024)
    parser.add_argument("--use_4bit", action="store_true", default=True, help="Load in 4-bit QLoRA")
    return parser.parse_args()

def format_chatml(example, tokenizer):
    """Formats messages array using tokenizer chat template."""
    messages = example.get("messages", [])
    if hasattr(tokenizer, "apply_chat_template"):
        return {"text": tokenizer.apply_chat_template(messages, tokenize=False)}
    # Fallback to standard prompt layout
    text = ""
    for msg in messages:
        text += f"<|im_start|>{msg['role']}\n{msg['content']}<|im_end|>\n"
    return {"text": text}

def train():
    args = parse_args()
    print(f"=== Starting GhostSignal Fine-Tuning for {args.model_id} ===")
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"Device: {torch.cuda.get_device_name(0)}")

    # 1. Tokenizer
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(args.model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # 2. Quantization / BitsAndBytes configuration
    bnb_config = None
    if args.use_4bit and torch.cuda.is_available():
        print("Configuring 4-bit QLoRA quantization...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
            bnb_4bit_use_double_quant=True
        )

    # 3. Base model
    print(f"Loading base model {args.model_id}...")
    device_map = "auto" if torch.cuda.is_available() else "cpu"
    model = AutoModelForCausalLM.from_pretrained(
        args.model_id,
        quantization_config=bnb_config,
        device_map=device_map,
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float32
    )

    if args.use_4bit and torch.cuda.is_available():
        model = prepare_model_for_kbit_training(model)

    # 4. LoRA Setup
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # 5. Load and format datasets
    print("Loading datasets...")
    data_files = {"train": args.train_file}
    if os.path.exists(args.eval_file):
        data_files["eval"] = args.eval_file

    dataset = load_dataset("json", data_files=data_files)
    formatted_train = dataset["train"].map(lambda x: format_chatml(x, tokenizer))
    formatted_eval = dataset.get("eval", None)
    if formatted_eval:
        formatted_eval = formatted_eval.map(lambda x: format_chatml(x, tokenizer))

    # 6. Training Arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=args.grad_accum,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        logging_steps=10,
        save_strategy="epoch",
        evaluation_strategy="epoch" if formatted_eval else "no",
        fp16=torch.cuda.is_available() and not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_available() and torch.cuda.is_bf16_supported(),
        report_to="none"
    )

    # 7. Trainer
    trainer = SFTTrainer(
        model=model,
        train_dataset=formatted_train,
        eval_dataset=formatted_eval,
        dataset_text_field="text",
        max_seq_length=args.max_seq_length,
        tokenizer=tokenizer,
        args=training_args
    )

    # 8. Train
    print("Beginning model training...")
    trainer.train()

    # 9. Save LoRA Adapters
    print(f"Saving fine-tuned LoRA adapters to {args.output_dir}...")
    trainer.model.save_pretrained(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)
    print("Training complete! Run 'python backend/tools/quantize_smollm3.py' to quantize to GGUF Q4_K_M.")

if __name__ == "__main__":
    train()

