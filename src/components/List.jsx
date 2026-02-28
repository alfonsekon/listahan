import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useList, generateListId } from '../hooks/useList'
import { useLists } from '../hooks/useLists'
import { useTheme } from '../hooks/useTheme'
import { useRequests } from '../hooks/useRequests'
import { generateRandomName } from '../utils/randomName'
import { ExportMenu } from './ExportMenu'
import { ListItem } from './ListItem'
import { ListSelector } from './ListSelector'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { ShareModal } from './ShareModal'
import { ListNameModal } from './ListNameModal'
import { ExtraPaymentModal } from './ExtraPaymentModal'
import { RequestModal } from './RequestModal'
import { RequestsPanel } from './RequestsPanel'
import { ImportModal } from './ImportModal'
import { Toast } from './Toast'
import { SkeletonList } from './Skeleton'
import './List.css'

function formatPaymentDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function List() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [listToDelete, setListToDelete] = useState(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [listNameModalOpen, setListNameModalOpen] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestType, setRequestType] = useState('markPaid')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const { 
    lists, 
    currentListId: savedListId, 
    hasLists,
    createList, 
    deleteList: deleteListFromStorage, 
    renameList,
    setCurrentList,
  } = useLists()

  const currentListId = listId || savedListId

  useEffect(() => {
    if (!hasLists) {
      createList('My List')
    }
  }, [hasLists, createList])

  const isReadOnly = false

  const {
    items,
    extraPayments,
    loading,
    error,
    isInitialized,
    addItem,
    removeItem,
    togglePaid,
    updateItemName,
    updateItemAmount,
    deleteListFromDb,
    createListInDb,
    updateListNameInDb,
    updateListNameInDbById,
    ensureListExists,
    addExtraPayment,
    removeExtraPayment,
    totals,
    listName,
  } = useList(currentListId, isReadOnly)

  const { theme, toggleTheme } = useTheme()
  const { requests, pendingCount, createRequest, acceptRequest, rejectRequest } = useRequests(currentListId)
  const [showPaidBreakdown, setShowPaidBreakdown] = useState(false)
  const [extraPaymentModalOpen, setExtraPaymentModalOpen] = useState(false)

  const currentList = useMemo(() => 
    lists.find(l => l.id === currentListId), 
    [lists, currentListId]
  )

  useEffect(() => {
    if (currentListId && currentList && !loading) {
      ensureListExists(currentListId, currentList.name)
    }
  }, [currentListId, currentList?.name, loading, ensureListExists])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && amount && !isNaN(parseFloat(amount))) {
      addItem(name.trim(), parseFloat(amount))
      setName('')
      setAmount('')
    }
  }

  const handleAddExtraPayment = (amount, date) => {
    addExtraPayment(amount, date)
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const handleImport = (importData) => {
    importData.items.forEach(item => {
      addItem(item.name, item.amount)
    })
    importData.extraPayments.forEach(ep => {
      addExtraPayment(ep.amount, ep.date)
    })
    showToast('List imported successfully!', 'success')
  }

  const handleSelectList = (id) => {
    setCurrentList(id)
  }

  const handleCreateListClick = () => {
    setListNameModalOpen(true)
  }

  const handleCreateList = async (listName) => {
    const name = listName || generateRandomName()
    const newId = createList(name)
    await createListInDb(newId, name)
  }

  const handleDeleteClick = (listId) => {
    const list = lists.find(l => l.id === listId)
    setListToDelete(list)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (listToDelete) {
      await deleteListFromDb(listToDelete.id)
      deleteListFromStorage(listToDelete.id)
    }
    setDeleteModalOpen(false)
    setListToDelete(null)
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setListToDelete(null)
  }

  const handleRenameList = async (listId, newName) => {
    renameList(listId, newName)
    if (listId === currentListId) {
      await updateListNameInDb(newName)
    } else {
      await updateListNameInDbById(listId, newName)
    }
  }

  const handleRequestClick = (itemId) => {
    setSelectedItemId(itemId)
    setRequestType('markPaid')
    setRequestModalOpen(true)
  }

  const handleRequestPaymentClick = () => {
    setSelectedItemId(null)
    setRequestType('addPayment')
    setRequestModalOpen(true)
  }

  const handleSubmitRequest = async (requestData) => {
    await createRequest({
      ...requestData,
      listId: currentListId,
    })
  }

  const handleAcceptRequest = async (request) => {
    try {
      await acceptRequest(request)
      showToast('Request accepted', 'success')
    } catch (error) {
      showToast('Failed to accept request', 'error')
    }
  }

  const handleRejectRequest = async (request) => {
    try {
      await rejectRequest(request)
      showToast('Request rejected', 'success')
    } catch (error) {
      showToast('Failed to reject request', 'error')
    }
  }

  if (!currentListId) {
    return <SkeletonList />
  }

  if (loading) {
    return <SkeletonList />
  }

  if (error) {
    return (
      <div className="list-container">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="list-container">
      <header className="header">
        <h1>Palista</h1>
        <div className="header-center">
            <ListSelector
              lists={lists}
              currentListId={currentListId}
              onSelectList={handleSelectList}
              onCreateList={handleCreateListClick}
              onDeleteList={handleDeleteClick}
              onRenameList={handleRenameList}
            />
          </div>
        <div className="header-actions">
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="share-btn" onClick={handleShare} title="Copy link">
            Share
          </button>
        </div>
      </header>

      {!isReadOnly && (
        <div className="sub-header-actions">
          <button className="requests-btn" onClick={() => setRequestsPanelOpen(true)} title="View requests">
            Requests
            {pendingCount > 0 && <span className="requests-badge">{pendingCount}</span>}
          </button>
          <ExportMenu
            listName={listName}
            items={items}
            extraPayments={extraPayments}
            showToast={showToast}
          />
          <button className="import-btn" onClick={() => setImportModalOpen(true)} title="Import list">
            Import
          </button>
        </div>
      )}

      <form className="add-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Item"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="name-input"
          autocomplete="off"
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="amount-input"
          autocomplete="off"
        />
        <button type="submit" className="add-btn" disabled={!name.trim() || !amount || !isInitialized}>
          Add
        </button>
      </form>

      <ul className="items-list">
        {items.length === 0 ? (
          <li className="empty-state">
            No items yet.
          </li>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              onToggle={togglePaid}
              onRemove={removeItem}
              onUpdateName={updateItemName}
              onUpdateAmount={updateItemAmount}
              onRequest={isReadOnly ? handleRequestClick : undefined}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </ul>

      <div className="extra-payments-section">
        {!isReadOnly ? (
          <button 
            className="add-extra-payment-btn"
            onClick={() => setExtraPaymentModalOpen(true)}
            disabled={!isInitialized}
          >
            + Add Payment Made
          </button>
        ) : (
          <button 
            className="add-extra-payment-btn request-payment-btn"
            onClick={handleRequestPaymentClick}
          >
            + Add Payment Made
          </button>
        )}
        
        {extraPayments.length > 0 && (
          <ul className="extra-payments-list">
            {extraPayments.map((ep) => (
              <li key={ep.id} className="extra-payment-item">
                <span className="ep-name">
                  {ep.name}{ep.date ? ` - ${formatPaymentDate(ep.date)}` : ''}
                </span>
                <span className="ep-amount">₱{ep.amount.toLocaleString()}</span>
                <button 
                  className="ep-remove-btn"
                  onClick={() => removeExtraPayment(ep.id)}
                  title="Remove"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="totals">
        <div className="total-row">
          <span>Total</span>
          <span className="total-amount">₱{totals.total.toLocaleString()}</span>
        </div>
        <div 
          className="total-row paid clickable" 
          onClick={() => setShowPaidBreakdown(!showPaidBreakdown)}
        >
          <span>Paid {showPaidBreakdown ? '▾' : '▸'}</span>
          <span className="total-amount">₱{totals.paid.toLocaleString()}</span>
        </div>
        {showPaidBreakdown && (
          <div className="paid-breakdown">
            <div className="breakdown-row">
              <span>From Items</span>
              <span>₱{totals.paidFromItems.toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span>Extra Payments</span>
              <span>₱{totals.totalExtraPayments.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div className="total-row remaining">
          <span>Remaining</span>
          <span className="total-amount">
            ₱{totals.remaining.toLocaleString()}
          </span>
        </div>
      </div>

      <button 
        className="delete-list-btn"
        onClick={() => handleDeleteClick(currentListId)}
      >
        Delete List
      </button>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        listName={listToDelete?.name}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        listId={currentListId}
        listName={currentList?.name}
      />

      <ListNameModal
        isOpen={listNameModalOpen}
        onClose={() => setListNameModalOpen(false)}
        onCreate={handleCreateList}
        defaultName={generateRandomName()}
      />

      <ExtraPaymentModal
        isOpen={extraPaymentModalOpen}
        onClose={() => setExtraPaymentModalOpen(false)}
        onCreate={handleAddExtraPayment}
      />

      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleSubmitRequest}
        initialType={requestType}
        initialItemId={selectedItemId}
      />

      <RequestsPanel
        isOpen={requestsPanelOpen}
        onClose={() => setRequestsPanelOpen(false)}
        requests={requests}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
        items={items}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        existingItems={items}
      />

      <Toast
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  )
}

export function SharedList() {
  const { listId } = useParams()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [showPaidBreakdown, setShowPaidBreakdown] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [requestType, setRequestType] = useState('markPaid')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const isReadOnly = true

  const {
    items,
    extraPayments,
    loading,
    error,
    listExists,
    listName,
    copyList,
    totals,
  } = useList(listId, isReadOnly)

  const { createRequest } = useRequests(listId)

  const handleRequestClick = (itemId) => {
    setSelectedItemId(itemId)
    setRequestType('markPaid')
    setRequestModalOpen(true)
  }

  const handleRequestPaymentClick = () => {
    setSelectedItemId(null)
    setRequestType('addPayment')
    setRequestModalOpen(true)
  }

  const handleSubmitRequest = async (requestData) => {
    try {
      await createRequest({
        ...requestData,
        listId: listId,
      })
      showToast('Request sent successfully!', 'success')
    } catch (error) {
      showToast('Failed to send request', 'error')
    }
  }

  const handleGoToMyLists = () => {
    navigate('/')
  }

  if (loading) {
    return <SkeletonList isReadOnly={true} />
  }

  if (error) {
    return (
      <div className="list-container">
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  if (listExists === false) {
    return (
      <div className="list-container">
        <header className="header">
          <h1>Palista</h1>
          <div className="header-actions">
            <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>
        
        <div className="not-found">
          <h2>List not found</h2>
          <p>This list doesn't exist or has been deleted.</p>
          <button className="go-to-lists-btn" onClick={handleGoToMyLists}>
            Go to My Lists
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="list-container read-only">
      <header className="header">
        <h1>Palista</h1>
        <div className="header-actions">
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="read-only-banner">
        👁️ Viewing a shared list {listName && `"${listName}"`}
      </div>

      <ul className="items-list">
        {items.length === 0 ? (
          <li className="empty-state">
            This list is empty.
          </li>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              onToggle={() => {}}
              onRemove={() => {}}
              onUpdateName={() => {}}
              onUpdateAmount={() => {}}
              onRequest={handleRequestClick}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </ul>

      <div className="extra-payments-section">
        <button 
          className="add-extra-payment-btn"
          onClick={handleRequestPaymentClick}
        >
          + Add Payment Made
        </button>
        
        {extraPayments.length > 0 && (
          <ul className="extra-payments-list">
            {extraPayments.map((ep) => (
              <li key={ep.id} className="extra-payment-item">
                <span className="ep-name">
                  {ep.name}{ep.date ? ` - ${formatPaymentDate(ep.date)}` : ''}
                </span>
                <span className="ep-amount">₱{ep.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="totals">
        <div className="total-row">
          <span>Total</span>
          <span className="total-amount">₱{totals.total.toLocaleString()}</span>
        </div>
        <div 
          className="total-row paid clickable" 
          onClick={() => setShowPaidBreakdown(!showPaidBreakdown)}
        >
          <span>Paid {showPaidBreakdown ? '▾' : '▸'}</span>
          <span className="total-amount">₱{totals.paid.toLocaleString()}</span>
        </div>
        {showPaidBreakdown && (
          <div className="paid-breakdown">
            <div className="breakdown-row">
              <span>From Items</span>
              <span>₱{totals.paidFromItems.toLocaleString()}</span>
            </div>
            <div className="breakdown-row">
              <span>Extra Payments</span>
              <span>₱{totals.totalExtraPayments.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div className="total-row remaining">
          <span>Remaining</span>
          <span className="total-amount">
            ₱{totals.remaining.toLocaleString()}
          </span>
        </div>
      </div>

      {/* <button className="copy-list-btn" onClick={handleCopyList}>
        {copied ? '✓ Copied!' : '📋 Copy to My List'}
      </button> */}

      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleSubmitRequest}
        initialType={requestType}
        initialItemId={selectedItemId}
        defaultType={requestType}
      />

      <Toast
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
  )
}
