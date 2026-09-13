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

// Descriptions that are public already, because the pages they belong to are:
// anyone can read the whole project, so withholding the one-line summary of it
// protects nothing. These live here, in the repository, and show everywhere.
const published = {
  'skeleton-barrel': "A paneled barrel modeled with Fusion's pattern tool.",
  'elixir-collector': 'A multi-part model built around a sweep following a 3D path.',
  'cannon-cart': 'My first detailed model, combining revolve, sweep, and extrude.',
  mortar: 'A model combining extruded and mirrored geometry around an angled barrel.',
  'wheelchair-storage': 'A custom container to bring daily materials within reach.',
  'smart-kinesiology-tape': 'Disposable tape to track joint movement and hydration for recovery.',
}

// A page's line under its title. One of the published ones, or — for a project
// whose page is not built out yet — whatever the private copy says, which in
// public is nothing, and PageIntro then says the page is coming instead.
export const describe = (page) => published[page] ?? copy?.descriptions?.[page] ?? ''

// Email and LinkedIn, or null, in which case the ways to get in touch are not
// built at all rather than being hidden with CSS.
export const contact = copy?.contact ?? null

// The résumé, or null. Same reasoning: what is not in the private copy is not
// in the public build at all.
export const resume = copy?.resume ?? null
