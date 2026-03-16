import { useState, useRef, useEffect } from 'react'
import './RequestModal.css'

export function RequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialType, 
  initialItemId, 
  defaultType,
  members = [],
  isGroupMode = false,
  selectedMemberId = null
}) {
  const [type, setType] = useState(initialType || defaultType || 'markPaid')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [message, setMessage] = useState('')
  const inputRef = useRef(null)
  const showTypeSelector = !defaultType

  useEffect(() => {
    if (isOpen) {
      setType(initialType || defaultType || 'markPaid')
      setAmount('')
      setDate(new Date().toISOString().split('T')[0])
      setMessage('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialType, defaultType])

  const handleSubmit = (e) => {
    e.preventDefault()

    const requestData = {
      type,
      itemId: type === 'markPaid' ? initialItemId : null,
      amount: type === 'addPayment' ? parseFloat(amount) : null,
      date: type === 'addPayment' ? date : null,
      message: message.trim() || null,
      memberId: selectedMemberId,
    }

    if (type === 'addPayment' && (!amount || parseFloat(amount) <= 0)) {
      return
    }

    onSubmit(requestData)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  const selectedMember = members.find(m => m.id === selectedMemberId)

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content request-modal">
        <h2>Send Request</h2>

        {isGroupMode && (
          <div className="request-member-info">
            {selectedMember ? (
              <span>You are: <strong>{selectedMember.name}</strong></span>
            ) : (
              <span className="no-member-selected">Please select who you are from the header</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {showTypeSelector ? (
            <div className="request-type-options">
              <label className={`type-option ${type === 'markPaid' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value="markPaid"
                  checked={type === 'markPaid'}
                  onChange={() => setType('markPaid')}
                />
                <span className="type-label">Mark as Paid</span>
              </label>
              <label className={`type-option ${type === 'addPayment' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="type"
                  value="addPayment"
                  checked={type === 'addPayment'}
                  onChange={() => setType('addPayment')}
                />
                <span className="type-label">Add Payment</span>
              </label>
            </div>
          ) : (
            <div className="request-type-header">
              <span className={`type-badge ${type}`}>
                {type === 'markPaid' ? 'Mark as Paid' : 'Add Payment'}
              </span>
            </div>
          )}

          {type === 'addPayment' && (
            <>
              <label htmlFor="request-amount">Amount</label>
              <div className="amount-input-wrapper">
                <span className="currency">₱</span>
                <input
                  ref={inputRef}
                  id="request-amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0"
                  className="amount-input"
                  autocomplete="off"
                />
              </div>

              <label htmlFor="request-date">Date</label>
              <input
                id="request-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="date-input"
              />
            </>
          )}

          {type === 'markPaid' && (
            <input
              ref={inputRef}
              type="text"
              style={{ position: 'absolute', opacity: 0 }}
              tabIndex={-1}
            />
          )}

          <label htmlFor="request-message">Message (optional)</label>
          <textarea
            id="request-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note..."
            className="message-input"
            rows={3}
          />

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={type === 'addPayment' && (!amount || isNaN(parseFloat(amount)))}
            >
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
