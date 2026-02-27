import { useState, useEffect, useCallback } from 'react'
import { generateRandomName } from '../utils/randomName'

const STORAGE_KEY = 'owelist_data'

const defaultData = {
  lists: [],
  currentListId: null,
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) +
         Math.random().toString(36).substring(2, 10)
}

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
  }
  return defaultData
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function useLists() {
  const [data, setData] = useState(() => loadFromStorage())
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    if (isInitialized) {
      saveToStorage(data)
    }
  }, [data, isInitialized])

  const createList = useCallback((name) => {
    const listName = name || generateRandomName()
    const newList = {
      id: generateId(),
      name: listName,
      createdAt: Date.now(),
    }
    setData((prev) => ({
      lists: [...prev.lists, newList],
      currentListId: newList.id,
    }))
    return newList.id
  }, [])

  const deleteList = useCallback((listId) => {
    setData((prev) => {
      const newLists = prev.lists.filter((l) => l.id !== listId)
      
      let newCurrentId = prev.currentListId
      if (prev.currentListId === listId) {
        if (newLists.length > 0) {
          newCurrentId = newLists[0].id
        } else {
          const newList = {
            id: generateId(),
            name: generateRandomName(),
            createdAt: Date.now(),
          }
          newLists.push(newList)
          newCurrentId = newList.id
        }
      }

      return {
        lists: newLists,
        currentListId: newCurrentId,
      }
    })
  }, [])

  const renameList = useCallback((listId, newName) => {
    setData((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId ? { ...l, name: newName } : l
      ),
    }))
  }, [])

  const setCurrentList = useCallback((listId) => {
    setData((prev) => ({
      ...prev,
      currentListId: listId,
    }))
  }, [])

  const getCurrentList = useCallback(() => {
    return data.lists.find((l) => l.id === data.currentListId) || null
  }, [data.lists, data.currentListId])

  const hasLists = data.lists.length > 0
  const currentListId = data.currentListId
  const listCount = data.lists.length

  return {
    lists: data.lists,
    currentListId,
    hasLists,
    listCount,
    createList,
    deleteList,
    renameList,
    setCurrentList,
    getCurrentList,
  }
}
