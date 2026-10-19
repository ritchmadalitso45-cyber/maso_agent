import { useState, useRef, useEffect } from 'react'
import './App.css'
import { presentResult } from './resultPresentation'
import { createAnalysisRequest, validateAttachment } from './analysisRequest'

// ── Maso avatar icon (shield + robot face) ────────────────────────────────
function MasoAvatar({ size = 36 }) {
  return (
    <div className="maso-avatar" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="18" cy="18" r="18" fill="#7C3AED" />
        {/* robot face */}
        <rect x="10" y="12" width="16" height="13" rx="3" fill="white" fillOpacity="0.95" />
        <circle cx="14.5" cy="18" r="2" fill="#7C3AED" />
        <circle cx="21.5" cy="18" r="2" fill="#7C3AED" />
        <rect x="13" y="22" width="10" height="1.5" rx="0.75" fill="#7C3AED" />
        {/* antenna */}
        <line x1="18" y1="12" x2="18" y2="8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="7" r="1.5" fill="white" />
      </svg>
    </div>
  )
}

// ── Timestamp helper ──────────────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Concise guidance follows the server verdict; it never recalculates risk.
function ChecklistBubble({ result }) {
  const presentation = presentResult(result)
  const checkedItems = [
    ...(result.checks.ai === 'completed' ? [result.checks.model_type === 'url' ? 'Link address checked' : 'Message checked'] : []),
    ...(result.checks.openphish === 'completed' || (result.checks.threat_provider === 'openphish' && result.checks.threat_intelligence === 'completed') ? ['OpenPhish scam reports checked'] : []),
    ...(result.checks.linked_urls_ai === 'completed' ? ['Linked addresses checked'] : []),
  ]
  return (
    <section className={`result-card result-card--${presentation.tone}`} aria-label={presentation.title}>
      <div className="result-heading">
        <span className="result-shield" aria-hidden="true">
          <svg width="26" height="28" viewBox="0 0 24 26" fill="none">
            <path d="M12 2 3 5.5v7c0 5 5.5 9 9 11.5 3.5-2.5 9-6.5 9-11.5v-7L12 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M12 8v6m0 3v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="result-eyebrow">YOUR SAFETY CHECK</span>
      </div>
      <h2 className="result-title">{presentation.title}</h2>
      <p className="result-description">{presentation.description}</p>
      <ul className="result-checked">{checkedItems.map(item => <li key={item}><span aria-hidden="true">✓</span> {item}</li>)}</ul>
      <div className="result-action"><span aria-hidden="true">↗</span><div><h3>What to do</h3><p>{presentation.action}</p></div></div>
      <p className="result-footnote">{presentation.note}</p>
    </section>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--bot'}`}>
      {!isUser && <MasoAvatar size={32} />}
      <div className={`message-wrap ${msg.checkResult ? 'message-wrap--result' : ''}`}>
        <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'} ${msg.checkResult ? 'bubble--result' : ''}`}>
          {msg.checkResult ? (
            <ChecklistBubble result={msg.checkResult} />
          ) : (
            <p>{msg.text}</p>
          )}
        </div>
        <span className="msg-time">{formatTime(msg.time)}</span>
      </div>
    </div>
  )
}

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="message-row message-row--bot">
      <MasoAvatar size={32} />
      <div className="message-wrap">
        <div className="bubble bubble--bot bubble--typing">
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────
const WELCOME_MESSAGES = [
  {
    id: 'w1',
    role: 'bot',
    text: "Hey! 👋 I'm Maso, your AI link safety buddy.",
    time: new Date(),
  },
  {
    id: 'w2',
    role: 'bot',
    text: 'Paste a link or a message you received. Get a quick scam check and what to do next.',
    time: new Date(),
  },
]

export default function App() {
  const [messages, setMessages] = useState(WELCOME_MESSAGES)
  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [checkThreatFeed, setCheckThreatFeed] = useState(true)
  const fileRef = useRef(null)
  const sendingRef = useRef(false)
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async () => {
    const trimmed = input.trim()
    if ((!trimmed && !attachment) || sendingRef.current) return
    sendingRef.current = true
    const selectedFile = attachment
    const kind = selectedFile ? validateAttachment(selectedFile) : 'text'

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: selectedFile ? `${kind === 'email' ? 'Email' : 'QR image'}: ${selectedFile.name}` : trimmed,
      time: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    if (!selectedFile) setInput('')
    setAttachment(null)
    setAttachmentError('')
    setIsTyping(true)

    try {
      const request = createAnalysisRequest(trimmed, selectedFile, checkThreatFeed)
      const response = await fetch(request.url, {
        ...request.options,
        signal: AbortSignal.timeout(45000),
      })
      if (!response.ok) {
        const errors = {
          401: 'Maso couldn’t connect securely. Please ask the person running Maso to check the connection.',
          413: selectedFile ? 'This file is too large. Please choose a file no larger than 2 MB.' : 'That message is too large. Please submit a shorter excerpt.',
          422: kind === 'qr' ? 'I couldn’t read a supported link or message from this QR image. Try a clearer image with a QR code.' : kind === 'email' ? 'I couldn’t read a supported message from this email. Try another .eml file or paste the message instead.' : 'Paste a link or a message you received, up to 20,000 characters. I only check for scams—not general questions or other tasks.',
          503: 'I couldn’t finish this check. Please try again in a moment. This doesn’t tell us whether it’s safe.',
        }
        throw new Error(errors[response.status] || 'I couldn’t finish this check. Please try again in a moment.')
      }
      const result = await response.json()
      setMessages(prev => [...prev, {
        id: `b-${Date.now()}`, role: 'bot', checkResult: result, time: new Date(),
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: 'bot', time: new Date(),
        text: error.name === 'TimeoutError'
          ? 'The check timed out. Please try again.'
          : error instanceof TypeError ? 'I’m having trouble connecting. Please try again in a moment.' : error.message,
      }])
    } finally {
      sendingRef.current = false
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      validateAttachment(file)
      setAttachment(file)
      setAttachmentError('')
    } catch (error) {
      setAttachmentError(error.message)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="phone-shell" role="main">
      {/* Status bar */}
      <div className="status-bar" aria-hidden="true">
        <span className="status-time">9:41</span>
        <div className="status-icons">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor"><rect x="0" y="3" width="3" height="7" rx="0.5"/><rect x="4" y="2" width="3" height="8" rx="0.5"/><rect x="8" y="1" width="3" height="9" rx="0.5"/><rect x="12" y="0" width="3" height="10" rx="0.5"/></svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 2.5C9.4 2.5 11.1 3.3 12.3 4.6L13.7 3.2C12.1 1.5 9.9 0.5 7.5 0.5C5.1 0.5 2.9 1.5 1.3 3.2L2.7 4.6C3.9 3.3 5.6 2.5 7.5 2.5Z"/><path d="M7.5 5.5C8.7 5.5 9.8 6 10.6 6.8L12 5.4C10.8 4.2 9.2 3.5 7.5 3.5C5.8 3.5 4.2 4.2 3 5.4L4.4 6.8C5.2 6 6.3 5.5 7.5 5.5Z"/><circle cx="7.5" cy="9.5" r="1.5"/></svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor"><rect x="0" y="1" width="22" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="1.5" y="2.5" width="16" height="7" rx="1.2" fill="currentColor"/><path d="M23 4v4a2 2 0 000-4z"/></svg>
        </div>
      </div>

      {/* Header */}
      <header className="chat-header">
        <button className="header-icon-btn" aria-label="Menu">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor"><rect width="20" height="2" rx="1"/><rect y="6" width="14" height="2" rx="1"/><rect y="12" width="20" height="2" rx="1"/></svg>
        </button>

        <div className="header-center">
          <MasoAvatar size={44} />
          <div>
            <h1 className="header-name">Maso</h1>
            <p className="header-sub">
              <span className="online-dot" aria-hidden="true" /> Always here to help you
            </p>
          </div>
        </div>

        <button className="header-icon-btn" aria-label="History">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z" clipRule="evenodd"/></svg>
        </button>
      </header>

      {/* Messages */}
      <div className="messages-area" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <label className="deeper-check"><input type="checkbox" checked={checkThreatFeed} disabled={isTyping} onChange={event => setCheckThreatFeed(event.target.checked)} />
        <span>Check OpenPhish scam reports<small>Checks links locally against a feed updated every 12 hours.</small></span>
      </label>
      {attachment && <div className="attachment-preview" role="status">
        <div><strong>{attachment.name}</strong><span>Ready to check · your typed message stays as a draft</span></div>
        <button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment">×</button>
      </div>}
      {attachmentError && <p className="attachment-error" role="alert">{attachmentError}</p>}
      {isTyping && <p className="upload-status" role="status">Checking…</p>}
      <input ref={fileRef} type="file" accept=".eml,.png,.jpg,.jpeg,.webp" hidden onChange={handleFileSelect} disabled={isTyping} aria-label="Choose an email or QR image" />
      {/* Input bar */}
      <div className="input-bar">
        <button type="button" className="input-attach-btn" aria-label="Attach email or QR image" title="Attach an email (.eml) or QR image · up to 2 MB" disabled={isTyping} onClick={() => fileRef.current?.click()}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
        </button>

        <textarea
          ref={inputRef}
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachment ? 'File ready — press Send to check' : 'Paste a link or message…'}
          disabled={Boolean(attachment) || isTyping}
          rows={1}
          maxLength={20000}
          aria-label="Type your message"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          aria-label="Send message"
          disabled={(!input.trim() && !attachment) || isTyping}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M16.5 9L2 2l2.5 7L2 16l14.5-7z"/></svg>
        </button>
      </div>
    </div>
  )
}
