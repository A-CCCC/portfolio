// src/pages/projects/TheLog.jsx
import PageIntro from '../../components/PageIntro'
import { describe } from '../../data/site-copy'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = describe('the-log')

export default function TheLog() {
  return (
    <div className="home-backdrop wall-page" style={{ color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="The Log" description={DESCRIPTION} comingSoon />
    </div>
  )
}
