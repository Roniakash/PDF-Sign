import React from 'react'

interface HeaderProps {
  today: string
}

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

export const Header: React.FC<HeaderProps> = ({ today }) => {
  return (
    <header className="app-header" role="banner">
      {/* ── Left: Title block ── */}
      <div className="header-brand">
        <div className="header-title-block">
          <span className="header-breadcrumb">ADMIN · DOCUMENTS</span>
          <h1 className="header-title">Sign a PDF</h1>
        </div>
      </div>

      {/* ── Right: Date badge ── */}
      <div className="header-date-badge" aria-label={`Today is ${today}`}>
        <CalendarIcon />
        <div className="header-date-text">
          <span className="header-date-label">TODAY</span>
          <span className="header-date-value">{today}</span>
        </div>
      </div>
    </header>
  )
}
