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

tests = [
    ("test comment alone: // buffer overflow", "// buffer overflow"),
    ("test comment alone: // SECURE", "// SECURE"),
    ("test comment alone: // safe", "// safe"),
    ("strcpy buffer overflow function", """int copy_data(char *src) {
    char dst[16];
    return strcpy(dst, src);
}"""),
    ("gets buffer overflow function", """int read_data() {
    char dst[16];
    gets(dst);
    return 0;
}"""),
    ("format string vuln", """void log_msg(char *user) {
    printf(user);
}"""),
    ("integer overflow", """char *alloc_buf(int n) {
    int size = n * sizeof(int);
    return malloc(size);
}"""),
    ("use after free", """void cleanup(char *ptr) {
    free(ptr);
    *ptr = 'A';
}""")
]

for name, code in tests:
    non_vul, vul = predict(code)
    print(f"{name:35} -> Vuln Prob: {vul:.4f} | Non-Vul Prob: {non_vul:.4f}")
