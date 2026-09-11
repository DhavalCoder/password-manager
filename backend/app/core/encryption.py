import os
import json
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv

load_dotenv()

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "default-insecure-key-do-not-use-in-prod")

# Salt should come from ENCRYPTION_SALT env var (hex-encoded).
# Generate with: python -c "import os; print(os.urandom(32).hex())"
# WARNING: changing the salt makes all existing encrypted data unreadable.
_salt_hex = os.getenv("ENCRYPTION_SALT", "")
SALT = bytes.fromhex(_salt_hex) if _salt_hex else b'secure-password-manager-salt'

def _get_key() -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=SALT,
        iterations=100000,
    )
    return kdf.derive(ENCRYPTION_KEY.encode())

def encrypt_data(data: dict) -> tuple[str, str]:
    """Encrypt dict data and return (encrypted_base64, iv_base64)"""
    key = _get_key()
    aesgcm = AESGCM(key)
    iv = os.urandom(12)
    
    plaintext = json.dumps(data).encode('utf-8')
    ciphertext = aesgcm.encrypt(iv, plaintext, None)
    
    return base64.b64encode(ciphertext).decode('utf-8'), base64.b64encode(iv).decode('utf-8')

def decrypt_data(ciphertext_b64: str, iv_b64: str) -> dict:
    """Decrypt data using IV and return dict"""
    key = _get_key()
    aesgcm = AESGCM(key)
    
    iv = base64.b64decode(iv_b64)
    ciphertext = base64.b64decode(ciphertext_b64)
    
    plaintext = aesgcm.decrypt(iv, ciphertext, None)
    return json.loads(plaintext.decode('utf-8'))
