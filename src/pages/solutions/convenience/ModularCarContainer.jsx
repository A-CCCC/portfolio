// src/pages/solutions/convenience/ModularCarContainer.jsx
import PageIntro from '../../../components/PageIntro'
import { describe } from '../../../data/site-copy'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = describe('modular-car-container')

export default function ModularCarContainer() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="Modular Car Container" description={DESCRIPTION} comingSoon />
    </div>
  )
}
