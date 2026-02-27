import { useState, useRef, useEffect } from 'react'
import './ListSelector.css'

export function ListSelector({ 
  lists, 
  currentListId, 
  onSelectList, 
  onCreateList, 
  onDeleteList,
  onRenameList 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const currentList = lists.find(l => l.id === currentListId)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setEditingId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleSelectClick = () => {
    setIsOpen(!isOpen)
  }

  const handleListClick = (listId) => {
    onSelectList(listId)
    setIsOpen(false)
    setEditingId(null)
  }

  const handleCreateList = () => {
    onCreateList()
    setIsOpen(false)
  }

  const handleDeleteClick = (e, listId) => {
    e.stopPropagation()
    onDeleteList(listId)
  }

  const handleRenameClick = (e, list) => {
    e.stopPropagation()
    setEditingId(list.id)
    setEditName(list.name)
  }

  const handleRenameSubmit = (listId) => {
    if (editName.trim()) {
      onRenameList(listId, editName.trim())
    }
    setEditingId(null)
  }

  const handleRenameKeyDown = (e, listId) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(listId)
    } else if (e.key === 'Escape') {
      setEditingId(null)
    }
  }

  return (
    <div className="list-selector" ref={dropdownRef}>
      <button className="selector-trigger" onClick={handleSelectClick}>
        <span className="current-list-name">
          {currentList ? currentList.name : 'Select List'}
        </span>
        <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="dropdown">
          {lists.map((list) => (
            <div 
              key={list.id} 
              className={`dropdown-item ${list.id === currentListId ? 'active' : ''}`}
              onClick={() => handleListClick(list.id)}
            >
              {editingId === list.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="rename-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRenameSubmit(list.id)}
                  onKeyDown={(e) => handleRenameKeyDown(e, list.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="list-name">{list.name}</span>
                  <div className="list-actions">
                    <button 
                      className="action-btn rename-btn"
                      onClick={(e) => handleRenameClick(e, list)}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => handleDeleteClick(e, list.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="dropdown-divider" />

          <div className="dropdown-item create-item" onClick={handleCreateList}>
            <span>+ New List</span>
          </div>
        </div>
      )}
    </div>
  )
}
