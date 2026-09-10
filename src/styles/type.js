// src/styles/type.js
//
// One scale for the whole site. Sizes were previously written inline wherever
// they were needed, which left the same kind of text set differently depending
// only on which layout it landed in — body copy at four sizes, section headings
// at three — and the differences read as mistakes rather than hierarchy.
//
// Five steps, each with a job:
export const TYPE = {
  pageTitle: '3rem',              // the name of a page, on its own screen
  hubTitle: 'clamp(3rem, 7vw, 5.5rem)',   // Projects and Solutions, a tier above
  hubCategory: 'clamp(2.25rem, 4vw, 3.25rem)',  // a category on a hub page
  umbrella: '3rem',               // a heading introducing sub-sections below it
  section: '2.5rem',              // a section with its own text or photos
  sub: '2rem',                    // a sub-section under an umbrella
  body: '1.15rem',                // every paragraph, whatever its layout
  lead: '1.15rem',                // the line under a page title
  small: '0.95rem',               // nav links, counts, captions under a photo
  card: '1.6rem',                 // a project's name on a carousel card
  caption: '0.85rem',             // the smallest type on the site
}
