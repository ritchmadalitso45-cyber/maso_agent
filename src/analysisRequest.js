const MAX_FILE_SIZE = 2 * 1024 * 1024
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])

export function attachmentKind(file) {
  const extension = file.name.split('.').pop().toLowerCase()
  if (extension === 'eml') return 'email'
  if (IMAGE_EXTENSIONS.has(extension)) return 'qr'
  throw new Error('Choose an email (.eml) or a QR image (.png, .jpg or .webp).')
}

export function validateAttachment(file) {
  const kind = attachmentKind(file)
  if (file.size === 0) throw new Error('This file is empty. Please choose another file.')
  if (file.size > MAX_FILE_SIZE) throw new Error('This file is too large. Choose a file no larger than 2 MB.')
  return kind
}

export function createAnalysisRequest(content, file, checkThreatFeed = false) {
  if (file) {
    const kind = validateAttachment(file)
    const body = new FormData()
    body.append('file', file)
    return { kind, url: `/api/v1/analyze/${kind}?expand_links=false&external_checks=${checkThreatFeed}`, options: { method: 'POST', body } }
  }
  return {
    kind: 'text', url: '/api/v1/analyze', options: {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, expand_links: false, external_checks: checkThreatFeed }),
    },
  }
}
