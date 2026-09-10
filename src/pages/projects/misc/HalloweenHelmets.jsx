// src/pages/projects/misc/HalloweenHelmets.jsx
import PageIntro from '../../../components/PageIntro'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = 'Wearable cardboard helmets and functional accessories, built from scratch for Halloween.'

export default function HalloweenHelmets() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro title="Halloween Helmets" description={DESCRIPTION} comingSoon />
    </div>
  )
}
