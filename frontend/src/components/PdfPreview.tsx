import React from 'react'

interface PdfPreviewProps {
  previewImage: string | null           // base64 data URI of the current page
  isLoading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (delta: number) => void
  mode: 'original' | 'signed'
  signedPdfUrl: string | null
}

const DocIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  previewImage,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  mode,
  signedPdfUrl,
}) => {
  return (
    <div className="preview-card">
      {/* Header */}
      <div className="preview-header">
        <div className="preview-title-row">
          <h2 className="preview-title">Preview</h2>
          <span className={`preview-mode-badge ${mode}`}>
            {mode === 'original' ? 'Original' : '✨ Signed'}
          </span>
          {totalPages > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              · {totalPages} page{totalPages !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="preview-nav" aria-label="Page navigation">
            <button
              className="btn btn-outline"
              onClick={() => onPageChange(-1)}
              disabled={currentPage <= 0}
              id="prev-page-btn"
              style={{ padding: '6px 10px' }}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </button>
            <span className="preview-page-info" aria-live="polite">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              className="btn btn-outline"
              onClick={() => onPageChange(1)}
              disabled={currentPage >= totalPages - 1}
              id="next-page-btn"
              style={{ padding: '6px 10px' }}
              aria-label="Next page"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="preview-body" id="preview-body">
        {isLoading ? (
          <div className="preview-pdf-spinner">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <span>Rendering page…</span>
          </div>
        ) : previewImage ? (
          <img
            src={previewImage}
            alt={`PDF page ${currentPage + 1} preview`}
            className="preview-pdf-img"
          />
        ) : (
          <div className="preview-empty">
            <div className="preview-empty-icon">
              <DocIcon />
            </div>
            <h3>Your PDF will appear here</h3>
            <p>Upload a PDF in step 1, or drop it anywhere on this area.</p>
          </div>
        )}
      </div>

      {/* Result banner */}
      {signedPdfUrl && mode === 'signed' && (
        <div className="result-banner">
          <div className="result-banner-text">
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <h4>Signed PDF is ready!</h4>
              <p>Signature applied to all {totalPages} page{totalPages !== 1 ? 's' : ''}.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
