import { useState, useRef, useEffect } from 'react'
import './App.css'

// Maso avatar icon (shield + robot face) 
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

// Timestamp helper 
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

//  Safety analysis logic 
function analyzeInput(text) {
  const lower = text.toLowerCase().trim()

  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi
  const urls = text.match(urlRegex) || []

  // Suspicious keyword signals
  const phishingKeywords = [
    'verify', 'confirm', 'suspended', 'urgent', 'click here', 'account',
    'password', 'login', 'signin', 'paypal', 'bank', 'prize', 'winner',
    'congratulations', 'free', 'limited time', 'act now', 'claim',
    'update your', 'billing', 'unusual activity', 'locked',
  ]
  const matchedKeywords = phishingKeywords.filter(k => lower.includes(k))

  const suspiciousPatterns = {
    shortenedUrl: /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|rb\.gy|is\.gd/i.test(text),
    ipAddress: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i.test(text),
    manySubdomains: /([a-z0-9-]+\.){3,}[a-z]{2,}/i.test(text),
    atSymbolInUrl: urls.some(u => u.includes('@')),
    lookalikeDomain: /paypa1|g00gle|arnazon|micros0ft|faceb00k|inst4gram/i.test(text),
    qrMention: /qr\s*code|scan\s*(this|the|to)/i.test(lower),
    hyphenDomain: /[a-z]+-[a-z]+-[a-z]+\.(com|net|org|io)/i.test(text),
    noHttps: urls.length > 0 && urls.some(u => u.startsWith('http://')),
  }

  const flags = Object.entries(suspiciousPatterns)
    .filter(([, v]) => v)
    .map(([k]) => k)

  const totalSignals = flags.length + Math.min(matchedKeywords.length, 3)

  let riskLevel, riskLabel, riskColor
  if (totalSignals === 0 && urls.length === 0) {
    riskLevel = 'unknown'
    riskLabel = 'No links detected'
    riskColor = 'neutral'
  } else if (totalSignals === 0) {
    riskLevel = 'safe'
    riskLabel = 'Looks Clean'
    riskColor = 'safe'
  } else if (totalSignals <= 2) {
    riskLevel = 'caution'
    riskLabel = 'Worth a second look'
    riskColor = 'caution'
  } else {
    riskLevel = 'danger'
    riskLabel = 'Suspicious — be careful'
    riskColor = 'danger'
  }

  // Build checklist items
  const checklist = [
    {
      label: 'HTTPS encrypted connection',
      pass: urls.length === 0 || urls.every(u => u.startsWith('https://')),
      detail: suspiciousPatterns.noHttps ? 'Uses plain HTTP — not encrypted' : null,
    },
    {
      label: 'No URL shortener detected',
      pass: !suspiciousPatterns.shortenedUrl,
      detail: suspiciousPatterns.shortenedUrl ? 'Shortened link hides the real destination' : null,
    },
    {
      label: 'No IP address used as domain',
      pass: !suspiciousPatterns.ipAddress,
      detail: suspiciousPatterns.ipAddress ? 'Legitimate sites use domain names, not raw IPs' : null,
    },
    {
      label: 'No lookalike domain tricks',
      pass: !suspiciousPatterns.lookalikeDomain,
      detail: suspiciousPatterns.lookalikeDomain ? 'Domain mimics a trusted brand with character swaps' : null,
    },
    {
      label: 'No suspicious @ in URL',
      pass: !suspiciousPatterns.atSymbolInUrl,
      detail: suspiciousPatterns.atSymbolInUrl ? '@  in a URL redirects to a different host' : null,
    },
    {
      label: 'No urgency / scare language',
      pass: matchedKeywords.length === 0,
      detail: matchedKeywords.length > 0 ? `Pressure words found: ${matchedKeywords.slice(0, 3).join(', ')}` : null,
    },
    {
      label: 'No QR-code redirect trick',
      pass: !suspiciousPatterns.qrMention,
      detail: suspiciousPatterns.qrMention ? 'QR codes can hide phishing URLs' : null,
    },
  ]

  // Summary message
  let summary = ''
  if (riskLevel === 'unknown') {
    summary = "I didn't spot any links in that message. If you have a URL or suspicious text to check, paste it in and I'll take a look."
  } else if (riskLevel === 'safe') {
    summary = `Everything checks out on this one. The link looks clean — no shortened URLs, no dodgy domain tricks, and no pressure language. Still worth being cautious if it arrived out of nowhere.`
  } else if (riskLevel === 'caution') {
    summary = `A couple of things caught my eye. It's not necessarily dangerous, but I'd double-check before clicking or sharing any personal info. See the checklist below.`
  } else {
    summary = `This one raises several red flags. I'd strongly recommend not clicking any links or entering any credentials. Here's what I found:`
  }

  return { riskLevel, riskLabel, riskColor, checklist, summary, urls, flags }
}

// Check result bubble 
function ChecklistBubble({ result }) {
  const failedItems = result.checklist.filter(i => !i.pass)
  const passedItems = result.checklist.filter(i => i.pass)

  return (
    <div className="checklist-bubble">
      {/* Risk badge */}
      <div className={`risk-badge risk-${result.riskColor}`}>
        <span className="risk-icon" aria-hidden="true">
          {result.riskColor === 'safe' && '✓'}
          {result.riskColor === 'caution' && '⚠'}
          {result.riskColor === 'danger' && '✕'}
          {result.riskColor === 'neutral' && '•'}
        </span>
        <span className="risk-label">{result.riskLabel}</span>
      </div>

      {/* Summary */}
      <p className="checklist-summary">{result.summary}</p>

      {/* Failed checks */}
      {failedItems.length > 0 && (
        <div className="check-section">
          <p className="check-section-title">Issues found</p>
          <ul className="check-list">
            {failedItems.map((item, i) => (
              <li key={i} className="check-item check-fail">
                <span className="check-icon" aria-hidden="true">✕</span>
                <span>
                  <strong>{item.label}</strong>
                  {item.detail && <span className="check-detail"> — {item.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Passed checks */}
      {passedItems.length > 0 && (
        <div className="check-section">
          <p className="check-section-title">Passed checks</p>
          <ul className="check-list">
            {passedItems.map((item, i) => (
              <li key={i} className="check-item check-pass">
                <span className="check-icon" aria-hidden="true">✓</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Message bubble 
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`message-row ${isUser ? 'message-row--user' : 'message-row--bot'}`}>
      {!isUser && <MasoAvatar size={32} />}
      <div className="message-wrap">
        <div className={`bubble ${isUser ? 'bubble--user' : 'bubble--bot'}`}>
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

// Typing indicator 
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

//  Main App 
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
    text: 'Paste any link or suspicious message and I\'ll check it for phishing, spoofed domains, URL tricks, and more.',
    time: new Date(),
  },
]

export default function App() {
  const [messages, setMessages] = useState(WELCOME_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      time: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate analysis delay for realism
    setTimeout(() => {
      const result = analyzeInput(trimmed)
      const botMsg = {
        id: `b-${Date.now()}`,
        role: 'bot',
        checkResult: result,
        text: '',
        time: new Date(),
      }
      setIsTyping(false)
      setMessages(prev => [...prev, botMsg])
    }, 1200)
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

      {/* Input bar */}
      <div className="input-bar">
        <button className="input-attach-btn" aria-label="Attach file">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
        </button>

        <textarea
          ref={inputRef}
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a link or message…"
          rows={1}
          aria-label="Type your message"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          aria-label="Send message"
          disabled={!input.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="white"><path d="M16.5 9L2 2l2.5 7L2 16l14.5-7z"/></svg>
        </button>
      </div>
    </div>
  )
}
