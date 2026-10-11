import io
import base64
import qrcode
from PIL import Image
from pathlib import Path
from app.config import settings

class QRService:
    def __init__(self):
        self.qr_dir = settings.QR_DIR

    def generate_verification_qr(self, document_id: str, base_frontend_url: str = None) -> tuple[str, str]:
        """
        Generates QR code embedding public verification URL.
        Returns: (file_path, base64_data_uri)
        """
        frontend_base = (base_frontend_url or settings.FRONTEND_URL).rstrip('/')
        verify_url = f"{frontend_base}/verify/{document_id}"
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
        
        file_name = f"qr_{document_id.replace('/', '_')}.png"
        file_path = self.qr_dir / file_name
        img.save(file_path)

        # Base64 string for instant embedding in frontend
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_str}"

        return str(file_path), data_uri

qr_service = QRService()
