// src/pages/solutions/convenience/CarKeyHolder.jsx
import PageIntro from '../../../components/PageIntro'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = 'A form-fitted attachment to hold a car key.'

export default function CarKeyHolder() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="Car Key Holder" description={DESCRIPTION} comingSoon />
    </div>
  )
}
