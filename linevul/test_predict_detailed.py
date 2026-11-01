import sys
import os
import torch
from transformers import RobertaConfig, RobertaTokenizer, RobertaForSequenceClassification

sys.path.append(os.path.join(os.path.dirname(__file__), "linevul"))
from linevul_model import Model
from linevul.data import strip_c_comments_keep_lines

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")
config = RobertaConfig.from_pretrained("microsoft/codebert-base")
config.num_labels = 1
config.num_attention_heads = 12

base_model = RobertaForSequenceClassification.from_pretrained(
    "microsoft/codebert-base", config=config, ignore_mismatched_sizes=True, attn_implementation="eager"
)

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

def predict(code):
    tokens = tokenizer.tokenize(code)[:510]
    source_tokens = [tokenizer.cls_token] + tokens + [tokenizer.sep_token]
    source_ids = tokenizer.convert_tokens_to_ids(source_tokens)
    padding_length = 512 - len(source_ids)
    source_ids += [tokenizer.pad_token_id] * padding_length
    input_ids = torch.tensor([source_ids]).to(device)

    with torch.no_grad():
        prob, _ = model(input_ids=input_ids, output_attentions=True)
    return prob[0][0].item(), prob[0][1].item()

sample_safe = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

sample_vuln = """void process_user_data(char *user_input) {
    char buffer[64];
    
    // VULNERABLE: Direct strcpy into fixed buffer can cause stack overflow
    strcpy(buffer, user_input);
    
    printf("Processed input: %s\\n", buffer);
}"""

print("1. sample_safe as-is (with comment):", predict(sample_safe))
print("2. sample_safe with comments stripped:", predict(strip_c_comments_keep_lines(sample_safe)))

print("3. sample_vuln as-is (with comment):", predict(sample_vuln))
print("4. sample_vuln with comments stripped:", predict(strip_c_comments_keep_lines(sample_vuln)))

# Real Big-Vul examples:
# A classic buffer overflow in real C
real_vuln_1 = """static int parse_msg(char *data, int len) {
    char buf[128];
    if (len > 0) {
        memcpy(buf, data, len);
        return 0;
    }
    return -1;
}"""
print("5. real_vuln_1 (unbounded memcpy):", predict(real_vuln_1))

# Real safe function:
real_safe_1 = """static int parse_msg(char *data, int len) {
    char buf[128];
    if (len > 0 && len < sizeof(buf)) {
        memcpy(buf, data, len);
        return 0;
    }
    return -1;
}"""
print("6. real_safe_1 (bounded memcpy):", predict(real_safe_1))
