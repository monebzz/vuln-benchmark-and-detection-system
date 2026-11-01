import sys
import os

sys.stdout.reconfigure(encoding='utf-8')
from transformers import RobertaTokenizer

tokenizer = RobertaTokenizer.from_pretrained("microsoft/codebert-base")

code_with_comment = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    // SECURE: snprintf with bounds check prevents buffer overflow
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

tokens = tokenizer.tokenize(code_with_comment)
print("Tokens with comment:")
print([t.replace("Ġ", " ") for t in tokens])

code_no_comment = """void process_user_data(const char *user_input) {
    char buffer[64];
    
    if (user_input != NULL) {
        snprintf(buffer, sizeof(buffer), "%s", user_input);
        printf("Processed input: %s\\n", buffer);
    }
}"""

tokens_no = tokenizer.tokenize(code_no_comment)
print("\nTokens without comment:")
print([t.replace("Ġ", " ") for t in tokens_no])
