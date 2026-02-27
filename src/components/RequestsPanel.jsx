import { useState, useEffect, useRef } from 'react'
import './RequestsPanel.css'

function formatTimeAgo(timestamp) {
  if (!timestamp) return ''
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function RequestsPanel({ isOpen, onClose, requests, onAccept, onReject, items }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const resolvedRequests = requests.filter((r) => r.status !== 'pending')

  const getItemName = (itemId) => {
    const item = items?.find((i) => i.id === itemId)
    return item?.name || 'Deleted item'
  }

  return (
    <div className="requests-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="requests-panel" ref={panelRef}>
        <div className="requests-header">
          <h2>Requests</h2>
          <button className="close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="requests-content">
          {requests.length === 0 ? (
            <div className="no-requests">
              <p>No requests yet</p>
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="requests-section">
                  <h3>Pending</h3>
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="request-card pending">
                      <div className="request-type">
                        {request.type === 'markPaid' ? (
                          <span className="badge mark-paid">Mark as Paid</span>
                        ) : (
                          <span className="badge add-payment">Add Payment</span>
                        )}
                      </div>

                      <div className="request-details">
                        {request.type === 'markPaid' ? (
                          <p className="detail-item">Item: <strong>{getItemName(request.itemId)}</strong></p>
                        ) : (
                          <>
                            <p className="detail-item">Amount: <strong>₱{parseFloat(request.amount).toLocaleString()}</strong></p>
                            {request.date && (
                              <p className="detail-item">Date: {formatDate(request.date)}</p>
                            )}
                          </>
                        )}
                      </div>

                      {request.message && (
                        <p className="request-message">"{request.message}"</p>
                      )}

                      <div className="request-time">{formatTimeAgo(request.createdAt)}</div>

                      <div className="request-actions">
                        <button
                          className="accept-btn"
                          onClick={() => onAccept(request)}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => onReject(request)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {resolvedRequests.length > 0 && (
                <div className="requests-section">
                  <h3>Resolved</h3>
                  {resolvedRequests.map((request) => (
                    <div key={request.id} className={`request-card ${request.status}`}>
                      <div className="request-type">
                        {request.type === 'markPaid' ? (
                          <span className="badge mark-paid">Mark as Paid</span>
                        ) : (
                          <span className="badge add-payment">Add Payment</span>
                        )}
                        <span className={`status-badge ${request.status}`}>
                          {request.status}
                        </span>
                      </div>

                      <div className="request-details">
                        {request.type === 'markPaid' ? (
                          <p className="detail-item">Item: <strong>{getItemName(request.itemId)}</strong></p>
                        ) : (
                          <>
                            <p className="detail-item">Amount: <strong>₱{parseFloat(request.amount).toLocaleString()}</strong></p>
                            {request.date && (
                              <p className="detail-item">Date: {formatDate(request.date)}</p>
                            )}
                          </>
                        )}
                      </div>

                      {request.message && (
                        <p className="request-message">"{request.message}"</p>
                      )}

                      <div className="request-time">{formatTimeAgo(request.createdAt)}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
