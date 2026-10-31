"""
GhostSignal — Synthetic Scam & Security Dataset Generator for SmolLM3-3B Fine-Tuning.

Generates high-quality synthetic instruction-tuning pairs in ChatML JSONL format
specifically designed for training small language models (like SmolLM3-3B)
to perform offline cybersecurity scam detection and explainable risk analysis.
Supports loading user curated synthetic CSV datasets automatically.
"""

import json
import random
from pathlib import Path

SYSTEM_PROMPT = (
    "You are GhostSignal AI, an offline cybersecurity scam detection model. "
    "Analyze the provided message, detect disguised threats, zero-width/homoglyph obfuscations, "
    "credential theft, and artificial urgency. Output your verdict in strict JSON format with keys: "
    "risk_level (LOW, MEDIUM, HIGH), risk_score (0-100), scam_type, red_flags (list of strings), "
    "obfuscation_type, explanation, and recommended_action."
)

SCAM_TEMPLATES = [
    {
        "templates": [
            "URGENT: Your {bank} account has been suspended due to pending KYC verification. Click {url} to complete your verification within 24 hours.",
            "Dear Customer, your {bank} net banking is blocked. Update your K.Y.C immediately at {url} to resume services.",
            "Action Required: SBI YONO access expired. Verify your Aadhaar and PAN at {url} to prevent account closure.",
            "Important alert from {bank}: Your debit card will be deactivated tonight. Update your KYC details now at {url}."
        ],
        "category": "bank_impersonation",
        "level": "HIGH",
        "score_range": (85, 100),
        "threats": ["bank_impersonation", "credential_request_or_account_threat", "urgency"]
    },
    {
        "templates": [
            "Your {bank} account verification code is 849201. Do not share this OTP with anyone except the {bank} executive on call to unlock your funds.",
            "Security Notice: We detected an unauthorized login to your account. Share the 6-digit OTP sent to your phone with our support agent to cancel the transfer.",
            "Dear user, your refund of Rs. {amount} is waiting. Share your one-time password (OTP) with support to claim it now.",
            "ALERT: Someone is trying to access your net banking. To block this access immediately, reply with your OTP."
        ],
        "category": "otp_theft",
        "level": "HIGH",
        "score_range": (90, 100),
        "threats": ["credential_theft", "otp_request", "urgency"]
    },
    {
        "templates": [
            "Congratulations! You won a cash prize of Rs. {amount} on PhonePe. Click here {url} and enter your secret UPI PIN to receive the money in your bank.",
            "Payment of Rs. {amount} has been credited to your Google Pay. Scan the attached QR code and approve with UPI PIN to accept credit.",
            "You have a pending cashback of Rs. {amount}. Approve the collect request on Paytm app with your PIN to receive funds instantly."
        ],
        "category": "upi_payment_scam",
        "level": "HIGH",
        "score_range": (80, 95),
        "threats": ["payment_manipulation", "upi_pin_or_collect_request"]
    },
    {
        "templates": [
            "Dear Consumer, your electricity power connection will be disconnected tonight at 9:30 PM due to unpaid previous month bill. Call electricity officer at {phone} immediately.",
            "प्रिय उपभोक्ता, आपके बिजली कनेक्शन को आज रात 9:30 बजे काट दिया जाएगा क्योंकि पिछला बिल अपडेट नहीं है। तुरंत संपर्क करें {phone}.",
            "Urgent: Water supply connection suspension notice. Clear your dues at {url} before 6 PM to prevent disconnection."
        ],
        "category": "urgency_payment_pressure",
        "level": "HIGH",
        "score_range": (85, 98),
        "threats": ["discourages_verification", "payment_pressure", "urgency"]
    },
    {
        "templates": [
            "Urgent: Your sbi․com account blocked. Update kyc on рауtm app immediately or 0TP will expire.",
            "Your bаnk account has been suspended! Update K.Y.C at http://192.168.1.1/update to unblock.",
            "Alert: Your Аmаzon order cannot be delivered. Confirm address at http://xn--amazn-r11a.info or order cancelled."
        ],
        "category": "lookalike_link",
        "level": "HIGH",
        "score_range": (90, 100),
        "threats": ["suspicious_link", "urgency_or_reward_bait"]
    }
]

CLEAN_TEMPLATES = [
    {
        "templates": [
            "Dear Customer, INR {amount}.00 has been debited from your account ending in {acc} on {date}. Info: UPI/Merchant. If not done by you, SMS BLOCK to 567676.",
            "Your OTP for login to SBI NetBanking is {otp}. Valid for 10 minutes. NEVER share this OTP or your password with anyone, including bank staff.",
            "Dear Customer, your salary of INR {amount}.00 has been credited to your account {acc} on {date}. Available balance: INR {bal}.00.",
            "Statement for your HDFC Credit Card ending in {acc} for the cycle ending {date} is now generated. Total due: INR {amount}."
        ],
        "category": "benign",
        "level": "LOW",
        "score_range": (0, 15),
        "threats": []
    },
    {
        "templates": [
            "Your Swiggy order #{order_id} has been delivered. Enjoy your meal! Rate your delivery partner on the app.",
            "Your appointment with Dr. Sharma is confirmed for tomorrow at 10:30 AM at Apex Clinic. For cancellations, reply CANCEL.",
            "Your delivery is scheduled for tomorrow. No payment is required at this stage.",
            "Your service request REF{order_id} has been updated to 'completed'. Sign in through the official app to view the details."
        ],
        "category": "benign",
        "level": "LOW",
        "score_range": (0, 10),
        "threats": []
    }
]

BANKS = ["Northstar Bank", "Cedar Cooperative Bank", "Pioneer Digital Bank", "Metro Bank", "CampusConnect"]
URLS = ["https://parcel-fee.example.test/pay", "https://upi-refund.example.test", "https://account-security.example.test/login", "https://cedar-bank-check.example.test"]
PHONES = ["9876543210", "8823411200", "7001239841"]

def build_dataset(total_samples=1000, output_dir="backend/training/data"):
    # If user synthetic CSV exists, prioritize processing it
    csv_path = Path(output_dir) / "synthetic_scam_dataset.csv"
    if csv_path.exists():
        from training.process_dataset import convert_csv_to_jsonl
        print(f"Detected curated synthetic dataset CSV at {csv_path}. Processing into JSONL splits...")
        convert_csv_to_jsonl(str(csv_path), output_dir)
        return

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    samples = []
    num_scams = int(total_samples * 0.65)
    num_clean = total_samples - num_scams

    for _ in range(num_scams):
        group = random.choice(SCAM_TEMPLATES)
        template = random.choice(group["templates"])
        text = template.format(
            bank=random.choice(BANKS), url=random.choice(URLS), phone=random.choice(PHONES),
            amount=random.randint(500, 50000), acc=f"{random.randint(1000, 9999)}",
            bal=random.randint(1000, 200000), date=f"{random.randint(1, 28)}-10-2026",
            otp=f"{random.randint(100000, 999999)}", order_id=f"{random.randint(1000000, 9999999)}"
        )
        assistant_reply = json.dumps({
            "risk_level": group["level"],
            "risk_score": random.randint(group["score_range"][0], group["score_range"][1]),
            "scam_type": group["category"],
            "red_flags": group["threats"],
            "obfuscation_type": "none",
            "explanation": f"Characteristics of {group['category']}. Psychological pressure or credential harvesting.",
            "recommended_action": "Do not click, pay, or share credentials. Call 1930 for financial fraud."
        }, indent=2)
        samples.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this message for scam indicators:\n\"\"\"{text}\"\"\""},
                {"role": "assistant", "content": assistant_reply}
            ]
        })

    for _ in range(num_clean):
        group = random.choice(CLEAN_TEMPLATES)
        template = random.choice(group["templates"])
        text = template.format(
            bank=random.choice(BANKS), url=random.choice(URLS), phone=random.choice(PHONES),
            amount=random.randint(500, 50000), acc=f"{random.randint(1000, 9999)}",
            bal=random.randint(1000, 200000), date=f"{random.randint(1, 28)}-10-2026",
            otp=f"{random.randint(100000, 999999)}", order_id=f"{random.randint(1000000, 9999999)}"
        )
        assistant_reply = json.dumps({
            "risk_level": "LOW",
            "risk_score": random.randint(group["score_range"][0], group["score_range"][1]),
            "scam_type": "benign",
            "red_flags": [],
            "obfuscation_type": "none",
            "explanation": "Routine informational wording without fraudulent pressure.",
            "recommended_action": "Routine notification; no urgent action required."
        }, indent=2)
        samples.append({
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this message for scam indicators:\n\"\"\"{text}\"\"\""},
                {"role": "assistant", "content": assistant_reply}
            ]
        })

    random.shuffle(samples)
    split_idx = int(len(samples) * 0.85)
    train_data = samples[:split_idx]
    eval_data = samples[split_idx:]

    train_file = out_path / "train_scam_dataset.jsonl"
    eval_file = out_path / "eval_scam_dataset.jsonl"

    with open(train_file, "w", encoding="utf-8") as f:
        for item in train_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
    with open(eval_file, "w", encoding="utf-8") as f:
        for item in eval_data:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")

if __name__ == "__main__":
    build_dataset()
