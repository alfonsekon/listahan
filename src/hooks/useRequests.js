import { useState, useEffect, useCallback } from 'react'
import { ref, push, update, onValue, remove } from 'firebase/database'
import { database } from '../firebase'

export function useRequests(listId) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listId) return

    const requestsRef = ref(database, `requests/${listId}`)

    const unsubscribe = onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const requestsArray = Object.entries(data).map(([id, request]) => ({
          id,
          ...request,
        }))
        requestsArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        setRequests(requestsArray)
      } else {
        setRequests([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [listId])

  const createRequest = useCallback(async (requestData) => {
    const requestsRef = ref(database, `requests/${listId}`)
    await push(requestsRef, {
      ...requestData,
      status: 'pending',
      createdAt: Date.now(),
    })
  }, [listId])

  const acceptRequest = useCallback(async (request) => {
    if (request.status !== 'pending') return

    if (request.type === 'markPaid') {
      await update(ref(database, `lists/${listId}/items/${request.itemId}`), {
        isPaid: true,
      })
    } else if (request.type === 'addPayment') {
      const paymentsRef = ref(database, `lists/${listId}/extraPayments`)
      await push(paymentsRef, {
        name: 'Payment',
        amount: parseFloat(request.amount),
        date: request.date || null,
        createdAt: Date.now(),
      })
    }

    await update(ref(database, `requests/${listId}/${request.id}`), {
      status: 'accepted',
    })
  }, [listId])

const rejectRequest = useCallback(async (request) => {
    if (request.status !== 'pending') return

    await update(ref(database, `requests/${listId}/${request.id}`), {
      status: 'rejected',
    })
  }, [listId])

  const deleteRequest = useCallback(async (requestId) => {
    await remove(ref(database, `requests/${listId}/${requestId}`))
  }, [listId])

  const clearResolvedRequests = useCallback(async () => {
    const resolved = requests.filter((r) => r.status !== 'pending')
    await Promise.all(
      resolved.map((r) => remove(ref(database, `requests/${listId}/${r.id}`)))
    )
  }, [listId, requests])

  const pendingCount = requests.filter((r) => r.status === 'pending').length

return {
    requests,
    loading,
    pendingCount,
    createRequest,
    acceptRequest,
    rejectRequest,
    deleteRequest,
    clearResolvedRequests,
  }
}
