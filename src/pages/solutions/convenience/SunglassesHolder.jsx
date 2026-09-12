// src/pages/solutions/convenience/SunglassesHolder.jsx
import PageIntro from '../../../components/PageIntro'
import { describe } from '../../../data/site-copy'
import { buy } from '../../../data/shop'

// One line on what this is. Fill it in and the page reads like the finished
// ones; the note stays until the page itself is built out.
const DESCRIPTION = describe('sunglasses-holder')

export default function SunglassesHolder() {
  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui' }}>
      <PageIntro
        title="Sunglasses Holder"
        description={DESCRIPTION}
        comingSoon
        buy={buy('sunglasses-holder')}
      />
    </div>
  )
}
