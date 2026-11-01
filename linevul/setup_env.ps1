# Setup virtual environment
python -m venv venv

# Activate and install dependencies
# Note: Using compatible versions of torch and transformers for Windows and modern python
# If there are installation speed/mirror issues, standard pip will be used
.\venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
# Install compatible packages
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
pip install transformers flask pandas scikit-learn captum matplotlib gdown
