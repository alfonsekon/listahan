import { useState, useEffect, useCallback } from 'react'
import { ref, set, get, onValue, push, remove, update } from 'firebase/database'
import { database } from '../firebase'

export function useList(listId, isReadOnly = false) {
  const [items, setItems] = useState([])
  const [extraPayments, setExtraPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [listExists, setListExists] = useState(null)
  const [listName, setListName] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const listRef = ref(database, `lists/${listId}`)
  const itemsRef = ref(database, `lists/${listId}/items`)
  const extraPaymentsRef = ref(database, `lists/${listId}/extraPayments`)

  useEffect(() => {
    if (!listId) return

    const unsubscribe = onValue(listRef, (snapshot) => {
      if (snapshot.exists()) {
        setListExists(true)
        const data = snapshot.val()
        if (data) {
          setListName(data.name)
          
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
        } else {
          setItems([])
          setExtraPayments([])
        }
      } else {
        setListExists(false)
        setItems([])
        setExtraPayments([])
      }
      setLoading(false)
      setIsInitialized(true)
    }, (err) => {
      setError(err.message)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [listId])

  const addItem = useCallback(async (name, amount) => {
    if (isReadOnly) return
    const newItemsRef = ref(database, `lists/${listId}/items`)
    await push(newItemsRef, {
      name,
      amount: parseFloat(amount),
      isPaid: false,
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

  const totals = items.reduce(
    (acc, item) => ({
      total: acc.total + item.amount,
      paidFromItems: acc.paidFromItems + (item.isPaid ? item.amount : 0),
    }),
    { total: 0, paidFromItems: 0 }
  )

  const totalExtraPayments = extraPayments.reduce(
    (acc, ep) => acc + (ep.amount || 0),
    0
  )

  const paid = totals.paidFromItems + totalExtraPayments
  const remaining = totals.total - paid

  return {
    items,
    extraPayments,
    loading,
    error,
    listExists,
    listName,
    isInitialized,
    totals: {
      total: totals.total,
      paidFromItems: totals.paidFromItems,
      totalExtraPayments,
      paid,
      remaining,
    },
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
