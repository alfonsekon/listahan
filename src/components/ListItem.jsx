import { useState, useRef, useEffect } from 'react'
import './ListItem.css'

export function ListItem({ item, members, isGroupMode, selectedMemberId, onToggle, onRemove, onUpdateName, onUpdateAmount, onAssignMembers, onUpdatePaymentStatus, onRequest, isReadOnly, rearrangeMode, onDragStart, onDragOver, onDrop, onDragEnd, isDragging }) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingAmount, setIsEditingAmount] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editAmount, setEditAmount] = useState(item.amount.toString())
  const [showMemberEdit, setShowMemberEdit] = useState(false)
  const [showPaymentEdit, setShowPaymentEdit] = useState(false)
  const nameInputRef = useRef(null)
  const amountInputRef = useRef(null)
  const memberEditRef = useRef(null)
  const paymentEditRef = useRef(null)

  const assignedTo = item.assignedTo || []
  const payments = item.payments || []

  const getMemberPaymentStatus = (memberId) => {
    const memberPayments = payments.filter(p => p.memberId === memberId)
    const totalPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0)
    return totalPaid >= item.amount
  }

  const isItemFullyPaid = assignedTo.length > 0 && assignedTo.every(memberId => getMemberPaymentStatus(memberId))

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  useEffect(() => {
    if (isEditingAmount && amountInputRef.current) {
      amountInputRef.current.focus()
      amountInputRef.current.select()
    }
  }, [isEditingAmount])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (memberEditRef.current && !memberEditRef.current.contains(event.target)) {
        setShowMemberEdit(false)
      }
      if (paymentEditRef.current && !paymentEditRef.current.contains(event.target)) {
        setShowPaymentEdit(false)
      }
    }

    if (showMemberEdit || showPaymentEdit) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMemberEdit, showPaymentEdit])

  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdateName(item.id, editName.trim())
    } else {
      setEditName(item.name)
    }
    setIsEditingName(false)
  }

  const handleSaveAmount = () => {
    const amount = parseFloat(editAmount)
    if (!isNaN(amount) && amount >= 0) {
      onUpdateAmount(item.id, amount)
    } else {
      setEditAmount(item.amount.toString())
    }
    setIsEditingAmount(false)
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setEditName(item.name)
      setIsEditingName(false)
    }
  }

  const handleAmountKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveAmount()
    } else if (e.key === 'Escape') {
      setEditAmount(item.amount.toString())
      setIsEditingAmount(false)
    }
  }

  const handleNameBlur = () => {
    handleSaveName()
  }

  const handleAmountBlur = () => {
    handleSaveAmount()
  }

  const handleEditMembers = () => {
    setShowMemberEdit(!showMemberEdit)
  }

  const handleToggleEditMember = (memberId) => {
    const newAssignedTo = assignedTo.includes(memberId)
      ? assignedTo.filter(id => id !== memberId)
      : [...assignedTo, memberId]
    onAssignMembers(item.id, newAssignedTo)
  }

  const handleTogglePayment = (memberId) => {
    const isCurrentlyPaid = getMemberPaymentStatus(memberId)
    onUpdatePaymentStatus(item.id, memberId, !isCurrentlyPaid)
  }

  const renderMemberCards = () => {
    if (assignedTo.length === 0) {
      return <span className="unassigned-label">Unassigned</span>
    }

    return assignedTo.map(memberId => {
      const member = members.find(m => m.id === memberId)
      if (!member) return null
      const isPaid = getMemberPaymentStatus(memberId)
      return (
        <span key={memberId} className={`member-card ${isPaid ? 'paid' : 'unpaid'}`}>
          {member.name}
        </span>
      )
    })
  }

  const showCheckbox = isGroupMode && assignedTo.length > 0
  const isPaid = isGroupMode ? isItemFullyPaid : item.isPaid

  return (
    <div 
      className={`list-item-container ${isDragging ? 'dragging' : ''}`}
      draggable={rearrangeMode}
      onDragStart={(e) => rearrangeMode && onDragStart && onDragStart(e, item.id)}
      onDragOver={rearrangeMode ? onDragOver : undefined}
      onDrop={(e) => rearrangeMode && onDrop && onDrop(e, item.id)}
      onDragEnd={rearrangeMode ? onDragEnd : undefined}
    >
      <li className={`list-item ${isPaid ? 'paid' : ''}`}>
        {rearrangeMode ? (
          <>
            <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
            <span className="item-name">{item.name}</span>
            <div className="item-members">
              {isGroupMode && renderMemberCards()}
            </div>
            <span className="item-amount">₱{item.amount.toLocaleString()}</span>
          </>
        ) : (
          <>
        {!showCheckbox && (
          <label className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={item.isPaid}
              onChange={() => onToggle(item.id, item.isPaid)}
              disabled={isReadOnly}
            />
            <span className="checkmark"></span>
          </label>
        )}

        {isEditingName && !isReadOnly ? (
          <input
            ref={nameInputRef}
            type="text"
            className="edit-input edit-name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            autocomplete="off"
          />
        ) : (
          <span 
            className="item-name editable"
            onClick={() => !isReadOnly && setIsEditingName(true)}
            title={isReadOnly ? 'View only' : 'Click to edit'}
          >
            {item.name}
          </span>
        )}

        <div className="item-members">
          {isGroupMode && renderMemberCards()}
        </div>

        {isEditingAmount && !isReadOnly ? (
          <input
            ref={amountInputRef}
            type="number"
            className="edit-input edit-amount"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            onBlur={handleAmountBlur}
            onKeyDown={handleAmountKeyDown}
            step="0.01"
            min="0"
            autocomplete="off"
          />
        ) : (
          <span 
            className="item-amount editable"
            onClick={() => !isReadOnly && setIsEditingAmount(true)}
            title={isReadOnly ? 'View only' : 'Click to edit'}
          >
            ₱{item.amount.toLocaleString()}
          </span>
        )}

        {isReadOnly && isGroupMode && onRequest && selectedMemberId && assignedTo.includes(selectedMemberId) && (
          <button
            className="request-btn"
            onClick={() => onRequest(item.id)}
            title="Send request"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        )}

        {!isReadOnly && (
          <button
            className="delete-btn"
            onClick={() => onRemove(item.id)}
            title="Remove"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
          </>
        )}
      </li>

      {isGroupMode && !isReadOnly && !rearrangeMode && members.length > 0 && (
        <div className="item-actions">
          <div className="action-btn-wrapper" ref={memberEditRef}>
            {showMemberEdit ? (
              <div className="member-edit-dropdown">
                {members.map(member => (
                  <label key={member.id} className="member-option clickable" onClick={() => handleToggleEditMember(member.id)}>
                    <input
                      type="checkbox"
                      checked={assignedTo.includes(member.id)}
                      readOnly
                    />
                    <span className={`member-card-select ${assignedTo.includes(member.id) ? 'selected' : ''}`}>
                      {member.name}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <button
                className="edit-members-btn"
                onClick={handleEditMembers}
                title="Edit members"
              >
                ✎
              </button>
            )}
          </div>

          <div className="action-btn-wrapper" ref={paymentEditRef}>
            {showPaymentEdit ? (
              <div className="payment-edit-dropdown">
                {assignedTo.map(memberId => {
                  const member = members.find(m => m.id === memberId)
                  if (!member) return null
                  const isPaidMember = getMemberPaymentStatus(memberId)
                  return (
                    <label key={memberId} className="member-option clickable">
                      <input
                        type="checkbox"
                        checked={isPaidMember}
                        onChange={() => handleTogglePayment(memberId)}
                      />
                      <span className={`member-card-select ${isPaidMember ? 'selected' : ''}`}>
                        {member.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <button
                className="edit-payments-btn"
                onClick={() => setShowPaymentEdit(true)}
                title="Edit payments"
              >
                💰
              </button>
            )}
          </div>
        </div>
      )}

      {isReadOnly && onRequest && !isGroupMode && (
        <button
          className="request-btn"
          onClick={() => onRequest(item.id)}
          title="Send request"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      )}
    </div>
  )
}
