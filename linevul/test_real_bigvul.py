import pandas as pd
import sys
import os
import torch

sys.path.append(os.path.join(os.path.dirname(__file__), "linevul"))
from linevul_model import Model
from linevul.data import strip_c_comments_keep_lines
from transformers import RobertaConfig, RobertaTokenizer, RobertaForSequenceClassification

df = pd.read_csv(r"C:\Users\MUNEEB\Downloads\lineVul\cppcheck\data\static_analysis_results.csv")
print(f"Total rows: {len(df)}")
print(df.columns)

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

for i in range(5):
    src = df.iloc[i]["source"]
    flaws = df.iloc[i]["flaw_lines"]
    has_flaws = pd.notna(flaws) and str(flaws).strip() != "" and str(flaws).strip() != "[]"
    clean_src = strip_c_comments_keep_lines(src)
    non_vul, vul = predict(clean_src)
    print(f"\n--- Example {i} (has_flaws={has_flaws}) ---")
    print(f"Prediction: Vuln={vul:.4f}, Non-Vuln={non_vul:.4f}")
    print(f"First 3 lines of source:\n{chr(10).join(src.splitlines()[:3])}")
