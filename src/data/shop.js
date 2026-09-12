// src/data/shop.js
//
// Where a piece can actually be bought. Public on purpose, unlike the copy in
// data/private: a shop listing is already out in the world, and the point of it
// is to be found.
//
// Keyed by the page it belongs to, so a project page asks for its own link and
// the Contact page can list the lot. Adding a listing is one line here — the
// page it belongs to needs nothing new.
export const SHOP = [
  {
    page: 'car-key-holder',
    name: 'Car Key Holder',
    url: 'https://www.etsy.com/listing/4555987572/custom-3d-printed-hyundai-ioniq-5-n-key',
  },
  {
    page: 'sunglasses-holder',
    name: 'Sunglasses Holder',
    url: 'https://www.etsy.com/listing/4549278042/custom-3d-printed-snapon-sunglasses',
  },
]

// The listing for one page, or nothing — in which case the page simply has no
// link, the same way a page with no description has no line.
export const buy = (page) => SHOP.find((item) => item.page === page)?.url ?? ''
