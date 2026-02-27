import { useState, useRef, useEffect } from 'react'
import './ListNameModal.css'

export function ListNameModal({ isOpen, onClose, onCreate, defaultName }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setName(defaultName || '')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, defaultName])

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalName = name.trim() || defaultName
    onCreate(finalName)
    setName('')
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content list-name-modal">
        <h2>Create New List</h2>
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="list-name">List name</label>
          <input
            ref={inputRef}
            id="list-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter list name"
            className="list-name-input"
            autocomplete="off"
          />
          <p className="hint"></p>
          
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
