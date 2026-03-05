export function parseImportedJson(jsonString) {
  let data
  try {
    data = JSON.parse(jsonString)
  } catch {
    return { error: 'Invalid JSON format' }
  }

  if (!data.version || !data.list) {
    return { error: 'Invalid file format: missing required fields' }
  }

  const { list } = data
  if (!list.name || !Array.isArray(list.items)) {
    return { error: 'Invalid file format: missing list name or items' }
  }

  const items = []
  for (const item of list.items) {
    if (typeof item.name !== 'string' || typeof item.amount !== 'number') {
      continue
    }
    items.push({
      name: item.name,
      amount: item.amount,
      isPaid: Boolean(item.isPaid),
      createdAt: item.createdAt || Date.now(),
    })
  }

  const extraPayments = []
  if (Array.isArray(list.extraPayments)) {
    for (const ep of list.extraPayments) {
      if (typeof ep.name !== 'string' || typeof ep.amount !== 'number') {
        continue
      }
      extraPayments.push({
        name: ep.name,
        amount: ep.amount,
        date: ep.date || null,
        createdAt: ep.createdAt || Date.now(),
      })
    }
  }

  return {
    listName: list.name,
    items,
    extraPayments,
  }
}

export function findDuplicates(existingItems, importedItems) {
  const existingNames = new Set(existingItems.map(item => item.name.toLowerCase().trim()))
  const duplicates = []
  const nonDuplicates = []

  for (const item of importedItems) {
    if (existingNames.has(item.name.toLowerCase().trim())) {
      duplicates.push(item)
    } else {
      nonDuplicates.push(item)
    }
  }

  return { duplicates, nonDuplicates }
}

export function generateId() {
  return Math.random().toString(36).substring(2, 10) +
         Math.random().toString(36).substring(2, 10)
}

export function prepareImportData(items, extraPayments, mode, existingItems = [], skipDuplicates = true) {
  if (mode === 'replace') {
    return {
      items: items.map(item => ({ ...item, id: generateId() })),
      extraPayments: extraPayments.map(ep => ({ ...ep, id: generateId() })),
    }
  }

  if (!skipDuplicates) {
    return {
      items: items.map(item => ({ ...item, id: generateId() })),
      extraPayments: extraPayments.map(ep => ({ ...ep, id: generateId() })),
    }
  }

  const { duplicates, nonDuplicates } = findDuplicates(existingItems, items)

  return {
    items: nonDuplicates.map(item => ({ ...item, id: generateId() })),
    extraPayments: extraPayments.map(ep => ({ ...ep, id: generateId() })),
    duplicates,
  }
}
