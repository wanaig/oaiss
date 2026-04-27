let blockHeightCounter = 18473000

export function generateTxHash() {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * 16)]
  }
  return hash
}

export function generateBlockHash() {
  return generateTxHash()
}

export function generateBlockHeight() {
  blockHeightCounter += Math.floor(Math.random() * 5) + 1
  return blockHeightCounter
}

export function nowString() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function truncateHash(hash, prefixLen = 6, suffixLen = 4) {
  if (!hash) return '-'
  if (hash.length <= prefixLen + suffixLen + 3) return hash
  return hash.slice(0, prefixLen) + '...' + hash.slice(-suffixLen)
}

export async function copyText(text) {
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
