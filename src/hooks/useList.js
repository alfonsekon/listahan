import { useState, useEffect, useCallback } from 'react'
import { ref, set, get, onValue, push, remove, update } from 'firebase/database'
import { database } from '../firebase'

export function useList(listId, isReadOnly = false) {
  const [items, setItems] = useState([])
  const [extraPayments, setExtraPayments] = useState([])
  const [members, setMembers] = useState([])
  const [isGroupMode, setIsGroupMode] = useState(false)
  const [wasInGroupMode, setWasInGroupMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [listExists, setListExists] = useState(null)
  const [listName, setListName] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const listRef = ref(database, `lists/${listId}`)
  const itemsRef = ref(database, `lists/${listId}/items`)
  const extraPaymentsRef = ref(database, `lists/${listId}/extraPayments`)
  const membersRef = ref(database, `lists/${listId}/members`)

  useEffect(() => {
    if (!listId) return

    const unsubscribe = onValue(listRef, (snapshot) => {
      if (snapshot.exists()) {
        setListExists(true)
        const data = snapshot.val()
        if (data) {
          setListName(data.name)
          setIsGroupMode(data.isGroupMode || false)
          setWasInGroupMode(data.wasInGroupMode || false)
          
          if (data.items) {
            const itemsArray = Object.entries(data.items).map(([id, item]) => ({
              id,
              ...item,
            }))
            setItems(itemsArray)
          } else {
            setItems([])
          }
          
          if (data.extraPayments) {
            const epArray = Object.entries(data.extraPayments).map(([id, ep]) => ({
              id,
              ...ep,
            }))
            setExtraPayments(epArray)
          } else {
            setExtraPayments([])
          }

          if (data.members) {
            const membersArray = Object.entries(data.members).map(([id, member]) => ({
              id,
              ...member,
            }))
            setMembers(membersArray)
          } else {
            setMembers([])
          }
        } else {
          setItems([])
          setExtraPayments([])
          setMembers([])
        }
      } else {
        setListExists(false)
        setItems([])
        setExtraPayments([])
        setMembers([])
      }
      setLoading(false)
      setIsInitialized(true)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [listId])

  const addItem = useCallback(async (name, amount, assignedTo = []) => {
    if (isReadOnly) return
    const newItemsRef = ref(database, `lists/${listId}/items`)
    await push(newItemsRef, {
      name,
      amount: parseFloat(amount),
      isPaid: false,
      assignedTo: assignedTo.length > 0 ? assignedTo : null,
      payments: null,
      createdAt: Date.now(),
    })
  }, [isReadOnly, listId])

  const removeItem = useCallback(async (itemId) => {
    if (isReadOnly) return
    await remove(ref(database, `lists/${listId}/items/${itemId}`))
  }, [isReadOnly, listId])

  const togglePaid = useCallback(async (itemId, currentStatus) => {
    if (isReadOnly) return
    await update(ref(database, `lists/${listId}/items/${itemId}`), {
      isPaid: !currentStatus,
    })
  }, [isReadOnly, listId])

  const updateItemName = useCallback(async (itemId, newName) => {
    if (isReadOnly) return
    await update(ref(database, `lists/${listId}/items/${itemId}`), {
      name: newName,
    })
  }, [isReadOnly, listId])

  const updateItemAmount = useCallback(async (itemId, newAmount) => {
    if (isReadOnly) return
    await update(ref(database, `lists/${listId}/items/${itemId}`), {
      amount: parseFloat(newAmount),
    })
  }, [isReadOnly, listId])

  const deleteListFromDb = useCallback(async () => {
    if (isReadOnly) return
    await remove(ref(database, `lists/${listId}`))
  }, [isReadOnly, listId])

  const createListInDb = useCallback(async (targetListId, name) => {
    if (isReadOnly) return
    await set(ref(database, `lists/${targetListId}`), {
      name,
      items: null,
      extraPayments: null,
    })
  }, [isReadOnly])

  const updateListNameInDb = useCallback(async (newName) => {
    if (isReadOnly) return
    await update(ref(database, `lists/${listId}`), {
      name: newName,
    })
  }, [isReadOnly, listId])

  const updateListNameInDbById = useCallback(async (targetListId, newName) => {
    if (isReadOnly) return
    await update(ref(database, `lists/${targetListId}`), {
      name: newName,
    })
  }, [isReadOnly])

  const ensureListExists = useCallback(async (targetListId, name) => {
    if (isReadOnly) return
    const snapshot = await get(ref(database, `lists/${targetListId}`))
    if (!snapshot.exists()) {
      await set(ref(database, `lists/${targetListId}`), {
        name,
        items: null,
        extraPayments: null,
      })
    } else {
      const data = snapshot.val()
      if (!data.name && name) {
        await update(ref(database, `lists/${targetListId}`), { name })
      }
    }
    setIsInitialized(true)
  }, [isReadOnly])

  const addExtraPayment = useCallback(async (amount, date, note) => {
    if (isReadOnly) return
    const newEpRef = ref(database, `lists/${listId}/extraPayments`)
    await push(newEpRef, {
      name: 'Payment',
      amount: parseFloat(amount),
      date: date || null,
      note: note || null,
      createdAt: Date.now(),
    })
  }, [isReadOnly, listId])

  const removeExtraPayment = useCallback(async (epId) => {
    if (isReadOnly) return
    await remove(ref(database, `lists/${listId}/extraPayments/${epId}`))
  }, [isReadOnly, listId])

  const addMember = useCallback(async (name) => {
    if (isReadOnly) return
    const newMemberRef = ref(database, `lists/${listId}/members`)
    await push(newMemberRef, {
      name,
      createdAt: Date.now(),
    })
  }, [isReadOnly, listId])

  const removeMember = useCallback(async (memberId) => {
    if (isReadOnly) return
    await remove(ref(database, `lists/${listId}/members/${memberId}`))
    
    const itemsSnapshot = await get(ref(database, `lists/${listId}/items`))
    if (itemsSnapshot.exists()) {
      const items = itemsSnapshot.val()
      for (const [itemId, item] of Object.entries(items)) {
        if (item.assignedTo && item.assignedTo.includes(memberId)) {
          const newAssignedTo = item.assignedTo.filter(id => id !== memberId)
          await update(ref(database, `lists/${listId}/items/${itemId}`), {
            assignedTo: newAssignedTo.length > 0 ? newAssignedTo : null,
          })
        }
        if (item.payments) {
          const payments = item.payments.filter(p => p.memberId !== memberId)
          await update(ref(database, `lists/${listId}/items/${itemId}`), {
            payments: payments.length > 0 ? payments : null,
          })
        }
      }
    }
  }, [isReadOnly, listId])

  const toggleGroupMode = useCallback(async (enable) => {
    if (isReadOnly) return
    if (!enable && members.length === 0) {
      await update(ref(database, `lists/${listId}`), {
        isGroupMode: false,
      })
    } else {
      await update(ref(database, `lists/${listId}`), {
        isGroupMode: enable,
        wasInGroupMode: true,
      })
    }
  }, [isReadOnly, listId, members.length])

  const assignMembersToItem = useCallback(async (itemId, memberIds) => {
    if (isReadOnly) return
    await update(ref(database, `lists/${listId}/items/${itemId}`), {
      assignedTo: memberIds.length > 0 ? memberIds : null,
    })
  }, [isReadOnly, listId])

  const addItemPayment = useCallback(async (itemId, memberId, amount, date, note) => {
    if (isReadOnly) return
    const itemRef = ref(database, `lists/${listId}/items/${itemId}`)
    const snapshot = await get(itemRef)
    if (!snapshot.exists()) return
    
    const item = snapshot.val()
    const existingPayments = item.payments || []
    
    await update(itemRef, {
      payments: [
        ...existingPayments,
        {
          memberId,
          amount: parseFloat(amount),
          date: date || null,
          note: note || null,
          createdAt: Date.now(),
        }
      ]
    })
  }, [isReadOnly, listId])

  const removeItemPayment = useCallback(async (itemId, paymentIndex) => {
    if (isReadOnly) return
    const itemRef = ref(database, `lists/${listId}/items/${itemId}`)
    const snapshot = await get(itemRef)
    if (!snapshot.exists()) return
    
    const item = snapshot.val()
    const payments = item.payments || []
    payments.splice(paymentIndex, 1)
    
    await update(itemRef, {
      payments: payments.length > 0 ? payments : null,
    })
  }, [isReadOnly, listId])

  const togglePaymentStatus = useCallback(async (itemId, memberId, isPaid) => {
    if (isReadOnly) return
    const itemRef = ref(database, `lists/${listId}/items/${itemId}`)
    const snapshot = await get(itemRef)
    if (!snapshot.exists()) return
    
    const item = snapshot.val()
    const payments = item.payments || []
    
    if (isPaid) {
      const existingPayment = payments.find(p => p.memberId === memberId)
      if (!existingPayment) {
        payments.push({
          memberId,
          amount: item.amount,
          createdAt: Date.now(),
        })
      }
    } else {
      const filtered = payments.filter(p => p.memberId !== memberId)
      payments.length = 0
      payments.push(...filtered)
    }
    
    await update(itemRef, {
      payments: payments.length > 0 ? payments : null,
    })
  }, [isReadOnly, listId])

  const copyList = useCallback(async () => {
    const newListId = generateId()
    const newListRef = ref(database, `lists/${newListId}`)
    
    await set(newListRef, {
      name: listName || 'Untitled',
      extraPayments: null,
      items: items.reduce((acc, item) => {
        acc[item.id] = {
          name: item.name,
          amount: item.amount,
          isPaid: false,
          createdAt: Date.now(),
        }
        return acc
      }, {}),
    })

    return newListId
  }, [items, listName])

  const calculateTotals = () => {
    const total = items.reduce((acc, item) => acc + (item.amount || 0), 0)
    
    let paidFromItems = 0
    let memberBalances = {}
    
    members.forEach(member => {
      memberBalances[member.id] = { paid: 0, owed: 0 }
    })
    
    items.forEach(item => {
      const assignedTo = item.assignedTo || []
      const payments = item.payments || []
      
      assignedTo.forEach(memberId => {
        const member = members.find(m => m.id === memberId)
        if (member) {
          memberBalances[memberId].owed += item.amount
        }
      })
      
      payments.forEach(payment => {
        if (memberBalances[payment.memberId]) {
          memberBalances[payment.memberId].paid += payment.amount
        }
      })
    })
    
    members.forEach(member => {
      paidFromItems += memberBalances[member.id].paid
    })
    
    if (isGroupMode) {
      const memberBreakdown = members.map(member => ({
        id: member.id,
        name: member.name,
        paid: memberBalances[member.id].paid,
        owed: memberBalances[member.id].owed,
        remaining: memberBalances[member.id].owed - memberBalances[member.id].paid,
      }))
      
      return {
        total,
        paidFromItems,
        totalExtraPayments: 0,
        paid: paidFromItems,
        remaining: total - paidFromItems,
        memberBreakdown,
      }
    }
    
    const totalExtraPayments = extraPayments.reduce(
      (acc, ep) => acc + (ep.amount || 0),
      0
    )
    
    const paid = paidFromItems + totalExtraPayments
    const remaining = total - paid
    
    return {
      total,
      paidFromItems,
      totalExtraPayments,
      paid,
      remaining,
      memberBreakdown: [],
    }
  }

  const totals = calculateTotals()

  return {
    items,
    extraPayments,
    members,
    isGroupMode,
    wasInGroupMode,
    loading,
    error,
    listExists,
    listName,
    isInitialized,
    totals,
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
    addMember,
    removeMember,
    toggleGroupMode,
    assignMembersToItem,
    addItemPayment,
    removeItemPayment,
    togglePaymentStatus,
    copyList,
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) +
         Math.random().toString(36).substring(2, 10)
}

export function generateListId() {
  return generateId()
}
