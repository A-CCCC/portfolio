// src/data/site-copy.js
//
// The writing that only exists on Alex's machine.
//
// src/data/private/copy.js is gitignored, so it is here when the site is built
// locally and absent when GitHub builds it. Everything that reads from here
// therefore has two forms: the full page at home, and a page that says it is
// being worked on in public. There is no flag to set and nothing to remember —
// what is published cannot include what was never pushed.
//
// import.meta.glob is how a module can be optional: a plain import of a missing
// file stops the build, while this simply finds nothing.
const found = import.meta.glob('./private/copy.js', { eager: true })
const copy = Object.values(found)[0]?.default ?? null

// True only where the private copy exists, which is to say never in public.
export const isFullSite = Boolean(copy)

// A page's line under its title, or nothing — in which case PageIntro says the
// page is coming instead.
export const describe = (page) => copy?.descriptions?.[page] ?? ''

// Email and LinkedIn, or null, in which case the ways to get in touch are not
// built at all rather than being hidden with CSS.
export const contact = copy?.contact ?? null
