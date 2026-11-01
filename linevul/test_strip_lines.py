import sys
import os
import torch

sys.path.append(os.path.join(os.path.dirname(__file__), "linevul"))
from linevul_model import Model
from linevul.data import strip_c_comments_keep_lines
from transformers import RobertaConfig, RobertaTokenizer, RobertaForSequenceClassification

code = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

clean_code = strip_c_comments_keep_lines(code)
print("Clean code:")
for idx, line in enumerate(clean_code.split("\n")):
    print(f"{idx+1}: {line}")
