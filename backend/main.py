import io
import base64
from pathlib import Path

import fitz  # PyMuPDF
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

app = FastAPI(title="PDF Signature API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


# ── Static signature settings (same values as the Colab script) ──────────────
SIG_WIDTH  = 90    # points
SIG_HEIGHT = 40    # points
MARGIN_X   = 20    # points: from left
MARGIN_Y   = 20    # points: from bottom


def add_signature_to_pdf(input_pdf: bytes, signature: bytes) -> bytes:
    """
    Stamp the signature image on the bottom-left corner of every page.

    Same logic as the Colab script; the only difference is that the PDF and
    the signature arrive as bytes (uploads) instead of file paths.
    """
    # Open the PDF
    doc = fitz.open(stream=input_pdf, filetype="pdf")

    # Signature image size
    sig_width = SIG_WIDTH
    sig_height = SIG_HEIGHT

    for page in doc:
        # Get page dimensions
        page_height = page.rect.height

        # Position: bottom-left corner (with margin)
        margin_x = MARGIN_X
        margin_y = MARGIN_Y

        # Define rectangle where image will be placed
        rect = fitz.Rect(
            margin_x,
            page_height - sig_height - margin_y,
            margin_x + sig_width,
            page_height - margin_y,
        )

        # Insert image
        page.insert_image(rect, stream=signature)

    # Save output
    output_buffer = io.BytesIO()
    doc.save(output_buffer)
    doc.close()
    return output_buffer.getvalue()


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "message": "PDF Signature API is running",
        "signature_settings": {
            "sig_width":  SIG_WIDTH,
            "sig_height": SIG_HEIGHT,
            "margin_x":   MARGIN_X,
            "margin_y":   MARGIN_Y,
            "position":   "bottom-left",
        },
    }



@app.post("/sign-pdf")
async def sign_pdf(
    pdf: UploadFile = File(..., description="Input PDF file"),
    signature: UploadFile = File(..., description="Signature image (PNG/JPG)"),
):
    """Accept a PDF and a signature image, stamp every page, return signed PDF."""

    # Validate PDF
    if not pdf.filename or not pdf.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a PDF.")

    # Validate signature image
    sig_ext = (signature.filename or "").lower().rsplit(".", 1)[-1]
    if sig_ext not in {"png", "jpg", "jpeg", "webp", "gif", "tiff", "bmp"}:
        raise HTTPException(
            status_code=400,
            detail="Signature must be an image file (PNG, JPG, WEBP, etc.).",
        )

    pdf_bytes = await pdf.read()
    signature_bytes = await signature.read()

    try:
        signed_bytes = add_signature_to_pdf(pdf_bytes, signature_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to sign PDF: {str(exc)}")

    safe_name = (pdf.filename or "document").replace(" ", "_").replace(".pdf", "")
    download_name = f"{safe_name}_signed.pdf"

    return StreamingResponse(
        io.BytesIO(signed_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{download_name}"'},
    )


@app.post("/preview-pdf")
async def preview_pdf(
    pdf: UploadFile = File(..., description="PDF to preview"),
    page_number: int = Form(0, description="Zero-based page index to render"),
    dpi: int = Form(150, description="Render DPI"),
):
    """Render a single PDF page as a base64 PNG for preview."""
    pdf_bytes = await pdf.read()

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        if page_number >= total_pages:
            page_number = total_pages - 1
        page = doc[page_number]
        mat = fitz.Matrix(dpi / 72, dpi / 72)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        png_bytes = pix.tobytes("png")
        doc.close()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to render PDF: {str(exc)}")

    encoded = base64.b64encode(png_bytes).decode()
    return {
        "image": f"data:image/png;base64,{encoded}",
        "page": page_number,
        "total_pages": total_pages,
    }
