import { useState, useRef } from 'react'
import { parseImportedJson, prepareImportData, findDuplicates } from '../utils/importList'
import './ImportModal.css'

export function ImportModal({ isOpen, onClose, onImport, existingItems = [] }) {
  const [parsedData, setParsedData] = useState(null)
  const [error, setError] = useState(null)
  const [importMode, setImportMode] = useState(null)
  const [duplicates, setDuplicates] = useState([])
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a JSON file')
      return
    }

    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = parseImportedJson(e.target.result)
      if (result.error) {
        setError(result.error)
        setParsedData(null)
      } else {
        setParsedData(result)
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    handleFileSelect(droppedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleInputChange = (e) => {
    const selectedFile = e.target.files[0]
    handleFileSelect(selectedFile)
  }

  const handlePasteImport = () => {
    if (!pastedText.trim()) {
      setError('Please paste some JSON text first')
      return
    }
    setError(null)
    const result = parseImportedJson(pastedText)
    if (result.error) {
      setError(result.error)
      setParsedData(null)
    } else {
      setParsedData(result)
      setPastedText('')
    }
  }

  const handleMerge = () => {
    setImportMode('merge')
    const { duplicates: dups } = findDuplicates(existingItems, parsedData.items)
    if (dups.length > 0) {
      setDuplicates(dups)
      setShowDuplicatePrompt(true)
    } else {
      doImport('merge', [])
    }
  }

  const handleReplace = () => {
    setImportMode('replace')
    doImport('replace', [])
  }

  const doImport = (mode, itemsToInclude) => {
    const importData = prepareImportData(
      itemsToInclude.length > 0 ? itemsToInclude : parsedData.items,
      parsedData.extraPayments,
      mode,
      existingItems
    )
    onImport(importData)
    handleClose()
  }

  const handleDuplicateDecision = (importAnyway) => {
    if (importAnyway) {
      doImport('merge', parsedData.items)
    } else {
      doImport('merge', parsedData.nonDuplicates || [])
    }
    setShowDuplicatePrompt(false)
  }

  const handleClose = () => {
    setParsedData(null)
    setError(null)
    setImportMode(null)
    setDuplicates([])
    setShowDuplicatePrompt(false)
    setPastedText('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content import-modal">
        <h2>Import List</h2>

        {!parsedData && (
          <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="drop-icon">📁</div>
            <p>Drag and drop a JSON file here</p>
            <p className="drop-subtext">or click to select a file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {!parsedData && (
          <div className="paste-section">
            <p className="paste-label">or paste the JSON text:</p>
            <textarea
              className="paste-input"
              placeholder='{"version":"1.0","list":{"name":"My List"...}}'
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <button className="paste-btn" onClick={handlePasteImport}>
              Import from Text
            </button>
          </div>
        )}

        {error && (
          <div className="import-error">
            <p>{error}</p>
            <button className="retry-btn" onClick={() => { setParsedData(null); setError(null); }}>
              Try Again
            </button>
          </div>
        )}

        {parsedData && !showDuplicatePrompt && !importMode && (
          <div className="import-preview">
            <div className="preview-info">
              <h3>{parsedData.listName}</h3>
              <p>{parsedData.items.length} items</p>
              {parsedData.extraPayments.length > 0 && (
                <p>{parsedData.extraPayments.length} payments</p>
              )}
            </div>

            <div className="import-options">
              <button className="import-option-btn replace-btn" onClick={handleReplace}>
                Replace
                <span className="option-desc">Clear all items and import fresh</span>
              </button>
              <button className="import-option-btn merge-btn" onClick={handleMerge}>
                Merge
                <span className="option-desc">Add to existing items</span>
              </button>
            </div>

            <button className="cancel-import-btn" onClick={() => { setParsedData(null); }}>
              Choose Different File
            </button>
          </div>
        )}

        {showDuplicatePrompt && duplicates.length > 0 && (
          <div className="duplicate-prompt">
            <p>
              <strong>{duplicates.length}</strong> item(s) already exist:
            </p>
            <ul className="duplicate-list">
              {duplicates.slice(0, 5).map((item, idx) => (
                <li key={idx}>{item.name}</li>
              ))}
              {duplicates.length > 5 && (
                <li>...and {duplicates.length - 5} more</li>
              )}
            </ul>
            <p>What would you like to do?</p>
            <div className="duplicate-actions">
              <button className="skip-btn" onClick={() => handleDuplicateDecision(false)}>
                Skip Duplicates
              </button>
              <button className="import-all-btn" onClick={() => handleDuplicateDecision(true)}>
                Import Anyway
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="close-btn" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
