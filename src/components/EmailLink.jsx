// src/components/EmailLink.jsx
//
// The address, with a way to take a copy of it. A mailto link is the wrong
// answer for anyone whose mail is a tab rather than an app — it opens something
// they never use — so the address sits beside a button that puts it on the
// clipboard, and both are there to be chosen between.
//
// Used everywhere the address appears, so the two cannot drift apart.
import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'

// Long enough to be read, short enough not to be a state the page is stuck in.
const SAYS_COPIED = 1800

export default function EmailLink({ email, className, style }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), SAYS_COPIED)
    return () => clearTimeout(timer)
  }, [copied])

  const take = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
    } catch {
      // No clipboard to write to — an old browser, or a page served over
      // plain http. The address is right there to be selected by hand.
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <a href={`mailto:${email}`} className={className} style={style}>{email}</a>

      <button
        type="button"
        className="copy-email"
        onClick={take}
        aria-label={copied ? 'Address copied' : 'Copy the address'}
        title={copied ? 'Copied' : 'Copy'}
      >
        {copied
          ? <Check size={14} strokeWidth={2.2} aria-hidden="true" />
          : <Copy size={14} strokeWidth={2} aria-hidden="true" />}
      </button>

      {/* Said aloud for anyone who cannot see the tick */}
      <span
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? 'Address copied' : ''}
      </span>
    </span>
  )
}
