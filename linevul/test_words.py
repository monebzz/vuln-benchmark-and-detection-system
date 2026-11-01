import sys
import os
import torch
from transformers import RobertaConfig, RobertaTokenizer, RobertaForSequenceClassification

sys.path.append(os.path.join(os.path.dirname(__file__), "linevul"))
from linevul_model import Model

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
        prob, att = model(input_ids=input_ids, output_attentions=True)
    return prob[0][0].item(), prob[0][1].item(), att

code1 = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

code2 = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // Uses snprintf with length limit
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

code3 = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents memory issue
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

code4 = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

print("code1 (with 'prevents buffer overflow'):", predict(code1)[:2])
print("code2 (with 'Uses snprintf with length limit'):", predict(code2)[:2])
print("code3 (with 'prevents memory issue'):", predict(code3)[:2])
print("code4 (with 'SECURE: snprintf'):", predict(code4)[:2])
