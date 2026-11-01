import sys
import os
import torch

sys.stdout.reconfigure(encoding='utf-8')
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

code = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

tokens = tokenizer.tokenize(code)[:510]
source_tokens = [tokenizer.cls_token] + tokens + [tokenizer.sep_token]
source_ids = tokenizer.convert_tokens_to_ids(source_tokens)
padding_length = 512 - len(source_ids)
source_ids += [tokenizer.pad_token_id] * padding_length
input_ids = torch.tensor([source_ids]).to(device)

with torch.no_grad():
    prob, attentions = model(input_ids=input_ids, output_attentions=True)

print("Vulnerability Probability:", prob[0][1].item())

# Attention analysis from layer 0
layer_0 = attentions[0][0] # (12, seq, seq)
att_sum = layer_0.sum(dim=0) # (seq, seq)
token_att = att_sum.sum(dim=0).cpu().numpy() # (seq,)

# Get top 15 tokens by attention
readable_tokens = [tokenizer.convert_ids_to_tokens(tid).replace("Ġ", " ") for tid in source_ids[:len(source_tokens)]]
token_scores = list(zip(readable_tokens, token_att[:len(source_tokens)]))
token_scores_sorted = sorted(token_scores, key=lambda x: x[1], reverse=True)

print("\nTop 15 tokens receiving highest attention:")
for tok, sc in token_scores_sorted[:15]:
    print(f"{tok:20}: {sc:.4f}")
