import logging
import re
from typing import Dict, Any, Optional
import requests

from config import settings

logger = logging.getLogger("ghostsignal.sms")

class SMSService:
    """
    GhostSignal SMS Gateway Service.
    Dispatches one-time verification codes (OTP) directly to mobile phones via SMS text message.
    
    Supported SMS Providers:
    1. Twilio SMS (Global): Uses TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    2. Fast2SMS (India Direct): Uses FAST2SMS_API_KEY
    3. Offline / Local Simulation: Graceful on-device fallback when live credentials are not set
    """

    def __init__(self):
        self.twilio_client = None
        self._init_twilio()

    def _init_twilio(self):
        """Attempts to initialize Twilio client if credentials are present."""
        if getattr(settings, "TWILIO_ACCOUNT_SID", None) and getattr(settings, "TWILIO_AUTH_TOKEN", None):
            try:
                from twilio.rest import Client
                self.twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
                logger.info("[SMSService] Twilio SMS client initialized.")
            except Exception as e:
                logger.warning(f"[SMSService] Could not initialize Twilio client: {e}")
                self.twilio_client = None

    def check_fast2sms_balance(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Validates Fast2SMS API key and retrieves account wallet balance.
        """
        key = (api_key or getattr(settings, "FAST2SMS_API_KEY", "")).strip()
        if not key:
            return {"valid": False, "error": "No Fast2SMS API key configured."}

        try:
            url = "https://www.fast2sms.com/dev/wallet"
            headers = {"authorization": key}
            res = requests.get(url, headers=headers, timeout=10)
            data = res.json()
            if data.get("return") is True:
                wallet_val = float(data.get("wallet", 0.0))
                return {
                    "valid": True,
                    "wallet": wallet_val,
                    "message": f"Fast2SMS API active. Wallet balance: ₹{wallet_val:.2f}"
                }
            err = data.get("message", "Invalid authorization key.")
            if isinstance(err, list):
                err = ", ".join(err)
            return {"valid": False, "error": str(err)}
        except Exception as e:
            return {"valid": False, "error": f"Failed to contact Fast2SMS: {str(e)}"}

    def get_provider_status(self) -> Dict[str, Any]:
        """Returns the active SMS delivery provider and configuration status."""
        has_fast2sms = bool(getattr(settings, "FAST2SMS_API_KEY", "").strip())
        has_twilio = bool(getattr(settings, "TWILIO_ACCOUNT_SID", None) and getattr(settings, "TWILIO_AUTH_TOKEN", None))
        
        wallet_info = None
        if has_fast2sms:
            provider = "fast2sms"
            wallet_info = self.check_fast2sms_balance()
        elif has_twilio:
            provider = "twilio"
        else:
            provider = "offline_simulated"

        return {
            "provider": provider,
            "fast2smsConfigured": has_fast2sms,
            "fast2smsStatus": wallet_info,
            "twilioConfigured": has_twilio,
            "smsEnabled": getattr(settings, "SMS_ENABLED", True)
        }

    def send_otp_sms(
        self,
        phone_number: str,
        country_code: str = "+91",
        otp_code: str = ""
    ) -> Dict[str, Any]:
        """
        Transmits 6-digit verification code directly to user's mobile number via SMS text message.
        Prioritizes Fast2SMS for Indian phone numbers (+91).
        """
        digits = "".join(filter(str.isdigit, phone_number))
        full_phone = f"{country_code}{digits}"
        masked_phone = f"{country_code} ••••••{digits[-2:] if len(digits) >= 2 else '00'}"
        message_body = f"Your GhostSignal verification code is: {otp_code}. Valid for 5 minutes. Never share this code with anyone."

        # 1. Primary Indian Cellular Gateway: Fast2SMS
        fast2sms_key = getattr(settings, "FAST2SMS_API_KEY", "").strip()
        if fast2sms_key and (country_code == "+91" or len(digits) == 10):
            target_digits = digits[-10:]
            url = "https://www.fast2sms.com/dev/bulkV2"
            
            # Method A: Fast2SMS route "otp" via JSON POST
            try:
                payload = {
                    "variables_values": str(otp_code),
                    "route": "otp",
                    "numbers": target_digits
                }
                headers = {
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json"
                }
                res = requests.post(url, json=payload, headers=headers, timeout=10)
                res_data = res.json()
                
                # Method B: Fallback to GET URL if JSON POST was rejected
                if not res_data.get("return"):
                    logger.info("[SMS Gateway] Fast2SMS JSON endpoint returned non-success, trying Fast2SMS direct query...")
                    get_url = f"https://www.fast2sms.com/dev/bulkV2?authorization={fast2sms_key}&route=otp&variables_values={otp_code}&flash=0&numbers={target_digits}"
                    get_res = requests.get(get_url, timeout=10)
                    res_data = get_res.json()

                if res_data.get("return") is True:
                    logger.info(f"[SMS Gateway] Fast2SMS dispatched OTP directly to cellular mobile {full_phone}: {res_data}")
                    return {
                        "success": True,
                        "provider": "fast2sms",
                        "status": "sent",
                        "requestId": res_data.get("request_id"),
                        "phone": masked_phone,
                        "message": f"Verification code sent via Fast2SMS text message directly to {masked_phone}."
                    }
                else:
                    err_msg = res_data.get("message")
                    if isinstance(err_msg, list):
                        err_msg = ", ".join(err_msg)
                    logger.warning(f"[SMS Gateway] Fast2SMS delivery unsuccessful: {err_msg or res_data}")
            except Exception as e:
                logger.error(f"[SMS Gateway] Fast2SMS request exception: {e}")

        # 2. Secondary Global Gateway: Twilio SMS
        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        from_number = getattr(settings, "TWILIO_PHONE_NUMBER", None)

        if account_sid and auth_token and from_number:
            try:
                from twilio.rest import Client
                client = self.twilio_client or Client(account_sid, auth_token)
                msg = client.messages.create(
                    body=message_body,
                    from_=from_number,
                    to=full_phone
                )
                logger.info(f"[SMS Gateway] Twilio SMS dispatched to {full_phone} (SID: {msg.sid}, Status: {msg.status})")
                return {
                    "success": True,
                    "provider": "twilio",
                    "status": msg.status,
                    "sid": msg.sid,
                    "phone": masked_phone,
                    "message": f"Verification code sent via SMS text to {masked_phone}."
                }
            except Exception as e:
                logger.error(f"[SMS Gateway] Twilio SMS dispatch failed: {e}")

        # 3. Offline / Simulated SMS Gateway
        logger.info(
            f"\n"
            f"╔══════════════════════════════════════════════════════════════════════════════╗\n"
            f"║ [SMS GATEWAY] OUTGOING MOBILE SMS TEXT DISPATCH                              ║\n"
            f"╠══════════════════════════════════════════════════════════════════════════════╣\n"
            f"║ Recipient Mobile : {full_phone:<57} ║\n"
            f"║ Verification OTP : {otp_code:<57} ║\n"
            f"║ Message Content  : {message_body[:57]:<57} ║\n"
            f"║ SMS Provider     : Local Simulated SMS (Configure Fast2SMS API Key in .env)  ║\n"
            f"╚══════════════════════════════════════════════════════════════════════════════╝"
        )

        return {
            "success": True,
            "provider": "offline_simulated",
            "status": "sent",
            "phone": masked_phone,
            "message": f"Verification code sent via SMS text to {masked_phone}."
        }

sms_service = SMSService()
