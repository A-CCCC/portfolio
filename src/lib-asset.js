// src/lib-asset.js
//
// Where a file in public/ actually lives, given where the site is being served
// from. At a domain root that is the path unchanged; under a subfolder — a
// GitHub project page is served from /Portfolio/ — everything needs that in
// front of it or it looks for the file at the root of the domain and finds
// nothing.
//
// Vite fills in BASE_URL at build time from the `base` in vite.config.js, and it
// is '/' unless something sets it, so this costs nothing when hosted at a root.
export default function asset(path) {
  return `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`
}
