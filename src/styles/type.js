// src/styles/type.js
//
// One scale for the whole site. Sizes were previously written inline wherever
// they were needed, which left the same kind of text set differently depending
// only on which layout it landed in — body copy at four sizes, section headings
// at three — and the differences read as mistakes rather than hierarchy.
//
// Five steps, each with a job. Most of them are a range rather than a size:
// the same heading has to sit on a phone and on a desktop, and a fixed 3rem
// title that looks right across a window takes up a third of a 375px screen.
// The top of each range is what the site has always been; the bottom is what
// it comes down to on a phone, and in between it follows the width.
export const TYPE = {
  pageTitle: 'clamp(2rem, 9vw, 3rem)',              // the name of a page, on its own screen
  // Kept for the hubs to go back to: they use pageTitle for now, to see
  // whether matching the rest of the site reads better than towering over it.
  hubTitle: 'clamp(2.15rem, 7vw, 5.5rem)',
  hubCategory: 'clamp(1.75rem, 4vw, 3.25rem)',  // a category on a hub page
  umbrella: 'clamp(2rem, 9vw, 3rem)',               // a heading introducing sub-sections below it
  section: 'clamp(1.7rem, 7.4vw, 2.5rem)',              // a section with its own text or photos
  sub: 'clamp(1.5rem, 6vw, 2rem)',                    // a sub-section under an umbrella
  body: '1.15rem',                // every paragraph, whatever its layout
  lead: '1.15rem',                // the line under a page title
  small: '0.95rem',               // nav links, counts, captions under a photo
  card: 'clamp(1.35rem, 4.6vw, 1.6rem)',                 // a project's name on a carousel card
  caption: '0.85rem',             // the smallest type on the site
}

// Where a page's title sits on its opening screen: its top where a one-line
// title (line-height 1.2, see h1.glass-title) and a one-line line under it
// (TYPE.lead at 1.7, 24px below) would put it centred together. Fixed rather
// than centred, so a title or a line that wraps on a phone, or a page with
// no line at all, does not move it: whatever is extra runs downward.
export const HERO_TOP = `calc(var(--screen) / 2 - 0.6 * ${TYPE.pageTitle} - 12px - 0.85 * ${TYPE.lead})`
