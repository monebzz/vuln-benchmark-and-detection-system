import os
import urllib.request
import sys

def download_file_from_google_drive(id, destination):
    URL = "https://docs.google.com/uc?export=download&confirm=t"
    
    session = urllib.request.build_opener()
    # Find confirmation token if file is large
    req = urllib.request.Request(URL + "&id=" + id)
    try:
        with session.open(req) as response:
            html = response.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error checking token: {e}")
        html = ""

    # Simple check for confirm token in query or body
    confirm_token = None
    import re
    tokens = re.findall(r'confirm=([0-9A-Za-z_\-]+)', html)
    if tokens:
        confirm_token = tokens[0]
    
    if confirm_token:
        download_url = URL + f"&id={id}&confirm={confirm_token}"
    else:
        # Fallback to direct download URL (works if confirmation isn't strictly requested)
        download_url = f"https://drive.google.com/uc?export=download&id={id}"
        
    print(f"Downloading from {download_url} to {destination}...")
    
    try:
        urllib.request.urlretrieve(download_url, destination, reporthook)
        print("\nDownload finished successfully!")
    except Exception as e:
        print(f"\nDownload failed: {e}")
        # Try curl fallback
        print("Attempting curl fallback...")
        os.system(f'curl -L "https://drive.google.com/uc?export=download&id={id}" -o "{destination}"')

def reporthook(count, block_size, total_size):
    global start_time
    # Simple progress print
    progress_size = int(count * block_size)
    if total_size > 0:
        percent = min(int(progress_size * 100 / total_size), 100)
        sys.stdout.write(f"\rDownloading... {percent}% ({progress_size / (1024*1024):.2f} MB of {total_size / (1024*1024):.2f} MB)")
    else:
        sys.stdout.write(f"\rDownloading... {progress_size / (1024*1024):.2f} MB")
    sys.stdout.flush()

if __name__ == "__main__":
    file_id = "1oodyQqRb9jEcvLMVVKILmu8qHyNwd-zH"
    dest_dir = "linevul/saved_models/checkpoint-best-f1"
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, "12heads_linevul_model.bin")
    download_file_from_google_drive(file_id, dest_path)
