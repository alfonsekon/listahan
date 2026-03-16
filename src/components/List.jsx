import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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
import { StartGroupModal } from './StartGroupModal'
import { RemoveMemberModal } from './RemoveMemberModal'
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
  const location = useLocation()
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [rearrangeMode, setRearrangeMode] = useState(false)

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

  useEffect(() => {
    if (location.state?.createNewList && hasLists) {
      const newListName = generateRandomName()
      const newId = createList(newListName)
      createListInDb(newId, newListName)
      navigate('/', { replace: true })
    }
  }, [location.state])

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
    isGroupMode,
    wasInGroupMode,
    members,
    addMember,
    removeMember,
    toggleGroupMode,
    assignMembersToItem,
    addItemPayment,
    removeItemPayment,
    togglePaymentStatus,
    reorderItems,
  } = useList(currentListId, isReadOnly)

  useEffect(() => {
    if (listId && listName) {
      document.title = `Pede Palista - ${listName}`
    } else if (!listId) {
      document.title = 'Pede Palista'
    }
  }, [listId, listName])

  const { theme, toggleTheme } = useTheme()
  const { requests, pendingCount, createRequest, acceptRequest, rejectRequest, deleteRequest, clearResolvedRequests } = useRequests(currentListId)
  const [showPaidBreakdown, setShowPaidBreakdown] = useState(false)
  const [extraPaymentModalOpen, setExtraPaymentModalOpen] = useState(false)
  const [startGroupModalOpen, setStartGroupModalOpen] = useState(false)
  const [removeMemberModalOpen, setRemoveMemberModalOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [draggedItemId, setDraggedItemId] = useState(null)
  const [touchStartY, setTouchStartY] = useState(null)
  const [touchCurrentTarget, setTouchCurrentTarget] = useState(null)
  const memberSelectRef = useRef(null)

  const handleDragStart = (e, itemId) => {
    if (!rearrangeMode) return
    setDraggedItemId(itemId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    if (!rearrangeMode) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetItemId) => {
    if (!rearrangeMode) return
    e.preventDefault()
    if (!draggedItemId || draggedItemId === targetItemId) {
      setDraggedItemId(null)
      return
    }
    const currentItems = [...items]
    const draggedIndex = currentItems.findIndex(i => i.id === draggedItemId)
    const targetIndex = currentItems.findIndex(i => i.id === targetItemId)
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItemId(null)
      return
    }
    const [draggedItem] = currentItems.splice(draggedIndex, 1)
    currentItems.splice(targetIndex, 0, draggedItem)
    const newOrder = currentItems.map(item => item.id)
    reorderItems(newOrder)
    setDraggedItemId(null)
  }

  const handleDragEnd = () => {
    setDraggedItemId(null)
  }

  const handleTouchStart = (e, itemId) => {
    if (!rearrangeMode) return
    e.preventDefault()
    e.stopPropagation()
    setDraggedItemId(itemId)
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e) => {
    if (!rearrangeMode || !draggedItemId) return
    e.preventDefault()
    e.stopPropagation()
    const touchY = e.touches[0].clientY
    const elementBelow = document.elementFromPoint(e.touches[0].clientX, touchY)
    if (elementBelow) {
      const itemContainer = elementBelow.closest('.list-item-container')
      if (itemContainer) {
        const targetId = itemContainer.getAttribute('data-item-id')
        if (targetId && targetId !== draggedItemId) {
          setTouchCurrentTarget(targetId)
        }
      }
    }
  }

  const handleTouchEnd = (e) => {
    if (!rearrangeMode) return
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItemId || !touchCurrentTarget) {
      setDraggedItemId(null)
      setTouchStartY(null)
      setTouchCurrentTarget(null)
      return
    }
    const currentItems = [...items]
    const draggedIndex = currentItems.findIndex(i => i.id === draggedItemId)
    const targetIndex = currentItems.findIndex(i => i.id === touchCurrentTarget)
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [draggedItem] = currentItems.splice(draggedIndex, 1)
      currentItems.splice(targetIndex, 0, draggedItem)
      const newOrder = currentItems.map(item => item.id)
      reorderItems(newOrder)
    }
    setDraggedItemId(null)
    setTouchStartY(null)
    setTouchCurrentTarget(null)
  }

  const toggleRearrangeMode = () => {
    setRearrangeMode(prev => !prev)
    setDraggedItemId(null)
  }

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
      addItem(name.trim(), parseFloat(amount), selectedMembers)
      setName('')
      setAmount('')
      setSelectedMembers([])
    }
  }

  const handleAddExtraPayment = (amount, date, note) => {
    addExtraPayment(amount, date, note)
  }

  const handleStartGroup = async (namesString) => {
    const names = namesString.split(/[\n,]+/).map(n => n.trim()).filter(n => n)
    for (const name of names) {
      await addMember(name)
    }
    await toggleGroupMode(true)
    setStartGroupModalOpen(false)
  }

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSelectAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map(m => m.id))
    }
  }

  const handleRemoveMember = async (memberId) => {
    await removeMember(memberId)
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const handleImport = (importData, mode) => {
    if (mode === 'replace') {
      items.forEach(item => removeItem(item.id))
      extraPayments.forEach(ep => removeExtraPayment(ep.id))
    }
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
      if (request.memberId) {
        if (request.type === 'markPaid' && request.itemId) {
          const item = items.find(i => i.id === request.itemId)
          if (item) {
            await addItemPayment(request.itemId, request.memberId, item.amount, null, request.message)
          }
        } else if (request.type === 'addPayment') {
          await addExtraPayment(request.amount, request.date, request.message)
        }
      }
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
    <>
      <header className="header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} title="My Lists">
            ☰
          </button>
          <h1>Pede Palista</h1>
        </div>
        <div className="header-right">
          {!isReadOnly && (
            <>
              {!isGroupMode && members.length === 0 && (
                <button className="start-group-btn" onClick={() => setStartGroupModalOpen(true)}>
                  Start Group
                </button>
              )}
              {isGroupMode && (
                <>
                  <button className="add-member-btn" onClick={() => setStartGroupModalOpen(true)}>
                    + Member
                  </button>
                  <button className="remove-member-btn" onClick={() => setRemoveMemberModalOpen(true)}>
                    - Member
                  </button>
                </>
              )}
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
            </>
          )}
          <button className="share-btn" onClick={handleShare} title="Copy link">
            Share
          </button>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '☾' : '☀'}
          </button>
        </div>
      </header>

      <div className="list-container">
        <div className="list-selector-wrapper">
          <ListSelector
            lists={lists}
            currentListId={currentListId}
            onSelectList={handleSelectList}
            onCreateList={handleCreateListClick}
            onDeleteList={handleDeleteClick}
            onRenameList={handleRenameList}
            isOpen={sidebarOpen}
            onToggle={setSidebarOpen}
          />
        </div>

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
        {isGroupMode && members.length > 0 && (
          <div className="member-select-wrapper" ref={memberSelectRef}>
            <button 
              type="button" 
              className={`member-select-btn ${selectedMembers.length > 0 ? 'has-selection' : ''}`}
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            >
              {selectedMembers.length > 0 ? `${selectedMembers.length} selected` : 'Assign'}
            </button>
            {showMemberDropdown && (
              <div className="member-dropdown">
                <label className="member-option select-all">
                  <input
                    type="checkbox"
                    checked={selectedMembers.length === members.length && members.length > 0}
                    onChange={handleSelectAllMembers}
                  />
                  <span className={`member-card-select ${selectedMembers.length === members.length ? 'selected' : ''}`}>
                    Select All
                  </span>
                </label>
                {members.map(member => (
                  <label key={member.id} className="member-option">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => toggleMemberSelection(member.id)}
                    />
                    <span className={`member-card-select ${selectedMembers.includes(member.id) ? 'selected' : ''}`}>
                      {member.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        <button type="submit" className="add-btn" disabled={!name.trim() || !amount || !isInitialized}>
          Add
        </button>
      </form>

      {!isReadOnly && (
        <div className="rearrange-controls">
          {rearrangeMode ? (
            <button className="rearrange-btn active" onClick={toggleRearrangeMode}>
              Done Rearranging
            </button>
          ) : (
            <button 
              className="rearrange-btn" 
              onClick={toggleRearrangeMode}
              disabled={items.length < 2}
            >
              Rearrange Items
            </button>
          )}
        </div>
      )}

      <ul className={`items-list ${rearrangeMode ? 'rearrange-mode' : ''}`}>
        {items.length === 0 ? (
          <li className="empty-state">
            No items yet.
          </li>
        ) : (
          items.map((item) => (
            <ListItem
              key={item.id}
              item={item}
              members={members}
              isGroupMode={isGroupMode}
              onToggle={togglePaid}
              onRemove={removeItem}
              onUpdateName={updateItemName}
              onUpdateAmount={updateItemAmount}
              onAssignMembers={assignMembersToItem}
              onRemovePayment={removeItemPayment}
              onUpdatePaymentStatus={togglePaymentStatus}
              onRequest={isReadOnly ? handleRequestClick : undefined}
              isReadOnly={isReadOnly}
              rearrangeMode={rearrangeMode}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              isDragging={draggedItemId === item.id}
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
                  {ep.name}{ep.date ? ` - ${formatPaymentDate(ep.date)}` : ''}{ep.note ? ` - ${ep.note}` : ''}
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

      <StartGroupModal
        isOpen={startGroupModalOpen}
        onClose={() => setStartGroupModalOpen(false)}
        onStart={handleStartGroup}
        existingMembers={members}
        isAddingMembers={isGroupMode}
      />

      <RemoveMemberModal
        isOpen={removeMemberModalOpen}
        onClose={() => setRemoveMemberModalOpen(false)}
        members={members}
        onRemove={handleRemoveMember}
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
        onDelete={deleteRequest}
        onClearResolved={clearResolvedRequests}
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
    </>
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
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState(null)

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
    members,
    isGroupMode,
  } = useList(listId, isReadOnly)

  useEffect(() => {
    const savedMemberId = localStorage.getItem(`sharedListMember_${listId}`)
    if (savedMemberId && members.some(m => m.id === savedMemberId)) {
      setSelectedMemberId(savedMemberId)
    }
  }, [listId, members])

  const handleMemberChange = (memberId) => {
    setSelectedMemberId(memberId)
    if (memberId) {
      localStorage.setItem(`sharedListMember_${listId}`, memberId)
    } else {
      localStorage.removeItem(`sharedListMember_${listId}`)
    }
  }

  const { createRequest } = useRequests(listId)

  useEffect(() => {
    if (listName) {
      document.title = `Pede Palista - ${listName}`
    }
  }, [listName])

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
    navigate('/', { state: { createNewList: true } })
  }

  const handleShare = () => {
    setShareModalOpen(true)
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
      <>
        <header className="header">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={handleGoToMyLists} title="Go to My Lists">
              ☰
            </button>
            <h1>Pede Palista</h1>
          </div>
          <div className="header-right">
            <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? '☾' : '☀'}
            </button>
          </div>
        </header>

      <div className="list-container">
          <div className="not-found">
            <h2>List not found</h2>
            <p>This list doesn't exist or has been deleted.</p>
            <button className="go-to-lists-btn" onClick={handleGoToMyLists}>
              Go to My Lists
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="sidebar-toggle" onClick={handleGoToMyLists} title="Go to My Lists">
            ☰
          </button>
          <h1>Pede Palista</h1>
        </div>
        <div className="header-right">
          {isGroupMode && members.length > 0 && (
            <select 
              className="member-select"
              value={selectedMemberId || ''}
              onChange={(e) => handleMemberChange(e.target.value || null)}
            >
              <option value="">Who are you?</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          )}
          <button className="share-btn" onClick={handleGoToMyLists}>
            + New List
          </button>
          <ExportMenu
            listName={listName}
            items={items}
            extraPayments={extraPayments}
            showToast={showToast}
          />
          <button className="share-btn" onClick={handleShare} title="Copy link">
            Share
          </button>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? '☾' : '☀'}
          </button>
        </div>
      </header>

      <div className="list-container read-only">
        <div className="read-only-banner">
          {isGroupMode ? `Viewing Group List "${listName}"` : `Viewing "${listName}"`}
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
              members={members}
              isGroupMode={isGroupMode}
              selectedMemberId={selectedMemberId}
              onToggle={() => {}}
              onRemove={() => {}}
              onUpdateName={() => {}}
              onUpdateAmount={() => {}}
              onAssignMembers={() => {}}
              onRemovePayment={() => {}}
              onRequest={handleRequestClick}
              isReadOnly={isReadOnly}
            />
          ))
        )}
      </ul>

      <div className="extra-payments-section">
        {(!isGroupMode || selectedMemberId) && (
          <button 
            className="add-extra-payment-btn"
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
                  {ep.name}{ep.date ? ` - ${formatPaymentDate(ep.date)}` : ''}{ep.note ? ` - ${ep.note}` : ''}
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
        {copied ? '✓ Copied!' : '✓ Copy to My List'}
      </button> */}

      <RequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleSubmitRequest}
        initialType={requestType}
        initialItemId={selectedItemId}
        defaultType={requestType}
        members={members}
        isGroupMode={isGroupMode}
        selectedMemberId={selectedMemberId}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        listId={listId}
        listName={listName}
        copied={copied}
        setCopied={setCopied}
      />

      <Toast
        toasts={toasts}
        onRemove={removeToast}
      />
    </div>
    </>
  )
}
