// src/App.jsx
import { Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { page, preloadPages } from './lib-page'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import EggCrack from './components/EggCrack'
import ThemeToggle from './components/ThemeToggle'
import SiteFooter from './components/SiteFooter'
import Loads from './components/Loads'
// The front page comes with the site; every other page is fetched when it is
// needed, and all of them quietly once the first has settled (see lib-page).
const About = page(() => import('./pages/About'))
const Contact = page(() => import('./pages/Contact'))
const Projects = page(() => import('./pages/Projects'))
const ClashRoyale = page(() => import('./pages/projects/ClashRoyale'))
const SkeletonBarrel = page(() => import('./pages/projects/SkeletonBarrel'))
const ElixirCollector = page(() => import('./pages/projects/ElixirCollector'))
const CannonCart = page(() => import('./pages/projects/CannonCart'))
const Mortar = page(() => import('./pages/projects/Mortar'))
// the-log: held back for now, see src/data/projects.js
// import TheLog from './pages/projects/TheLog'
const Halloween = page(() => import('./pages/projects/Halloween'))
const DarthVader = page(() => import('./pages/projects/halloween/DarthVader'))
const Stormtrooper = page(() => import('./pages/projects/halloween/Stormtrooper'))
const ScoutTrooper = page(() => import('./pages/projects/halloween/ScoutTrooper'))
const Electrobinoculars = page(() => import('./pages/projects/halloween/Electrobinoculars'))
const Lightsaber = page(() => import('./pages/projects/halloween/Lightsaber'))
const Minecraft = page(() => import('./pages/projects/halloween/Minecraft'))
const Misc = page(() => import('./pages/projects/Misc'))
const RCCarRepair = page(() => import('./pages/projects/misc/RCCarRepair'))
const MothTrap = page(() => import('./pages/solutions/convenience/MothTrap'))
const Solutions = page(() => import('./pages/Solutions'))
const Accessibility = page(() => import('./pages/solutions/Accessibility'))
const WheelchairStorage = page(() => import('./pages/solutions/accessibility/WheelchairStorage'))
const SmartKinesiologyTape = page(() => import('./pages/solutions/accessibility/SmartKinesiologyTape'))
const Convenience = page(() => import('./pages/solutions/Convenience'))
const BackupCameraWiper = page(() => import('./pages/solutions/convenience/BackupCameraWiper'))
const ModularCarContainer = page(() => import('./pages/solutions/convenience/ModularCarContainer'))
const SunglassesHolder = page(() => import('./pages/solutions/convenience/SunglassesHolder'))
const CarKeyHolder = page(() => import('./pages/solutions/convenience/CarKeyHolder'))
const KetchupExtruder = page(() => import('./pages/solutions/convenience/KetchupExtruder'))
const NotFound = page(() => import('./pages/NotFound'))
// Not in the navbar: easter eggs for anyone who finds them.
const Games = page(() => import('./pages/Games'))
const LogRunner = page(() => import('./components/LogRunner'))
const BarrelDrop = page(() => import('./components/BarrelDrop'))
const SnakeGame = page(() => import('./components/SnakeGame'))
const Loading = page(() => import('./pages/Loading'))

export default function App() {
  useEffect(() => { preloadPages() }, [])
  // Under a subfolder, /solutions is really /Portfolio/solutions. Vite puts the
  // subfolder in BASE_URL at build time and the router takes it from there; at a
  // domain root it is '/' and nothing changes.
  return (
    // (A change of page is a React transition in this router, so a page still
    // being fetched leaves the one showing in place until it comes.)
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Navbar />
      <ScrollToTop />
      <ThemeToggle />
      {/* the way into the games, cracked open (see the component) */}
      <EggCrack />
      {/* Nothing in the moment a page is still being fetched */}
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Routed either way. In public the pages say they are coming, rather
            than their tabs in the navbar leading nowhere. */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        {/* The same page under the name the full site gives it: what can be
            commissioned or bought, rather than just an address. */}
        <Route path="/services" element={<Contact />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/clash-royale" element={<ClashRoyale />} />
        <Route path="/projects/clash-royale/skeleton-barrel" element={<SkeletonBarrel />} />
        <Route path="/projects/clash-royale/elixir-collector" element={<ElixirCollector />} />
        <Route path="/projects/clash-royale/cannon-cart" element={<CannonCart />} />
        <Route path="/projects/clash-royale/mortar" element={<Mortar />} />
        {/* the-log: <Route path="/projects/clash-royale/the-log" element={<TheLog />} /> */}
        <Route path="/projects/halloween" element={<Halloween />} />
        <Route path="/projects/halloween/darth-vader" element={<DarthVader />} />
        <Route path="/projects/halloween/stormtrooper" element={<Stormtrooper />} />
        <Route path="/projects/halloween/scout-trooper" element={<ScoutTrooper />} />
        <Route path="/projects/halloween/electrobinoculars" element={<Electrobinoculars />} />
        <Route path="/projects/halloween/lightsaber" element={<Lightsaber />} />
        <Route path="/projects/halloween/minecraft" element={<Minecraft />} />
        <Route path="/projects/misc" element={<Misc />} />
        <Route path="/projects/misc/rc-car-repair" element={<RCCarRepair />} />
        {/* Moved to the convenience solutions; the old address still finds it */}
        <Route path="/projects/misc/moth-trap" element={<Navigate to="/solutions/convenience/moth-trap" replace />} />
        {/* Where these two used to live, for anyone holding an old link */}
        <Route path="/projects/misc/halloween-helmets" element={<Navigate to="/projects/halloween/darth-vader" replace />} />
        <Route path="/projects/misc/lightsaber" element={<Navigate to="/projects/halloween/lightsaber" replace />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/solutions/accessibility" element={<Accessibility />} />
        <Route path="/solutions/accessibility/wheelchair-storage" element={<WheelchairStorage />} />
        <Route path="/solutions/accessibility/smart-kinesiology-tape" element={<SmartKinesiologyTape />} />
        <Route path="/solutions/convenience" element={<Convenience />} />
        <Route path="/solutions/convenience/backup-camera-wiper" element={<BackupCameraWiper />} />
        <Route path="/solutions/convenience/modular-car-container" element={<ModularCarContainer />} />
        <Route path="/solutions/convenience/sunglasses-holder" element={<SunglassesHolder />} />
        <Route path="/solutions/convenience/car-key-holder" element={<CarKeyHolder />} />
        <Route path="/solutions/convenience/ketchup-extruder" element={<KetchupExtruder />} />
        <Route path="/solutions/convenience/moth-trap" element={<MothTrap />} />
        {/* Anything unmatched — mistyped, or a page that has been removed */}
        <Route path="/games" element={<Loads><Games /></Loads>} />
        <Route path="/log" element={<Loads><LogRunner /></Loads>} />
        <Route path="/barrel" element={<Loads><BarrelDrop /></Loads>} />
        <Route path="/snake" element={<Loads><SnakeGame /></Loads>} />

        {/* The same screen with nothing behind it, for anyone who finds it. */}
        <Route path="/loading" element={<Loading />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <SiteFooter />
    </BrowserRouter>
  )
}