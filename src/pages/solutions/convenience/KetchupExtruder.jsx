// src/pages/solutions/convenience/KetchupExtruder.jsx
import PageIntro from '../../../components/PageIntro'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = 'A tool to completely empty a ketchup packet.'

export default function KetchupExtruder() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="Ketchup Extruder" description={DESCRIPTION} comingSoon />
    </div>
  )
}
