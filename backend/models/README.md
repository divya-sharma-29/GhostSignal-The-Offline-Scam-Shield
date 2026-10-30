# Optional ONNX classifier contract

No trained model is included. To enable local CPU inference, provide all three files:

- `scam_classifier.onnx`: a model accepting `input_ids` and `attention_mask` (and optionally `token_type_ids`) as int64 batches.
- `tokenizer.json`: a Hugging Face Tokenizers-compatible tokenizer.
- `model_config.json`: for example `{ "version": "1.0.0", "labels": ["legitimate", "scam"], "scam_label": "scam", "threshold": 0.7, "max_length": 256, "pad_token_id": 0 }`.

Install the optional packages with `python -m pip install onnxruntime tokenizers`. The backend uses the first model output as class logits, applies softmax, and contributes the scam class score only above the configured threshold. Train and validate the classifier on representative multilingual scam and legitimate messages before deployment. The system reports rule-only mode whenever any required artifact or runtime component is unavailable or fails to load.
