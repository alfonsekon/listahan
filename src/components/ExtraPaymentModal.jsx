import { useState, useRef, useEffect } from 'react'
import './ExtraPaymentModal.css'

export function ExtraPaymentModal({ isOpen, onClose, onCreate }) {
  const [amount, setAmount] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [date, setDate] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setShowDatePicker(false)
      setDate('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = parseFloat(amount)
    if (value > 0) {
      onCreate(value, date || null)
      setAmount('')
      onClose()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleAddDate = () => {
    setShowDatePicker(true)
    setDate(new Date().toISOString().split('T')[0])
  }

  const handleRemoveDate = () => {
    setShowDatePicker(false)
    setDate('')
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content extra-payment-modal">
        <h2>Add Payment Made</h2>
        
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
          
          {!showDatePicker ? (
            <button type="button" className="add-date-btn" onClick={handleAddDate}>
              + Add Date
            </button>
          ) : (
            <div className="date-picker-wrapper">
              <input
                id="extra-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={handleKeyDown}
                className="date-input"
              />
              <button type="button" className="remove-date-btn" onClick={handleRemoveDate}>
                ×
              </button>
            </div>
          )}
          
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
