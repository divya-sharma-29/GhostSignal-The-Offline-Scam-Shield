import json
import base64
from pathlib import Path
from typing import Tuple, Dict, Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
from config import settings

class SignatureVerifier:
    """
    Ed25519 Cryptographic Signature Verifier.
    Ensures that security rule updates originate strictly from trusted GhostSignal maintainers.
    Rejects unsigned, tampered, or corrupted rule packages.
    """

    def __init__(self, public_key_path: Path = None):
        self.public_key_path = public_key_path or settings.PUBLIC_KEY_PATH
        self.public_key = None
        self._load_public_key()

    def _load_public_key(self):
        """Loads trusted Ed25519 public key from PEM file."""
        if self.public_key_path and Path(self.public_key_path).exists():
            try:
                with open(self.public_key_path, "rb") as f:
                    self.public_key = serialization.load_pem_public_key(f.read())
            except Exception as e:
                print(f"[SignatureVerifier] Warning: Failed to load public key from {self.public_key_path}: {e}")
        else:
            # If no public key file exists yet, generate a default trusted public key and save it
            self._generate_default_public_key()

    def _generate_default_public_key(self):
        """Generates an initial trusted public key for local verification."""
        try:
            self.public_key_path.parent.mkdir(parents=True, exist_ok=True)
            # Create a dedicated Ed25519 keypair for default verification
            private_key = ed25519.Ed25519PrivateKey.generate()
            public_key = private_key.public_key()
            
            pem_pub = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            with open(self.public_key_path, "wb") as f:
                f.write(pem_pub)
                
            self.public_key = public_key
            print(f"[SignatureVerifier] Initialized trusted Ed25519 public key at {self.public_key_path}")
        except Exception as e:
            print(f"[SignatureVerifier] Could not auto-generate public key: {e}")

    @staticmethod
    def canonical_json_bytes(data: Dict[str, Any]) -> bytes:
        """
        Produces deterministic canonical JSON serialization for signing and verification.
        Ensures identical byte sequence regardless of key order or whitespace.
        """
        return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')

    def verify_signature(self, payload_dict: Dict[str, Any], signature_b64: str) -> Tuple[bool, str]:
        """
        Verifies Ed25519 digital signature of a payload.
        """
        if not self.public_key:
            self._load_public_key()
            if not self.public_key:
                return False, "Trusted public key is not available on this device."

        try:
            signature_bytes = base64.b64decode(signature_b64)
            canonical_bytes = self.canonical_json_bytes(payload_dict)
            self.public_key.verify(signature_bytes, canonical_bytes)
            return True, "Cryptographic signature verified successfully."
        except Exception as e:
            return False, f"Signature verification failed: Tampered or invalid signature ({str(e)})."

signature_verifier = SignatureVerifier()

