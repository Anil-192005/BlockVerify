import os
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

from app.config import settings

def generate_certificate_pdf(
    recipient_name: str,
    recipient_id: str,
    document_type: str,
    organization_name: str,
    document_id: str,
    qr_image_path: str,
    issued_date_str: str = None
) -> str:
    """
    Renders an educational certificate in Landscape Letter with golden borders,
    formal typography, and the verification QR code embedded in the bottom-right corner.
    """
    if not issued_date_str:
        issued_date_str = datetime.now().strftime("%B %d, %Y")

    file_name = f"cert_{document_id.replace('/', '_')}.pdf"
    pdf_path = settings.CERT_DIR / file_name

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    org_style = ParagraphStyle(
        'OrgHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_CENTER
    )

    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#2563eb'),
        alignment=TA_CENTER
    )

    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=18,
        textColor=colors.HexColor('#334155'),
        alignment=TA_CENTER
    )

    name_style = ParagraphStyle(
        'RecipientName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1e293b'),
        alignment=TA_CENTER
    )

    meta_style = ParagraphStyle(
        'CertMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b'),
        alignment=TA_LEFT
    )

    elements = []
    elements.append(Spacer(1, 15))
    elements.append(Paragraph(organization_name.upper(), org_style))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("OFFICIAL CREDENTIAL OF AUTHENTICITY", ParagraphStyle('Sub', parent=body_style, fontSize=9, textColor=colors.HexColor('#64748b'))))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(document_type.upper(), title_style))
    elements.append(Spacer(1, 16))
    elements.append(Paragraph("This is to certify that", body_style))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(recipient_name, name_style))
    
    if recipient_id:
        elements.append(Spacer(1, 4))
        elements.append(Paragraph(f"Registration / USN: <b>{recipient_id}</b>", body_style))
        
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(
        f"has successfully completed the prescribed curriculum and requirements as evaluated by the Board of Examiners, and is hereby awarded this official credential with all honors and privileges pertaining thereto.",
        body_style
    ))
    elements.append(Spacer(1, 25))

    # Footer row with signatures, Document ID, and QR code
    meta_text = f"""
    <b>Document ID:</b> {document_id}<br/>
    <b>Date of Issue:</b> {issued_date_str}<br/>
    <b>Blockchain:</b> Ethereum Sepolia / EVM<br/>
    <b>Status:</b> Cryptographically Anchored
    """
    
    qr_img = RLImage(qr_image_path, width=75, height=75) if os.path.exists(qr_image_path) else Paragraph("", meta_style)

    sign_text = """
    ____________________________<br/>
    <b>Registrar / Authorized Dean</b><br/>
    Academic Affairs
    """

    footer_data = [
        [Paragraph(meta_text, meta_style), Paragraph(sign_text, ParagraphStyle('Sign', parent=body_style, fontSize=10, leading=14)), qr_img]
    ]

    footer_table = Table(footer_data, colWidths=[280, 320, 100])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
    ]))

    elements.append(footer_table)

    # Build PDF
    doc.build(elements)
    return str(pdf_path)
