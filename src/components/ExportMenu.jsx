import { useState, useRef, useEffect } from 'react'
import { exportToJson, copyToClipboard } from '../utils/exportList'
import './ExportMenu.css'

export function ExportMenu({ listName, items, extraPayments, showToast }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSaveToFile = () => {
    exportToJson(listName, items, extraPayments)
    setIsOpen(false)
  }

  const handleCopyToClipboard = () => {
    copyToClipboard(
      listName,
      items,
      extraPayments,
      () => {
        showToast('Copied to clipboard!', 'success')
      },
      () => {
        showToast('Failed to copy to clipboard', 'error')
      }
    )
    setIsOpen(false)
  }

  return (
    <div className="export-menu" ref={menuRef}>
      <button 
        className="export-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Export list"
      >
        Export ▾
      </button>
      {isOpen && (
        <div className="export-dropdown">
          <button className="export-option" onClick={handleSaveToFile}>
            Save to File
          </button>
          <button className="export-option" onClick={handleCopyToClipboard}>
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  )
}
