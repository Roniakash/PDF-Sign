import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface SignaturePadProps {
  onSignatureReady: (blob: Blob | null) => void
  signatureBlob: Blob | null
}

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureReady, signatureBlob }) => {
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setUploadedPreview(url)
    onSignatureReady(file)
  }, [onSignatureReady])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
  })

  const handleRemove = () => {
    setUploadedPreview(null)
    onSignatureReady(null)
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-step-badge">2</div>
        <h2 className="card-title">Add your signature</h2>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`sig-upload-area ${isDragActive ? 'drag-over' : ''} ${uploadedPreview ? 'has-preview' : ''}`}
        id="signature-upload-dropzone"
        aria-label="Upload signature image"
      >
        <input {...getInputProps()} id="signature-file-input" />

        {uploadedPreview ? (
          <img
            src={uploadedPreview}
            alt="Signature preview"
            className="sig-preview"
          />
        ) : (
          <>
            <div className="dropzone-icon" style={{ margin: '0 auto 0.75rem' }}>
              <ImageIcon />
            </div>
            <p className="dropzone-label">
              {isDragActive ? 'Drop your signature image here' : 'Click or drag to upload signature'}
            </p>
            <p className="dropzone-sublabel">PNG, JPG, WEBP supported</p>
          </>
        )}
      </div>

      {/* Status / actions row */}
      {uploadedPreview ? (
        <div className="btn-row" style={{ marginTop: '0.75rem' }}>
          <span className="status-pill success" style={{ flex: 1 }}>
            <CheckIcon /> Signature ready
          </span>
          <button
            className="btn btn-danger"
            onClick={handleRemove}
            id="remove-sig-btn"
            type="button"
          >
            <TrashIcon /> Remove
          </button>
        </div>
      ) : (
        <p className="generate-hint" style={{ marginTop: '0.6rem' }}>
          Upload a PNG or JPG of your signature.
        </p>
      )}
    </div>
  )
}
