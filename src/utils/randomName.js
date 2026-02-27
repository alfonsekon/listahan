const adjectives = [
  'happy', 'blue', 'fast', 'green', 'red', 'small', 'big', 'warm', 'cool',
  'bright', 'dark', 'soft', 'hard', 'young', 'old', 'new', 'wild', 'calm',
  'clever', 'brave', 'gentle', 'swift', 'lucky', 'funny', 'nice', 'kind'
]

const nouns = [
  'cat', 'dog', 'bird', 'fish', 'tree', 'flower', 'book', 'chair', 'table',
  'lamp', 'clock', 'phone', 'car', 'bike', 'train', 'plane', 'house', 'garden',
  'park', 'sun', 'moon', 'star', 'cloud', 'rain', 'fire', 'desk', 'pen'
]

export function generateRandomName() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj}-${noun}`
}
