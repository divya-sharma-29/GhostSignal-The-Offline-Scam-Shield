"""
Generates a valid, lightweight ONNX Scam Classifier model for GhostSignal.
Output: backend/models/scam_classifier.onnx
"""

import sys
from pathlib import Path
import numpy as np
import onnx
from onnx import helper, TensorProto

def build_onnx_classifier(output_path: Path):
    """
    Builds a lightweight linear classifier + sigmoid activation graph in ONNX format:
    Input: 'features' (shape: [1, 3] -> [text_length, word_count, exclamation_count])
    Weights: [0.01, 0.05, 0.2]
    Bias: [-0.5]
    Output: 'scam_probability' (shape: [1, 1], values 0.0 to 1.0)
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Define Input and Output
    features_input = helper.make_tensor_value_info('features', TensorProto.FLOAT, [1, 3])
    output_prob = helper.make_tensor_value_info('scam_probability', TensorProto.FLOAT, [1, 1])

    # Weights and Bias Initializers
    weights = np.array([[0.005], [0.08], [0.35]], dtype=np.float32)
    bias = np.array([[-0.4]], dtype=np.float32)

    weights_init = helper.make_tensor('W', TensorProto.FLOAT, [3, 1], weights.flatten().tolist())
    bias_init = helper.make_tensor('B', TensorProto.FLOAT, [1, 1], bias.flatten().tolist())

    # Nodes: MatMul -> Add -> Sigmoid
    node_matmul = helper.make_node('MatMul', ['features', 'W'], ['linear_out'])
    node_add = helper.make_node('Add', ['linear_out', 'B'], ['logits'])
    node_sigmoid = helper.make_node('Sigmoid', ['logits'], ['scam_probability'])

    # Build Graph
    graph = helper.make_graph(
        [node_matmul, node_add, node_sigmoid],
        'GhostSignalScamClassifier',
        [features_input],
        [output_prob],
        [weights_init, bias_init]
    )

    # Build Model with compatible IR version
    model = helper.make_model(graph, producer_name='GhostSignal-AI-Team', ir_version=10)
    model.opset_import[0].version = 13

    # Check and Save
    onnx.checker.check_model(model)
    onnx.save(model, str(output_path))
    print(f"[+] Successfully generated valid ONNX model at: {output_path}")

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    target = base_dir / "models" / "scam_classifier.onnx"
    build_onnx_classifier(target)
