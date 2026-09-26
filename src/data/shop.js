// src/data/shop.js
//
// Where a piece can actually be bought. Public on purpose, unlike the copy in
// data/private: a shop listing is already out in the world, and the point of it
// is to be found.
//
// Keyed by the page it belongs to, so a project page asks for its own link, the
// Services page can show the lot, and the picture comes from the same place the
// carousels get theirs — set a thumbnail once in projects.js and it turns up
// here too. Adding a listing is the four lines below.
import { clashRoyale, accessibility, convenience, halloween, misc } from './projects'

const EVERYTHING = [...clashRoyale, ...accessibility, ...convenience, ...halloween, ...misc]

const LISTINGS = [
  {
    page: 'car-key-holder',
    url: 'https://www.etsy.com/listing/4555987572/custom-3d-printed-hyundai-ioniq-5-n-key',
    // One line under the name on the Services page. Left empty it simply has
    // none — better than a sentence nobody meant to write.
    blurb: '',
    tint: 4,
  },
  {
    page: 'sunglasses-holder',
    url: 'https://www.etsy.com/listing/4549278042/custom-3d-printed-snapon-sunglasses',
    blurb: '',
    tint: 6,
  },
]

// The name and the picture belong to the project, not to the listing, so they
// are read off it here rather than written down twice.
export const SHOP = LISTINGS.map((listing) => {
  const project = EVERYTHING.find((item) => item.path.endsWith(`/${listing.page}`))
  return {
    ...listing,
    name: project?.label ?? listing.page,
    image: project?.image ?? '',
  }
})

// The listing for one page, or nothing — in which case the page simply has no
// link, the same way a page with no description has no line.
export const buy = (page) => SHOP.find((item) => item.page === page)?.url ?? ''
