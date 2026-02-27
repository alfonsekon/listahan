import './DeleteConfirmModal.css'

export function DeleteConfirmModal({ isOpen, listName, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Delete "{listName}"?</h2>
        
        <div className="warning-box">
          <span className="warning-icon">⚠️</span>
          <p>This action cannot be undone.</p>
          <p>All data will be permanently deleted.</p>
        </div>

        <div className="modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-conf-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
