import { useState, useRef, useEffect } from 'react'
import './ExtraPaymentModal.css'

export function ExtraPaymentModal({ isOpen, onClose, onCreate }) {
  const [amount, setAmount] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (value > 0) {
      onCreate(value)
      setAmount('')
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content extra-payment-modal">
        <h2>Add Extra Payment</h2>
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="extra-amount">Amount</label>
          <div className="amount-input-wrapper">
            <span className="currency">₱</span>
            <input
              ref={inputRef}
              id="extra-amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="amount-input"
              autoFocus
              autocomplete="off"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={!amount || isNaN(parseFloat(amount))}>
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
