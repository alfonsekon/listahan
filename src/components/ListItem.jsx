import { useState } from 'react'
import './ListItem.css'

export function ListItem({ item, onToggle, onRemove, onUpdateName, isReadOnly }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)

  const handleSave = () => {
    if (editName.trim()) {
      onUpdateName(item.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setEditName(item.name)
      setIsEditing(false)
    }
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

      {isEditing && !isReadOnly ? (
        <input
          type="text"
          className="edit-input"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <span 
          className="item-name" 
          onDoubleClick={() => !isReadOnly && setIsEditing(true)}
          title={isReadOnly ? 'View only' : 'Double-click to edit'}
        >
          {item.name}
        </span>
      )}

      <span className="item-amount">
        ₱{item.amount.toLocaleString()}
      </span>

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
