// src/pages/solutions/convenience/CarKeyHolder.jsx
import PageIntro from '../../../components/PageIntro'
import { describe } from '../../../data/site-copy'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = describe('car-key-holder')

export default function CarKeyHolder() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="Car Key Holder" description={DESCRIPTION} comingSoon />
    </div>
  )
}
