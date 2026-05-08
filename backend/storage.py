import os
import shutil
import io

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

def get_s3_client():
    pass

def ensure_bucket():
    pass

def upload_file(local_path: str, storage_key: str, content_type: str = "application/octet-stream") -> str:
    dest = os.path.join(DATA_DIR, storage_key)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    shutil.copy(local_path, dest)
    return storage_key

def upload_bytes(data: bytes, storage_key: str, content_type: str = "application/octet-stream") -> str:
    dest = os.path.join(DATA_DIR, storage_key)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'wb') as f:
        f.write(data)
    return storage_key

def get_presigned_url(storage_key: str, expiry: int = 3600) -> str:
    return f"http://localhost:8000/media/{storage_key}"

def download_file(storage_key: str, local_path: str):
    src = os.path.join(DATA_DIR, storage_key)
    shutil.copy(src, local_path)
