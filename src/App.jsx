// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Projects from './pages/Projects'
import ClashRoyale from './pages/projects/ClashRoyale'
import SkeletonBarrel from './pages/projects/SkeletonBarrel'
import ElixirCollector from './pages/projects/ElixirCollector'
import CannonCart from './pages/projects/CannonCart'
import Mortar from './pages/projects/Mortar'
// the-log: held back for now, see src/data/projects.js
// import TheLog from './pages/projects/TheLog'
import Misc from './pages/projects/Misc'
import HalloweenHelmets from './pages/projects/misc/HalloweenHelmets'
import RCCarRepair from './pages/projects/misc/RCCarRepair'
import Solutions from './pages/Solutions'
import Accessibility from './pages/solutions/Accessibility'
import WheelchairStorage from './pages/solutions/accessibility/WheelchairStorage'
import SmartKinesiologyTape from './pages/solutions/accessibility/SmartKinesiologyTape'
import Convenience from './pages/solutions/Convenience'
import BackupCameraWiper from './pages/solutions/convenience/BackupCameraWiper'
import ModularCarContainer from './pages/solutions/convenience/ModularCarContainer'
import SunglassesHolder from './pages/solutions/convenience/SunglassesHolder'
import CarKeyHolder from './pages/solutions/convenience/CarKeyHolder'
import KetchupExtruder from './pages/solutions/convenience/KetchupExtruder'
import NotFound from './pages/NotFound'
// Not in the navbar: easter eggs for anyone who finds them.
import Games from './pages/Games'
import LogRunner from './components/LogRunner'
import BarrelDrop from './components/BarrelDrop'
import SnakeGame from './components/SnakeGame'
import Navbar from './components/Navbar'
import ScrollToTop from './components/ScrollToTop'
import ThemeToggle from './components/ThemeToggle'

export default function App() {
  // Under a subfolder, /solutions is really /Portfolio/solutions. Vite puts the
  // subfolder in BASE_URL at build time and the router takes it from there; at a
  // domain root it is '/' and nothing changes.
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Navbar />
      <ScrollToTop />
      <ThemeToggle />
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
        <Route path="/projects/misc" element={<Misc />} />
        <Route path="/projects/misc/halloween-helmets" element={<HalloweenHelmets />} />
        <Route path="/projects/misc/rc-car-repair" element={<RCCarRepair />} />
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
        {/* Anything unmatched — mistyped, or a page that has been removed */}
        <Route path="/games" element={<Games />} />
        <Route path="/log" element={<LogRunner />} />
        <Route path="/barrel" element={<BarrelDrop />} />
        <Route path="/snake" element={<SnakeGame />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}