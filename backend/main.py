import io
import base64
from pathlib import Path
from typing import Union

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


# ── Static signature settings ────────────────────────────────────────────────
SIG_WIDTH  = 45    # points
SIG_HEIGHT = 20    # points
MARGIN_X   = 5     # points: From left (X)
MARGIN_Y   = 5     # points: From bottom (Y)


def add_signature_to_pdf(
    input_pdf: Union[bytes, str, Path],
    arg2: Union[bytes, str, Path, None] = None,
    arg3: Union[str, Path, None] = None,
    *,
    output_pdf: Union[str, Path, None] = None,
    signature_path: Union[str, Path, None] = None,
    signature: Union[bytes, str, Path, None] = None,
) -> Union[bytes, None]:
    """
    Open the PDF and insert signature image in bottom-left corner with static margins:
      - Width: 45 pt
      - Height: 20 pt
      - From left (X): 5 pt
      - From bottom (Y): 5 pt

    Supports both web API bytes and file paths.
    """
    actual_output = output_pdf
    actual_sig = signature if signature is not None else signature_path

    if arg3 is not None:
        # Called as: add_signature_to_pdf(input_pdf, output_pdf, signature_path)
        actual_output = arg2
        actual_sig = arg3
    elif arg2 is not None:
        if isinstance(arg2, bytes):
            actual_sig = arg2
        elif actual_output is not None:
            actual_sig = arg2
        else:
            actual_sig = arg2

    # Open the PDF
    if isinstance(input_pdf, (str, Path)):
        doc = fitz.open(str(input_pdf))
    else:
        doc = fitz.open(stream=input_pdf, filetype="pdf")

    # Static settings
    sig_width = SIG_WIDTH
    sig_height = SIG_HEIGHT
    margin_x = MARGIN_X
    margin_y = MARGIN_Y

    for page in doc:
        # Get page dimensions
        page_width = page.rect.width
        page_height = page.rect.height

        # Define rectangle where image will be placed
        rect = fitz.Rect(
            margin_x,
            page_height - sig_height - margin_y,
            margin_x + sig_width,
            page_height - margin_y,
        )

        # Insert image
        if isinstance(actual_sig, (str, Path)):
            page.insert_image(rect, filename=str(actual_sig))
        elif isinstance(actual_sig, bytes):
            page.insert_image(rect, stream=actual_sig)
        else:
            raise ValueError("No valid signature image or path provided")

    # Save output
    if actual_output:
        doc.save(str(actual_output))
        doc.close()
        return None

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
