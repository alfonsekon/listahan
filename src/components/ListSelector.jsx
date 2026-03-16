import { useState, useRef, useEffect } from 'react'
import './ListSelector.css'

export function ListSelector({ 
  lists, 
  currentListId, 
  onSelectList, 
  onCreateList, 
  onDeleteList,
  onRenameList,
  isOpen,
  onToggle
}) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const inputRef = useRef(null)

  const currentList = lists.find(l => l.id === currentListId)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleOverlayClick = () => {
    onToggle(false)
  }

  const handleListClick = (listId) => {
    onSelectList(listId)
    onToggle(false)
    setEditingId(null)
  }

  const handleCreateList = () => {
    onCreateList()
    onToggle(false)
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
    <>
      {isOpen && <div className="sidebar-overlay" onClick={handleOverlayClick} />}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>My Lists</h2>
          <button className="sidebar-close" onClick={() => onToggle(false)}>×</button>
        </div>
        
        <div className="sidebar-content">
          {lists.map((list) => (
            <div 
              key={list.id} 
              className={`sidebar-item ${list.id === currentListId ? 'active' : ''}`}
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
                  autocomplete="off"
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
                      ✎
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={(e) => handleDeleteClick(e, list.id)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <button className="create-list-btn create-list-inline" onClick={handleCreateList}>
            + New List
          </button>
        </div>
      </div>
    </>
  )
}
