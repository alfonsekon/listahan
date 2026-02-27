import { useState, useRef, useEffect } from 'react'
import './ListItem.css'

export function ListItem({ item, onToggle, onRemove, onUpdateName, onUpdateAmount, isReadOnly }) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingAmount, setIsEditingAmount] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editAmount, setEditAmount] = useState(item.amount.toString())
  const nameInputRef = useRef(null)
  const amountInputRef = useRef(null)

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus()
      amountInputRef.current.select()
    }
  }, [isEditingAmount])

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(item.id, editName.trim())
    } else {
      setEditName(item.name)
    }
    setIsEditingName(false)
  }

  const handleSaveAmount = () => {
    const amount = parseFloat(editAmount)
    if (!isNaN(amount) && amount >= 0) {
      onUpdateAmount(item.id, amount)
    } else {
      setEditAmount(item.amount.toString())
    }
    setIsEditingAmount(false)
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setEditName(item.name)
      setIsEditingName(false)
    }
  }

  const handleAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveAmount()
    } else if (e.key === 'Escape') {
      setEditAmount(item.amount.toString())
      setIsEditingAmount(false)
    }
  }

  const handleNameBlur = () => {
    handleSaveName()
  }

  const handleAmountBlur = () => {
    handleSaveAmount()
  }

  return (
    <li className={`list-item ${item.isPaid ? 'paid' : ''}`}>
      <label className="checkbox-wrapper">
        <input
          type="checkbox"
          checked={item.isPaid}
          onChange={() => onToggle(item.id, item.isPaid)}
          disabled={isReadOnly}
        />
        <span className="checkmark"></span>
      </label>

      {isEditingName && !isReadOnly ? (
        <input
          ref={nameInputRef}
          type="text"
          className="edit-input edit-name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          autocomplete="off"
        />
      ) : (
        <span 
          className="item-name editable" 
          onClick={() => !isReadOnly && setIsEditingName(true)}
          title={isReadOnly ? 'View only' : 'Click to edit'}
        >
          {item.name}
        </span>
      )}

      {isEditingAmount && !isReadOnly ? (
        <input
          ref={amountInputRef}
          type="number"
          className="edit-input edit-amount"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          onBlur={handleAmountBlur}
          onKeyDown={handleAmountKeyDown}
          step="0.01"
          min="0"
          autocomplete="off"
        />
      ) : (
        <span 
          className="item-amount editable" 
          onClick={() => !isReadOnly && setIsEditingAmount(true)}
          title={isReadOnly ? 'View only' : 'Click to edit'}
        >
          ₱{item.amount.toLocaleString()}
        </span>
      )}

      {!isReadOnly && (
        <button
          className="delete-btn"
          onClick={() => onRemove(item.id)}
          title="Remove"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </li>
  )
}
