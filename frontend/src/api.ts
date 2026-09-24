import axios from 'axios'

const BASE = 'http://localhost:8000'

/** Render a PDF page as a base64 PNG image. */
export async function previewPdfPage(
  pdfFile: File | Blob,
  pageNumber: number,
  dpi = 150,
): Promise<{ image: string; page: number; total_pages: number }> {
  const form = new FormData()
  form.append('pdf', pdfFile instanceof File ? pdfFile : new File([pdfFile], 'document.pdf'))
  form.append('page_number', String(pageNumber))
  form.append('dpi', String(dpi))

  const res = await axios.post(`${BASE}/preview-pdf`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/**
 * Sign a PDF — signature placement is controlled entirely by the backend.
 * Returns the signed PDF as a Blob.
 */
export async function signPdf(pdfFile: File, signatureBlob: Blob): Promise<Blob> {
  const form = new FormData()
  form.append('pdf', pdfFile)
  form.append('signature', signatureBlob, 'signature.png')

  const res = await axios.post(`${BASE}/sign-pdf`, form, {
    responseType: 'blob',
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/** Health check */
export async function healthCheck(): Promise<boolean> {
  try {
    await axios.get(`${BASE}/health`, { timeout: 3000 })
    return true
  } catch {
    return false
  }
}
