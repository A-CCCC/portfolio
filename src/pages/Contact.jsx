// src/pages/Contact.jsx
import useFadeIn from '../hooks/useFadeIn'
import { TYPE } from '../styles/type'

// The address the home page also shows, in one place on each page so the two
// cannot drift apart.
const EMAIL = 'azschang@gmail.com'

export default function Contact() {
  const titleOpacity = useFadeIn(100)
  const bodyOpacity = useFadeIn(600)

  return (
    <div style={{
      minHeight: '100vh',
      fontFamily: 'system-ui',
      padding: '120px 24px 80px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontSize: TYPE.pageTitle,
        fontWeight: 'bold',
        marginBottom: 32,
        opacity: titleOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        Contact
      </h1>
      <div style={{
        color: 'var(--text-body)',
        fontSize: TYPE.body,
        lineHeight: 1.9,
        opacity: bodyOpacity,
        transition: 'opacity 1.5s ease',
      }}>
        <p style={{ marginBottom: 8 }}>
          <a href={`mailto:${EMAIL}`} style={{ color: 'var(--text-body)' }}>
            {EMAIL}
          </a>
        </p>
        <p>
          <a href="https://www.linkedin.com/in/alex-c-243881370/" target="_blank" rel="noreferrer" style={{ color: 'var(--text-body)' }}>
            LinkedIn
          </a>
        </p>
      </div>
    </div>
  )
}