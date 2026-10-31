"""
GhostSignal Ed25519 Security Rule Signing Utility.
Usage:
    python tools/sign_rules.py generate-keys
    python tools/sign_rules.py sign <rules_json_path> <version> [private_key_path]
"""

import sys
import json
import base64
from pathlib import Path
from datetime import datetime, timezone, timedelta
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

# Add parent to path for importing services if needed
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

def generate_keypair(output_dir: Path):
    """Generates Ed25519 private and public keys."""
    output_dir.mkdir(parents=True, exist_ok=True)
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    priv_path = output_dir / "ed25519_private.pem"
    pub_path = output_dir / "ed25519_public.pem"

    with open(priv_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))

    with open(pub_path, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))

    print(f"[+] Successfully generated Ed25519 keys:")
    print(f"    Private key (KEEP SECRET): {priv_path}")
    print(f"    Public key (Embed in app): {pub_path}")

def canonical_json_bytes(data: dict) -> bytes:
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')

def sign_rules_package(rules_file: Path, version: str, private_key_path: Path):
    """Signs a security rules file and outputs a signed update package."""
    if not rules_file.exists():
        print(f"[-] Rules file '{rules_file}' not found.")
        return

    if not private_key_path.exists():
        print(f"[-] Private key '{private_key_path}' not found. Run generate-keys first.")
        return

    with open(private_key_path, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    with open(rules_file, "r", encoding="utf-8") as f:
        rules_data = json.load(f)

    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=90)  # Package expires in 90 days

    payload_to_sign = {
        "version": version,
        "rules": rules_data,
        "timestamp": now.isoformat(),
        "expiresAt": expires.isoformat()
    }

    canonical_bytes = canonical_json_bytes(payload_to_sign)
    signature_bytes = private_key.sign(canonical_bytes)
    signature_b64 = base64.b64encode(signature_bytes).decode('utf-8')

    signed_package = {
        "version": version,
        "rules": rules_data,
        "signature": signature_b64,
        "timestamp": now.isoformat(),
        "expiresAt": expires.isoformat(),
        "release_notes": f"GhostSignal Verified Rule Definitions Update v{version}"
    }

    output_pkg_path = rules_file.parent / f"signed_update_{version}.json"
    with open(output_pkg_path, "w", encoding="utf-8") as f:
        json.dump(signed_package, f, indent=2, ensure_ascii=False)

    print(f"[+] Successfully signed rules for version {version}:")
    print(f"    Output package: {output_pkg_path}")
    print(f"    Signature: {signature_b64[:32]}...")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1].lower()
    base_dir = Path(__file__).resolve().parent.parent

    if cmd == "generate-keys":
        generate_keypair(base_dir / "rules")
    elif cmd == "sign":
        if len(sys.argv) < 4:
            print("Usage: python tools/sign_rules.py sign <rules_json_path> <version> [private_key_path]")
            sys.exit(1)
        r_path = Path(sys.argv[2])
        v_num = sys.argv[3]
        priv_p = Path(sys.argv[4]) if len(sys.argv) > 4 else base_dir / "rules" / "ed25519_private.pem"
        sign_rules_package(r_path, v_num, priv_p)
    else:
        print(__doc__)

