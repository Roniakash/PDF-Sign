import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface PdfUploaderProps {
  onFileSelected: (file: File) => void
  pdfFile: File | null
}

const UploadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const PdfUploader: React.FC<PdfUploaderProps> = ({ onFileSelected, pdfFile }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0])
    }
  }, [onFileSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-step-badge">1</div>
        <h2 className="card-title">Add a PDF</h2>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone-area ${isDragActive ? 'drag-over' : ''}`}
        id="pdf-dropzone"
        role="button"
        aria-label="Upload PDF file"
        tabIndex={0}
      >
        <input {...getInputProps()} id="pdf-file-input" accept=".pdf" />
        <div className="dropzone-icon">
          <UploadIcon />
        </div>
        <p className="dropzone-label">
          {isDragActive ? 'Drop your PDF here' : 'Choose a PDF or drag it here'}
        </p>
        <p className="dropzone-sublabel">Only .pdf files are accepted</p>

        {pdfFile && (
          <div className="dropzone-file-name" onClick={(e) => e.stopPropagation()}>
            <CheckIcon />
            {pdfFile.name}
          </div>
        )}
      </div>
    </div>
  )
}
