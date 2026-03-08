import './Skeleton.css'

export function SkeletonList({ isReadOnly = false }) {
  return (
    <div className="list-container">
      <div className="header-background" />
      <header className="header">
        <div className="header-left">
          <div className="skeleton skeleton-sidebar-toggle"></div>
          <div className="skeleton skeleton-h1"></div>
        </div>
        <div className="header-right">
          {!isReadOnly && (
            <>
              <div className="skeleton skeleton-requests-btn"></div>
              <div className="skeleton skeleton-export-btn"></div>
              <div className="skeleton skeleton-import-btn"></div>
            </>
          )}
          {isReadOnly && (
            <div className="skeleton skeleton-create-list-btn"></div>
          )}
          <div className="skeleton skeleton-share-btn"></div>
          <div className="skeleton skeleton-theme-btn"></div>
        </div>
      </header>

      <div className="header-center">
        {!isReadOnly && (
          <div className="skeleton skeleton-selector"></div>
        )}
        {isReadOnly && (
          <div className="read-only-banner">
            <div className="skeleton skeleton-banner-text"></div>
          </div>
        )}
      </div>

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

      <div className="skeleton-extra-payment">
        <div className="skeleton skeleton-extra-payment-btn"></div>
      </div>

      <div className="skeleton-totals">
        {[1, 2, 3, 4].map((i) => (
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
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton skeleton-total-row"></div>
      ))}
    </div>
  )
}
