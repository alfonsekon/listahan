import './Skeleton.css'

export function SkeletonList({ isReadOnly = false }) {
  return (
    <div className="list-container">
      <header className="header">
        <div className="skeleton skeleton-title"></div>
        <div className="header-center">
          <div className="skeleton skeleton-selector"></div>
        </div>
        <div className="header-actions">
          <div className="skeleton skeleton-action-btn"></div>
          <div className="skeleton skeleton-action-btn"></div>
        </div>
      </header>

      {isReadOnly && (
        <div className="read-only-banner">
          <div className="skeleton" style={{ width: 200, height: 20, margin: '0 auto' }}></div>
        </div>
      )}

      {!isReadOnly && (
        <div className="skeleton-form">
          <div className="skeleton skeleton-form-input"></div>
          <div className="skeleton skeleton-form-input-small"></div>
          <div className="skeleton skeleton-form-btn"></div>
        </div>
      )}

      <div className="skeleton-list">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-item">
            <div className="skeleton skeleton-checkbox"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-amount"></div>
            {!isReadOnly && <div className="skeleton skeleton-delete"></div>}
          </div>
        ))}
      </div>

      <div className="skeleton-totals">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-total-row"></div>
        ))}
      </div>

      <div className="delete-list-btn">
        <div className="skeleton" style={{ width: 120, height: 20 }}></div>
      </div>
    </div>
  )
}

export function SkeletonItem() {
  return (
    <div className="skeleton-item">
      <div className="skeleton skeleton-checkbox"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-amount"></div>
      <div className="skeleton skeleton-delete"></div>
    </div>
  )
}

export function SkeletonTotals() {
  return (
    <div className="skeleton-totals">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton skeleton-total-row"></div>
      ))}
    </div>
  )
}
