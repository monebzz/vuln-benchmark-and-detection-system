import sys
import os
import re
import torch
from transformers import RobertaConfig, RobertaTokenizer, RobertaForSequenceClassification

sys.path.append(os.path.join(os.path.dirname(__file__), "linevul"))
from linevul_model import Model

code_safe_with_comment = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

code_safe_without_comment = """void process_user_data(const char *user_input) {
    char buffer[64];
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

code_vuln = """void process_user_data(char *user_input) {
    char buffer[64];
    strcpy(buffer, user_input);
    printf("Processed input: %s\\n", buffer);
}"""

code_pure_safe = """int add(int a, int b) {
    return a + b;
}"""

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
config = RobertaConfig.from_pretrained("microsoft/codebert-base")
config.num_labels = 1
config.num_attention_heads = 12

base_model = RobertaForSequenceClassification.from_pretrained("microsoft/codebert-base", config=config, ignore_mismatched_sizes=True, attn_implementation="eager")

class Args:
    pass
args = Args()
args.device = device
args.num_attention_heads = 12
args.block_size = 512

model = Model(base_model, config, tokenizer, args)
model_path = os.path.join(os.path.dirname(__file__), "linevul", "saved_models", "checkpoint-best-f1", "12heads_linevul_model.bin")
model.load_state_dict(torch.load(model_path, map_location=device), strict=False)
model.to(device)
model.eval()

def test_code(label, code_str):
    tokens = tokenizer.tokenize(code_str)[:510]
    source_tokens = [tokenizer.cls_token] + tokens + [tokenizer.sep_token]
    source_ids = tokenizer.convert_tokens_to_ids(source_tokens)
    padding_length = 512 - len(source_ids)
    source_ids += [tokenizer.pad_token_id] * padding_length
    input_ids = torch.tensor([source_ids]).to(device)

    with torch.no_grad():
        prob, _ = model(input_ids=input_ids, output_attentions=True)
    print(f"=== {label} ===")
    print(f"Prob tensor: {prob}")
    print(f"prob[0][0] (Class 0 / Non-vul?): {prob[0][0].item():.4f}")
    print(f"prob[0][1] (Class 1 / Vul?): {prob[0][1].item():.4f}")

test_code("SAFE WITH COMMENT", code_safe_with_comment)
test_code("SAFE WITHOUT COMMENT", code_safe_without_comment)
test_code("VULNERABLE", code_vuln)
test_code("PURE SAFE ADD", code_pure_safe)
