// src/components/model-scene.js
//
// The 3D part of the model viewer: a scene, a light, a camera that fits
// whatever it is handed, and a drag that turns it. Everything that touches
// three.js lives here, and the component that owns the canvas only imports
// this once the section is close to the screen — so three is a chunk of its
// own that nobody downloads for a page they never reach the foot of.
import {
  ACESFilmicToneMapping, AmbientLight, Box3, DirectionalLight, Group,
  HemisphereLight, PerspectiveCamera, PMREMGenerator, Scene, Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import asset from '../lib-asset'

// The camera looks slightly down at the model, from far enough that it fills
// most of the height, and the drag cannot go under the floor or over the top.
const LOOK_DOWN = 0.32          // radians below level
const FILL = 1.0                // the model's box just fits; the model sits inside it
const IDLE_TURN = 0.6           // degrees per frame, until someone takes hold

export async function mount(canvas, url, { still = false, turn = [0, 0, 0] } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)          // the page shows through
  renderer.toneMapping = ACESFilmicToneMapping

  const scene = new Scene()
  // A room to reflect: the steel of the Mortar reads as steel only with
  // something to mirror, and a generated room costs no file.
  const rooms = new PMREMGenerator(renderer)
  scene.environment = rooms.fromScene(new RoomEnvironment(), 0.04).texture
  rooms.dispose()

  scene.add(new HemisphereLight(0xffffff, 0x8899aa, 0.5))
  const key = new DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 5, 4)
  scene.add(key)
  scene.add(new AmbientLight(0xffffff, 0.15))

  const camera = new PerspectiveCamera(32, 1, 0.01, 100)
  const controls = new OrbitControls(camera, canvas)
  controls.enablePan = false
  controls.enableZoom = false
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = Math.PI / 2 + 0.15
  controls.autoRotate = !still
  controls.autoRotateSpeed = IDLE_TURN
  // The first touch is the end of the demonstration: from then on it turns
  // only when turned.
  const takeHold = () => { controls.autoRotate = false }
  controls.addEventListener('start', takeHold)

  const draco = new DRACOLoader()
  draco.setDecoderPath(asset('/draco/'))
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)
  const { scene: model } = await loader.loadAsync(url)

  // Stood up first, if the export lay down; then centred on its own middle
  // and framed by its size, so a file exported at any scale, in any place,
  // arrives the same size in the same spot.
  const holder = new Group()
  holder.add(model)
  const [tx, ty, tz] = turn.map((deg) => (deg * Math.PI) / 180)
  model.rotation.set(tx, ty, tz)
  const bounds = new Box3().setFromObject(holder)
  const centre = bounds.getCenter(new Vector3())
  holder.position.sub(centre)
  scene.add(holder)

  // Far enough back that every corner of the model's box is in view, up and
  // down and side to side, with a little room round it — measured from the
  // direction the camera looks from, so a wide base seen from above counts
  // for as much as a tall body seen from the side.
  const corners = []
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) {
    for (const z of [bounds.min.z, bounds.max.z]) corners.push(new Vector3(x, y, z).sub(centre))
  }
  const towards = new Vector3(
    Math.sin(0.6) * Math.cos(LOOK_DOWN), Math.sin(LOOK_DOWN), Math.cos(0.6) * Math.cos(LOOK_DOWN),
  )
  const fit = () => {
    const half = Math.tan((camera.fov * Math.PI) / 360)
    const forward = camera.position.clone().normalize()
    const right = new Vector3().crossVectors(new Vector3(0, 1, 0), forward).normalize()
    const up = new Vector3().crossVectors(forward, right)
    let needed = 0
    for (const c of corners) {
      const depth = c.dot(forward)
      needed = Math.max(needed,
        depth + Math.abs(c.dot(up)) / half / FILL,
        depth + Math.abs(c.dot(right)) / (half * camera.aspect) / FILL)
    }
    camera.position.setLength(needed)
    camera.near = needed / 50
    camera.far = needed * 50
    camera.updateProjectionMatrix()
  }
  camera.position.copy(towards)
  controls.target.set(0, 0, 0)

  let alive = true
  const size = () => {
    const { clientWidth: w, clientHeight: h } = canvas
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    fit()
    controls.update()
  }
  size()
  const watch = new ResizeObserver(size)
  watch.observe(canvas)

  const frame = () => {
    if (!alive) return
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(frame)
  }
  frame()

  return () => {
    alive = false
    watch.disconnect()
    controls.removeEventListener('start', takeHold)
    controls.dispose()
    draco.dispose()
    model.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) [].concat(o.material).forEach((m) => m.dispose())
    })
    scene.environment?.dispose()
    renderer.dispose()
  }
}
