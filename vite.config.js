import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { buildPhotoManifest } from './scripts/photo-manifest.mjs'

// Reads public/photos/<page>/ into a list the pages can import, so dropping a
// photo into a folder is all it takes to put it on the page. Runs before every
// build and when the dev server starts.
const photoManifest = () => ({
  name: 'photo-manifest',
  // Both hooks discard the return value on purpose: buildPhotoManifest hands
  // back the list it wrote, and Vite treats anything returned from
  // configureServer as a function to call once its middlewares are in place —
  // which crashed the dev server with "fn is not a function".
  buildStart() {
    buildPhotoManifest()
  },
  configureServer() {
    buildPhotoManifest()
  },
})

// https://vite.dev/config/
export default defineConfig({
  // Where the site will be served from. '/' for a domain root — which is what
  // dev and any normal host want — and something like '/Portfolio/' for a
  // GitHub project page, which serves out of a subfolder. Everything that
  // reaches for a file in public/ goes through src/lib-asset.js, which reads
  // this back at runtime.
  base: process.env.VITE_BASE || '/',
  plugins: [photoManifest(), react()],
})
