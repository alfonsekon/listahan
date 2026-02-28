export function getJsonString(listName, items, extraPayments) {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    list: {
      name: listName,
      items: items.map(item => ({
        name: item.name,
        amount: item.amount,
        isPaid: item.isPaid,
        createdAt: item.createdAt,
      })),
      extraPayments: extraPayments.map(ep => ({
        name: ep.name,
        amount: ep.amount,
        date: ep.date,
        createdAt: ep.createdAt,
      })),
    },
  }

  return JSON.stringify(data, null, 2)
}

export function exportToJson(listName, items, extraPayments) {
  const jsonString = getJsonString(listName, items, extraPayments)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const timestamp = Date.now()
  const sanitizedName = listName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const filename = `palista-${sanitizedName}-${timestamp}.json`

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(listName, items, extraPayments, onSuccess, onError) {
  const jsonString = getJsonString(listName, items, extraPayments)
  try {
    await navigator.clipboard.writeText(jsonString)
    onSuccess()
  } catch {
    onError()
  }
}
