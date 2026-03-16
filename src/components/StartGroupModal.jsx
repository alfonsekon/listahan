import { useState, useRef, useEffect } from 'react'
import './StartGroupModal.css'

export function StartGroupModal({ isOpen, onClose, onStart, existingMembers = [], isAddingMembers = false }) {
  const [namesInput, setNamesInput] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setNamesInput('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!namesInput.trim()) return

    const names = namesInput.split(/[\n,]+/).map(n => n.trim()).filter(n => n)
    const existingNames = existingMembers.map(m => m.name.toLowerCase().trim())
    
    const duplicates = names.filter(name => existingNames.includes(name.toLowerCase().trim()))
    
    if (duplicates.length > 0) {
      setError(`Name(s) already exist: ${duplicates.join(', ')}`)
      return
    }

    setError('')
    onStart(namesInput)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content start-group-modal">
        <h2>{isAddingMembers ? 'Add Member' : 'Start Group'}</h2>
        <p className="modal-description">
          {isAddingMembers 
            ? 'Add more names separated by commas or new lines.'
            : 'Add the names of group members separated by commas or new lines.'
          }
        </p>
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="member-names">Members</label>
          <textarea
            ref={inputRef}
            id="member-names"
            value={namesInput}
            onChange={(e) => {
              setNamesInput(e.target.value)
              setError('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Alice, Bob, Charlie&#10;or&#10;Alice&#10;Bob&#10;Charlie"
            className="names-input"
            rows={5}
            autoFocus
          />
          
          {error && <p className="error-message">{error}</p>}
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={!namesInput.trim()}>
              {isAddingMembers ? 'Add' : 'Start Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
