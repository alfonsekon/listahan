import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './ShareModal.css'

export function ShareModal({ isOpen, onClose, listId, listName }) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareUrl = `${window.location.origin}/list/${listId}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content share-modal">
        <h2>Share "{listName}"</h2>
        
        <div className="share-url-section">
          <label>Shareable Link</label>
          <div className="url-row">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="share-url-input"
              autocomplete="off"
            />
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="qr-section">
          <label>QR Code</label>
          <div className="qr-container">
            <QRCodeSVG
              value={shareUrl}
              size={160}
              level={"M"}
              includeMargin={false}
            />
          </div>
          <p className="qr-hint">Scan to view this list</p>
        </div>

        <div className="modal-actions">
          <button className="close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
