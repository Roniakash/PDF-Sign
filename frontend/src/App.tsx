import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { PdfUploader } from './components/PdfUploader'
import { SignaturePad } from './components/SignaturePad'
import { GenerateCard } from './components/GenerateCard'
import { PdfPreview } from './components/PdfPreview'
import { ToastContainer } from './components/ToastContainer'
import { previewPdfPage, signPdf, healthCheck } from './api'
import type { Toast } from './types'



function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

let toastId = 0

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null)

  // Preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [previewMode, setPreviewMode] = useState<'original' | 'signed'>('original')

  // Signed result
  const [isGenerating, setIsGenerating] = useState(false)
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null)
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null)
  const [signedFileName, setSignedFileName] = useState('signed.pdf')

  // Backend status
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = String(++toastId)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const removeToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  // Check backend health on mount
  useEffect(() => {
    healthCheck().then((ok) => {
      setBackendOnline(ok)
      if (!ok) addToast('Backend is offline. Start the Python server first.', 'error')
    })
  }, [])

  // Fetch preview when PDF or page changes
  const fetchPreview = useCallback(
    async (file: File | Blob, page: number, isSignedPdf = false) => {
      setPreviewLoading(true)
      try {
        const data = await previewPdfPage(file, page)
        setPreviewImage(data.image)
        setTotalPages(data.total_pages)
        setCurrentPage(data.page)
        setPreviewMode(isSignedPdf ? 'signed' : 'original')
      } catch (err) {
        addToast('Could not render PDF preview. Is the backend running?', 'error')
      } finally {
        setPreviewLoading(false)
      }
    },
    [],
  )

  // When a new PDF is selected, preview page 0
  const handlePdfSelected = (file: File) => {
    setPdfFile(file)
    setSignedPdfBlob(null)
    setSignedPdfUrl(null)
    setCurrentPage(0)
    fetchPreview(file, 0, false)
  }

  // Page nav
  const handlePageChange = (delta: number) => {
    const newPage = currentPage + delta
    if (newPage < 0 || newPage >= totalPages) return
    const sourceFile = previewMode === 'signed' && signedPdfBlob ? signedPdfBlob : pdfFile
    if (sourceFile) fetchPreview(sourceFile, newPage, previewMode === 'signed')
  }

  // Generate signed PDF
  const handleGenerate = async () => {
    if (!pdfFile || !signatureBlob) return
    setIsGenerating(true)
    try {
      const blob = await signPdf(pdfFile, signatureBlob)
      const url = URL.createObjectURL(blob)
      setSignedPdfBlob(blob)
      setSignedPdfUrl(url)
      const safeName = pdfFile.name.replace('.pdf', '') + '_signed.pdf'
      setSignedFileName(safeName)
      addToast('PDF signed successfully! 🎉', 'success')
      // Show signed preview
      fetchPreview(blob, 0, true)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to sign PDF. Check the backend logs.'
      addToast(msg, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerate = !!pdfFile && !!signatureBlob && backendOnline === true

  return (
    <>
      <Header today={formatDate(new Date())} />

      {/* Backend offline banner */}
      {backendOnline === false && (
        <div
          style={{
            background: 'linear-gradient(90deg, #fef2f2, #fee2e2)',
            borderBottom: '1px solid #fca5a5',
            padding: '10px 2.5rem',
            fontSize: 13,
            fontWeight: 600,
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          role="alert"
        >
          ⚠️ Backend is offline — run{' '}
          <code
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: 4,
              padding: '1px 6px',
              fontFamily: 'monospace',
            }}
          >
            uvicorn main:app --reload
          </code>{' '}
          in the <code style={{ fontFamily: 'monospace' }}>backend/</code> folder.
        </div>
      )}

      <main className="app-main" role="main">
        {/* TOP ROW — 3 cards side by side */}
        <div className="top-cards-row">
          <PdfUploader onFileSelected={handlePdfSelected} pdfFile={pdfFile} />
          <SignaturePad onSignatureReady={setSignatureBlob} signatureBlob={signatureBlob} />
          <GenerateCard
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            signedPdfUrl={signedPdfUrl}
            signedFileName={signedFileName}
            onGenerate={handleGenerate}
          />
        </div>

        {/* PREVIEW ROW — full width */}
        <div className="preview-row">
          <PdfPreview
            previewImage={previewImage}
            isLoading={previewLoading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            mode={previewMode}
            signedPdfUrl={signedPdfUrl}
          />
        </div>
      </main>

      <footer className="app-footer">
        PDF Signer · Powered by PyMuPDF &amp; FastAPI · All processing is local
      </footer>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  )
}
