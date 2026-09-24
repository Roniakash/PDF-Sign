# PDF Signer

A full-stack PDF signing app built with **FastAPI (Python)** + **React + TypeScript (Vite)**.

## Features

- 📄 Drag-and-drop PDF upload
- ✏️ Freehand signature drawing (canvas) with ink colour picker
- 🖼️ Upload a signature image (PNG/JPG/WEBP)
- ⚙️ Choose signature position (bottom-left / bottom-right / top-left / top-right) and size
- 🔍 Live PDF page preview (rendered by PyMuPDF on the backend)
- ⬇️ Download the signed PDF

## Project Structure

```text
PDF-Signature/
├── backend/
│   ├── main.py            # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts
    │   ├── types.ts
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── PdfUploader.tsx
    │   │   ├── SignaturePad.tsx
    │   │   ├── SettingsPanel.tsx
    │   │   ├── GenerateCard.tsx
    │   │   ├── PdfPreview.tsx
    │   │   └── ToastContainer.tsx
    │   └── index.css
    ├── Dockerfile
    ├── nginx.conf
    └── vite.config.ts
```

## Quick Start

### 1 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2 — Frontend

```bash
cd frontend
npm install      # if not already done
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Docker (production)

```bash
docker compose up --build
```

The Nginx container will serve the React app on port **80** and proxy `/api/*` calls to the FastAPI backend automatically.

## How it works

1. Upload a PDF → the backend renders page 1 as a PNG for preview.
2. Draw or upload a signature.
3. Adjust position/size in Settings.
4. Click **Generate signed PDF** → backend stamps every page and returns the signed PDF blob.
5. Click **Download signed PDF**.
