// src/pages/projects/TheLog.jsx
import PageIntro from '../../components/PageIntro'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = ''

export default function TheLog() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="The Log" description={DESCRIPTION} comingSoon />
    </div>
  )
}
