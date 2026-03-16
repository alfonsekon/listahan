import { useState, useEffect } from 'react'
import './StartGroupModal.css'

export function RemoveMemberModal({ isOpen, onClose, members, onRemove }) {
  const [selectedToRemove, setSelectedToRemove] = useState([])

  useEffect(() => {
    if (isOpen) {
      setSelectedToRemove([])
    }
  }, [isOpen])

  const toggleMember = (memberId) => {
    setSelectedToRemove(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleRemove = () => {
    selectedToRemove.forEach(memberId => onRemove(memberId))
    setSelectedToRemove([])
    onClose()
  }

  const handleSelectAll = () => {
    if (selectedToRemove.length === members.length) {
      setSelectedToRemove([])
    } else {
      setSelectedToRemove(members.map(m => m.id))
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content start-group-modal">
        <h2>Remove Member</h2>
        <p className="modal-description">
          Select members to remove from the group. This will also remove them from any assigned items.
        </p>

        <div className="member-list">
          <label className="member-option select-all">
            <input
              type="checkbox"
              checked={selectedToRemove.length === members.length && members.length > 0}
              onChange={handleSelectAll}
            />
            <span className={`member-card-select ${selectedToRemove.length === members.length ? 'selected' : ''}`}>
              Select All
            </span>
          </label>
          {members.map(member => (
            <label key={member.id} className="member-option">
              <input
                type="checkbox"
                checked={selectedToRemove.includes(member.id)}
                onChange={() => toggleMember(member.id)}
              />
              <span className={`member-card-select ${selectedToRemove.includes(member.id) ? 'selected' : ''}`}>
                {member.name}
              </span>
            </label>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="remove-btn" 
            onClick={handleRemove}
            disabled={selectedToRemove.length === 0}
          >
            Remove {selectedToRemove.length > 0 && `(${selectedToRemove.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
