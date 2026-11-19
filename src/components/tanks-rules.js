// src/components/tanks-rules.js
//
// The rules of the tank game (TanksGame.jsx), with nothing drawn: an arena
// of blocks on a grid, tanks that drive and turn their turrets, shells that
// bounce off the walls, mines that go off, and the enemy tanks' minds.
// Separate from the page, as the snake's rules are, so it can be run
// without a screen.
//
// The arena is COLS by ROWS squares, and everything is measured in squares.
// A square is open floor, a wall (glass: stops tanks and turns shells back),
// a soft block (stops both, and a mine's blast clears it), or a hole (stops
// tanks; shells fly over it).

export const COLS = 22
export const ROWS = 16
export const TANK_R = 0.36            // a tank, for running into things
export const SHELL_R = 0.09
export const EMPTY = 0, WALL = 1, SOFT = 2, HOLE = 3

const MINE_ARM = 1.0                  // seconds before a mine can go off
const MINE_FUSE = 10                  // and when it goes off by itself
const MINE_TRIGGER = 0.8              // how near a tank sets it off
export const BLAST_R = 1.7
const LAST_MARK = 0.2                 // squares between tread marks

// The tanks, after the ones in Wii Play's tank game: yours fires up to
// five slow shells that bounce once and lays up to two mines; one hit ends
// any tank; and the enemies, from a turret that never moves to a quick
// hunter that bank-shoots and dodges, each have one way of being dangerous
// (a fast shell that does not bounce, shots that bounce twice, mines left
// everywhere). Yours, and six kinds of enemy, each a colour of the site's
// own (resolved when drawn): how fast it drives, its shells (how fast, how
// many bounces, how many out at once, how soon again), how quickly its
// turret comes round, how it aims, how well it gets out of the way, and
// whether it lays mines.
export const TYPES = {
  // (yours reload as in Wii Play: as many shots as you have shells off the
// screen, out of five; the cooldown only keeps one click from firing two)
  player: { hue: 'var(--hue-1)', speed: 2.5, shellSpeed: 6, bounces: 1, maxShells: 5, cooldown: 0.06, mines: 2 },
  a: { name: 'Sentry', hue: 'var(--hue-6)', speed: 0, shellSpeed: 3.6, bounces: 1, maxShells: 1, cooldown: 2.6, turn: 1.1, aim: 'direct', jitter: 0.1, dodge: 0 },
  b: { name: 'Rover', hue: 'var(--hue-3)', speed: 1.0, shellSpeed: 4.4, bounces: 1, maxShells: 1, cooldown: 1.9, turn: 1.6, aim: 'direct', jitter: 0.08, dodge: 0.3, wander: 4 },
  c: { name: 'Banker', hue: 'var(--hue-5)', speed: 0.6, shellSpeed: 5, bounces: 2, maxShells: 2, cooldown: 1.8, turn: 1.8, aim: 'bank', jitter: 0.03, dodge: 0.4, wander: 3 },
  d: { name: 'Dart', hue: 'var(--hue-2)', speed: 1.5, shellSpeed: 9, bounces: 0, maxShells: 1, cooldown: 1.7, turn: 2.4, aim: 'lead', jitter: 0.02, dodge: 0.6, wander: 5 },
  e: { name: 'Sapper', hue: 'var(--hue-4)', speed: 2.0, shellSpeed: 4.8, bounces: 1, maxShells: 1, cooldown: 2.2, turn: 2, aim: 'direct', jitter: 0.06, dodge: 0.5, wander: 6, mines: 3 },
  f: { name: 'Hunter', hue: '#e0484f', speed: 2.3, shellSpeed: 6.4, bounces: 1, maxShells: 2, cooldown: 0.7, turn: 3.4, aim: 'bank', jitter: 0.04, dodge: 0.85, chase: true },
}

// The rounds. '#' a wall, '+' a soft block, 'o' a hole, 'P' you, and a
// letter one of the enemies above. After the last of these, the rounds are
// made up as they come (makeLayout).
export const LEVELS = [
  [
    '......................',
    '......................',
    '......................',
    '......................',
    '..........##..........',
    '..........##..........',
    '......................',
    '..P................a..',
    '......................',
    '......................',
    '..........##..........',
    '..........##..........',
    '......................',
    '......................',
    '......................',
    '......................',
  ],
  [
    '......................',
    '......................',
    '....######............',
    '......................',
    '...............+++....',
    '...............+.b....',
    '...............+......',
    '..P...................',
    '......................',
    '......................',
    '......+...............',
    '......+.......a.......',
    '......+...............',
    '............######....',
    '......................',
    '......................',
  ],
  [
    '......................',
    '...............b......',
    '......................',
    '....###........###....',
    '......#........#......',
    '......#...oo...#......',
    '..........oo..........',
    '..P...................',
    '..........oo.......a..',
    '......#...oo...#......',
    '......#........#......',
    '....###........###....',
    '......................',
    '...............b......',
    '......................',
    '......................',
  ],
  [
    '......................',
    '..........#...........',
    '..........#.....c.....',
    '..........#...........',
    '....+++...#...####....',
    '..........#...........',
    '......................',
    '..P.......++......b...',
    '......................',
    '..........#...........',
    '....####..#...+++.....',
    '..........#...........',
    '..........#.....b.....',
    '..........#...........',
    '......................',
    '......................',
  ],
  [
    '......................',
    '......................',
    '...ooo..........ooo...',
    '......................',
    '.......#......#.......',
    '.......#..d...#.......',
    '.......#......#.......',
    '..P....+......+....b..',
    '.......#......#.......',
    '.......#..d...#.......',
    '.......#......#.......',
    '......................',
    '...ooo..........ooo...',
    '......................',
    '......................',
    '......................',
  ],
  [
    '......................',
    '.....+.........+......',
    '.....+...e.....+......',
    '.....+.........+......',
    '.....####...####......',
    '......................',
    '...........c..........',
    '..P...................',
    '......................',
    '.....####...####......',
    '.....+.........+......',
    '.....+...b.....+......',
    '.....+.........+......',
    '......................',
    '......................',
    '......................',
  ],
  [
    '......................',
    '...................a..',
    '.......####...........',
    '.......#..............',
    '.......#.....oooo.....',
    '.................#....',
    '.............c...#....',
    '..P..............#..d.',
    '.................#....',
    '.......#..............',
    '.......#.....oooo.....',
    '.......####...........',
    '...................a..',
    '......................',
    '......................',
    '......................',
  ],
  [
    '......................',
    '......................',
    '...+++++....+++++.....',
    '...+...........e+.....',
    '...+.....###....+.....',
    '.........#.#.....d....',
    '.........#.#..........',
    '..P......#.#.......b..',
    '.........#.#..........',
    '.........#.#.....e....',
    '...+.....###....+.....',
    '...+............+.....',
    '...+++++....+++++.....',
    '......................',
    '......................',
    '......................',
  ],
  [
    '......................',
    '......................',
    '....#....#....#.......',
    '....#....#....#...f...',
    '....#....#....#.......',
    '......................',
    '..........oo..........',
    '..P.......oo......c...',
    '..........oo..........',
    '......................',
    '....#....#....#.......',
    '....#....#....#...d...',
    '....#....#....#.......',
    '......................',
    '......................',
    '......................',
  ],
  [
    '......................',
    '......................',
    '...##..........##.....',
    '...#....++++....#.f...',
    '........+..+..........',
    '....oo..+..+..oo......',
    '..............e.......',
    '..P...................',
    '..............c.......',
    '....oo..+..+..oo......',
    '........+..+..........',
    '...#....++++....#.f...',
    '...##..........##.....',
    '......................',
    '......................',
    '......................',
  ],
]

// --- the arena ---------------------------------------------------------

export function parse(rows) {
  const grid = []
  const spawns = []
  rows.forEach((row, y) => {
    grid.push([...row].map((ch, x) => {
      if (ch === '#') return WALL
      if (ch === '+') return SOFT
      if (ch === 'o') return HOLE
      if (ch === 'P' || TYPES[ch]) spawns.push({ type: ch === 'P' ? 'player' : ch, x: x + 0.5, y: y + 0.5 })
      return EMPTY
    }))
  })
  return { grid, spawns }
}

export const cellAt = (grid, x, y) => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? WALL : grid[y][x])
const stopsShell = (grid, cx, cy) => { const c = cellAt(grid, cx, cy); return c === WALL || c === SOFT }
const stopsTank = (grid, cx, cy) => cellAt(grid, cx, cy) !== EMPTY

const rand = (a, b) => a + Math.random() * (b - a)
const randn = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a))

// The rounds after the last made by hand: blocks scattered evenly either
// side of the middle, you on the left and the enemies on the right, every
// one of them reachable
export function makeLayout(round) {
  const enemies = Math.min(6, 2 + Math.floor(round / 3))
  const pool = ['b', 'c', 'd', 'e', 'f', 'a', 'c', 'd', 'e', 'f']
  for (let tries = 0; tries < 80; tries += 1) {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill('.'))
    const put = (x, y, ch) => {
      if (x < 0 || y < 0 || x >= COLS / 2 || y >= ROWS) return
      g[y][x] = ch; g[y][COLS - 1 - x] = ch
    }
    const pieces = 4 + Math.floor(Math.random() * 4)
    for (let k = 0; k < pieces; k += 1) {
      const x = 4 + Math.floor(Math.random() * 7), y = 1 + Math.floor(Math.random() * (ROWS - 2))
      const ch = Math.random() < 0.25 ? '+' : Math.random() < 0.15 ? 'o' : '#'
      const kind = Math.floor(Math.random() * 4)
      if (kind === 0) for (let i = 0; i < 2 + Math.floor(Math.random() * 4); i += 1) put(x + i, y, ch)
      else if (kind === 1) for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i += 1) put(x, y + i, ch)
      else if (kind === 2) { for (let i = 0; i < 3; i += 1) { put(x + i, y, ch); put(x, y + i, ch) } }
      else { put(x, y, ch); put(x + 1, y, ch); put(x, y + 1, ch); put(x + 1, y + 1, ch) }
    }
    const free = (x, y) => g[y][x] === '.'
    const py = 3 + Math.floor(Math.random() * (ROWS - 6))
    if (!free(2, py)) continue
    g[py][2] = 'P'
    const spots = []
    for (let k = 0; k < 200 && spots.length < enemies; k += 1) {
      const x = 13 + Math.floor(Math.random() * 7), y = 1 + Math.floor(Math.random() * (ROWS - 2))
      if (free(x, y) && spots.every(([sx, sy]) => Math.abs(sx - x) + Math.abs(sy - y) > 2)) spots.push([x, y])
    }
    if (spots.length < enemies) continue
    const reach = Math.min(pool.length, 3 + Math.floor(round / 2))
    spots.forEach(([x, y]) => { g[y][x] = pool[Math.floor(Math.random() * reach)] })
    const rows = g.map((r) => r.join(''))
    const { grid, spawns } = parse(rows)
    const from = bfs(grid, 2, py)
    if (spawns.every((s) => from.dist[Math.floor(s.y)][Math.floor(s.x)] >= 0)) return rows
  }
  return LEVELS[LEVELS.length - 1]
}

export const layoutFor = (round) => (round <= LEVELS.length ? LEVELS[round - 1] : makeLayout(round))

// Distances over the open floor from a square, four ways
function bfs(grid, sx, sy) {
  const dist = Array.from({ length: ROWS }, () => Array(COLS).fill(-1))
  const prev = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  const q = [[sx, sy]]
  dist[sy][sx] = 0
  for (let i = 0; i < q.length; i += 1) {
    const [x, y] = q[i]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (stopsTank(grid, nx, ny) || dist[ny][nx] >= 0) continue
      dist[ny][nx] = dist[y][x] + 1
      prev[ny][nx] = [x, y]
      q.push([nx, ny])
    }
  }
  return { dist, prev }
}

// --- a round -------------------------------------------------------------

// The round's arena and tanks; `down` the enemies already beaten in it (by
// where they started), who stay beaten when you are hit and it starts again
export function newRound(rows, down = new Set()) {
  const { grid, spawns } = parse(rows)
  let id = 1
  const tanks = []
  spawns.forEach((s, si) => {
    if (s.type !== 'player' && down.has(si)) return
    const player = s.type === 'player'
    const face = player ? 0 : Math.PI
    tanks.push({
      id: id++, si, type: s.type, kind: TYPES[s.type], player,
      x: s.x, y: s.y, vx: 0, vy: 0, body: face, turret: face, alive: true,
      cool: player ? 0 : rand(1, 2.2), travel: 0, mark: 0,
      ai: { goal: null, path: [], think: rand(0, 1), aim: 0, want: face, mineT: rand(3, 6), seen: new Map(), stuck: 0, was: { x: s.x, y: s.y } },
    })
  })
  return { grid, tanks, shells: [], mines: [], blasts: [], marks: [], scorch: [], bits: [], smoke: [], t: 0, next: 1, down }
}

const shellsOf = (w, t) => w.shells.filter((s) => s.owner === t.id).length
const minesOf = (w, t) => w.mines.filter((m) => m.owner === t.id).length

function fire(w, t, angle, events) {
  const c = Math.cos(angle), s = Math.sin(angle)
  const x = t.x + c * 0.5, y = t.y + s * 0.5
  t.cool = t.kind.cooldown
  events.push({ type: 'fire', tank: t })
  // (the barrel's end inside a wall: the shell bursts there)
  if (stopsShell(w.grid, Math.floor(x), Math.floor(y))) { puff(w, t.x + c * 0.4, t.y + s * 0.4, 6); return }
  w.shells.push({ id: w.next++, x, y, vx: c * t.kind.shellSpeed, vy: s * t.kind.shellSpeed, left: t.kind.bounces, owner: t.id, hue: t.kind.hue, age: 0, fast: t.kind.shellSpeed > 7 })
}

function layMine(w, t, events) {
  w.mines.push({ id: w.next++, x: t.x, y: t.y, owner: t.id, age: 0, hue: t.kind.hue })
  events.push({ type: 'mine', tank: t })
}

function puff(w, x, y, n, hot = false) {
  for (let i = 0; i < n; i += 1) {
    const a = Math.random() * Math.PI * 2, v = rand(0.4, hot ? 3.2 : 1.4)
    w.bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, hot ? 0.9 : 0.5), age: 0, hot })
  }
}

function kill(w, t, events) {
  if (!t.alive) return
  t.alive = false
  t.vx = 0; t.vy = 0
  w.blasts.push({ x: t.x, y: t.y, age: 0, r: 1.1 })
  w.scorch.push({ x: t.x, y: t.y, r: 0.55, hue: t.kind.hue })
  puff(w, t.x, t.y, 26, true)
  if (!t.player) w.down.add(t.si)
  events.push({ type: 'kill', tank: t })
}

function explode(w, m, events) {
  if (m.gone) return
  m.gone = true
  w.blasts.push({ x: m.x, y: m.y, age: 0, r: BLAST_R })
  puff(w, m.x, m.y, 34, true)
  events.push({ type: 'boom' })
  for (const t of w.tanks) if (t.alive && Math.hypot(t.x - m.x, t.y - m.y) < BLAST_R + TANK_R * 0.4) kill(w, t, events)
  for (const s of w.shells) if (Math.hypot(s.x - m.x, s.y - m.y) < BLAST_R) s.dead = true
  for (let y = Math.floor(m.y - BLAST_R); y <= Math.floor(m.y + BLAST_R); y += 1) {
    for (let x = Math.floor(m.x - BLAST_R); x <= Math.floor(m.x + BLAST_R); x += 1) {
      if (cellAt(w.grid, x, y) === SOFT && Math.hypot(x + 0.5 - m.x, y + 0.5 - m.y) < BLAST_R + 0.3) {
        w.grid[y][x] = EMPTY
        puff(w, x + 0.5, y + 0.5, 8)
      }
    }
  }
  for (const o of w.mines) if (!o.gone && Math.hypot(o.x - m.x, o.y - m.y) < BLAST_R) explode(w, o, events)
}

// A shell's next stretch: on through open floor, or off a wall (which wall
// is told by which square it came from)
function shellStep(grid, s, h) {
  const nx = s.x + s.vx * h, ny = s.y + s.vy * h
  const cx0 = Math.floor(s.x), cy0 = Math.floor(s.y), cx1 = Math.floor(nx), cy1 = Math.floor(ny)
  if (!stopsShell(grid, cx1, cy1)) { s.x = nx; s.y = ny; return false }
  let hx = cx1 !== cx0 && stopsShell(grid, cx1, cy0)
  let hy = cy1 !== cy0 && stopsShell(grid, cx0, cy1)
  if (!hx && !hy) { hx = cx1 !== cx0; hy = cy1 !== cy0 }
  if (hx) s.vx = -s.vx
  if (hy) s.vy = -s.vy
  return true
}

// Where a shell fired from a tank at an angle would go, and the first tank
// it would meet (with how far it went to get there)
export function traceShot(w, t, angle, bounces = t.kind.bounces, upTo = 46) {
  const c = Math.cos(angle), s = Math.sin(angle)
  const p = { x: t.x + c * 0.5, y: t.y + s * 0.5, vx: c, vy: s }
  const path = [{ x: p.x, y: p.y }]
  if (stopsShell(w.grid, Math.floor(p.x), Math.floor(p.y))) return { tank: null, len: 0, path }
  let left = bounces, len = 0
  const h = 0.1
  while (len < upTo) {
    if (shellStep(w.grid, p, h)) {
      path.push({ x: p.x, y: p.y })
      if (left <= 0) return { tank: null, len, path }
      left -= 1
      len += h
      continue
    }
    len += h
    for (const u of w.tanks) {
      if (!u.alive || (u === t && len < 0.9)) continue
      if (Math.hypot(u.x - p.x, u.y - p.y) < TANK_R + SHELL_R) { path.push({ x: p.x, y: p.y }); return { tank: u, len, path } }
    }
  }
  path.push({ x: p.x, y: p.y })
  return { tank: null, len, path }
}

// --- the enemies' minds --------------------------------------------------

function chooseAim(w, t, P) {
  const k = t.kind
  if (!P || !P.alive) return t.turret + 0.8
  const direct = Math.atan2(P.y - t.y, P.x - t.x)
  if (k.aim === 'lead') {
    const time = Math.hypot(P.x - t.x, P.y - t.y) / k.shellSpeed
    return Math.atan2(P.y + P.vy * time * 0.85 - t.y, P.x + P.vx * time * 0.85 - t.x)
  }
  if (k.aim === 'bank') {
    if (traceShot(w, t, direct, 0).tank === P) return direct
    let best = null
    for (let i = 0; i < 90; i += 1) {
      const a = (i / 90) * Math.PI * 2
      const r = traceShot(w, t, a)
      if (r.tank === P && (!best || r.len < best.len)) best = { a, len: r.len }
    }
    if (best) return best.a
  }
  return direct
}

// What is coming at a tank: shells about to pass close, and mines near it.
// Each shell is weighed once, as it is first seen: whether this tank notices
// it is down to how good it is at getting out of the way.
function danger(w, t) {
  let ax = 0, ay = 0
  for (const s of w.shells) {
    if (s.owner === t.id && s.age < 0.4) continue
    const px = t.x - s.x, py = t.y - s.y
    const vv = s.vx * s.vx + s.vy * s.vy
    const tc = (px * s.vx + py * s.vy) / vv
    if (tc < 0 || tc > 0.9) continue
    const cx = s.x + s.vx * tc, cy = s.y + s.vy * tc
    const d = Math.hypot(t.x - cx, t.y - cy)
    if (d > 0.85) continue
    if (!t.ai.seen.has(s.id)) t.ai.seen.set(s.id, Math.random() < t.kind.dodge)
    if (!t.ai.seen.get(s.id)) continue
    if (d < 0.02) { ax += -s.vy; ay += s.vx } else { ax += (t.x - cx) / d; ay += (t.y - cy) / d }
  }
  for (const m of w.mines) {
    const d = Math.hypot(t.x - m.x, t.y - m.y)
    if (d < BLAST_R + 0.4 && d > 0.001) { ax += ((t.x - m.x) / d) * 1.2; ay += ((t.y - m.y) / d) * 1.2 }
  }
  const len = Math.hypot(ax, ay)
  return len > 0.01 ? { x: ax / len, y: ay / len } : null
}

function pickGoal(w, t, P) {
  const k = t.kind, cx = Math.floor(t.x), cy = Math.floor(t.y)
  const { dist, prev } = bfs(w.grid, cx, cy)
  const ok = []
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (dist[y][x] <= 0) continue
      if (w.mines.some((m) => Math.hypot(m.x - x - 0.5, m.y - y - 0.5) < BLAST_R + 0.6)) continue
      if (k.chase && P?.alive) {
        const d = Math.hypot(P.x - x - 0.5, P.y - y - 0.5)
        if (d < 2.5 || d > 5.5) continue
      } else if (dist[y][x] > (k.wander || 4)) continue
      ok.push([x, y])
    }
  }
  t.ai.path = []
  if (!ok.length) return
  let [x, y] = ok[Math.floor(Math.random() * ok.length)]
  const path = []
  while (x !== cx || y !== cy) { path.unshift({ x: x + 0.5, y: y + 0.5 }); [x, y] = prev[y][x] }
  t.ai.path = path
}

function think(w, t, P, dt, events) {
  const k = t.kind, ai = t.ai
  // the turret: round to where it means to shoot
  ai.aim -= dt
  if (ai.aim <= 0) { ai.aim = k.aim === 'bank' ? 0.3 : 0.12; ai.want = chooseAim(w, t, P) }
  const turn = wrap(ai.want - t.turret)
  t.turret += Math.sign(turn) * Math.min(Math.abs(turn), k.turn * dt)
  // and fires when its shot would find you, and not one of its own
  if (P?.alive && t.cool <= 0 && shellsOf(w, t) < k.maxShells) {
    const hit = traceShot(w, t, t.turret).tank
    if (hit === P) fire(w, t, t.turret + randn() * k.jitter, events)
    else t.cool = 0.1
  }
  // a sapper leaves a mine behind now and then, away from you, and goes
  if (k.mines) {
    ai.mineT -= dt
    if (ai.mineT <= 0) {
      ai.mineT = rand(1.8, 4.5)
      if (minesOf(w, t) < k.mines && (!P || Math.hypot(P.x - t.x, P.y - t.y) > 2.5)) { layMine(w, t, events); ai.path = [] }
    }
  }
  if (!k.speed) { t.vx = 0; t.vy = 0; return }
  const away = danger(w, t)
  if (away) { t.vx = away.x * k.speed * 1.15; t.vy = away.y * k.speed * 1.15; ai.path = []; return }
  // somewhere to go, and the way there
  ai.think -= dt
  ai.stuck += dt
  if (ai.stuck > 1) {
    if (Math.hypot(t.x - ai.was.x, t.y - ai.was.y) < 0.1) ai.path = []
    ai.stuck = 0; ai.was = { x: t.x, y: t.y }
  }
  if (!ai.path.length || ai.think <= 0) { ai.think = rand(2, 5); pickGoal(w, t, P) }
  const to = ai.path[0]
  if (!to) { t.vx = 0; t.vy = 0; return }
  const dx = to.x - t.x, dy = to.y - t.y, d = Math.hypot(dx, dy)
  if (d < 0.18) { ai.path.shift(); return }
  t.vx = (dx / d) * k.speed; t.vy = (dy / d) * k.speed
}

// --- a step of the game ----------------------------------------------------

function pushOut(w, t) {
  for (let pass = 0; pass < 2; pass += 1) {
    for (let cy = Math.floor(t.y - TANK_R); cy <= Math.floor(t.y + TANK_R); cy += 1) {
      for (let cx = Math.floor(t.x - TANK_R); cx <= Math.floor(t.x + TANK_R); cx += 1) {
        if (!stopsTank(w.grid, cx, cy)) continue
        const nx = Math.max(cx, Math.min(cx + 1, t.x)), ny = Math.max(cy, Math.min(cy + 1, t.y))
        const dx = t.x - nx, dy = t.y - ny, d = Math.hypot(dx, dy)
        if (d >= TANK_R) continue
        if (d < 1e-6) { t.x = cx + 0.5 + Math.sign(t.x - cx - 0.5 || 1) * (0.5 + TANK_R); continue }
        t.x += (dx / d) * (TANK_R - d); t.y += (dy / d) * (TANK_R - d)
      }
    }
  }
}

// input: { move: {x, y}, aim: {x, y} | null, fire, mine } for your tank
export function step(w, dt, input) {
  const events = []
  w.t += dt
  const P = w.tanks.find((t) => t.player)
  for (const t of w.tanks) if (t.alive) t.cool -= dt
  if (P?.alive) {
    const m = input.move, len = Math.hypot(m.x, m.y)
    const sp = P.kind.speed * Math.min(1, len)
    P.vx = len > 0.05 ? (m.x / len) * sp : 0
    P.vy = len > 0.05 ? (m.y / len) * sp : 0
    if (input.aim) P.turret = Math.atan2(input.aim.y - P.y, input.aim.x - P.x)
    if (input.fire && P.cool <= 0 && shellsOf(w, P) < P.kind.maxShells) fire(w, P, P.turret, events)
    if (input.mine && minesOf(w, P) < P.kind.mines) layMine(w, P, events)
  }
  for (const t of w.tanks) if (t.alive && !t.player) think(w, t, P, dt, events)

  // the tanks drive, the body turning to the way it goes (either end
  // first: a tank backs up as readily as it goes forward)
  for (const t of w.tanks) {
    if (!t.alive) continue
    const x0 = t.x, y0 = t.y
    t.x += t.vx * dt; t.y += t.vy * dt
    pushOut(w, t)
    const moved = Math.hypot(t.x - x0, t.y - y0)
    if (moved > 0.0005) {
      let want = Math.atan2(t.vy, t.vx)
      if (Math.abs(wrap(want - t.body)) > Math.PI / 2) want += Math.PI
      const turn = wrap(want - t.body)
      t.body += Math.sign(turn) * Math.min(Math.abs(turn), 9 * dt)
      t.travel += moved
      if (t.travel - t.mark > LAST_MARK) {
        t.mark = t.travel
        w.marks.push({ x: t.x, y: t.y, a: t.body, t: w.t })
        if (w.marks.length > 900) w.marks.shift()
      }
    }
  }
  // tanks do not drive through each other
  for (let i = 0; i < w.tanks.length; i += 1) {
    const a = w.tanks[i]
    if (!a.alive) continue
    for (let j = i + 1; j < w.tanks.length; j += 1) {
      const b = w.tanks[j]
      if (!b.alive) continue
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
      if (d >= TANK_R * 2 || d < 1e-6) continue
      const push = (TANK_R * 2 - d) / 2
      a.x -= (dx / d) * push; a.y -= (dy / d) * push
      b.x += (dx / d) * push; b.y += (dy / d) * push
      pushOut(w, a); pushOut(w, b)
    }
  }

  // the shells, in short steps so none passes through a wall or a tank
  for (const s of w.shells) {
    if (s.dead) continue
    s.age += dt
    const speed = Math.hypot(s.vx, s.vy)
    const n = Math.max(1, Math.ceil((speed * dt) / 0.05)), h = dt / n
    for (let k = 0; k < n && !s.dead; k += 1) {
      if (shellStep(w.grid, s, h)) {
        if (s.left <= 0) { s.dead = true; puff(w, s.x, s.y, 5); break }
        s.left -= 1
        events.push({ type: 'bounce' })
      }
      for (const t of w.tanks) {
        if (!t.alive || (t.id === s.owner && s.age < 0.12)) continue
        if (Math.hypot(t.x - s.x, t.y - s.y) < TANK_R + SHELL_R) { s.dead = true; kill(w, t, events); break }
      }
      for (const m of w.mines) {
        if (!m.gone && !s.dead && Math.hypot(m.x - s.x, m.y - s.y) < 0.3) { s.dead = true; explode(w, m, events) }
      }
    }
    if (!s.dead && Math.random() < 0.7) w.smoke.push({ x: s.x, y: s.y, age: 0 })
  }
  // shells meeting shells
  for (let i = 0; i < w.shells.length; i += 1) {
    const a = w.shells[i]
    if (a.dead) continue
    for (let j = i + 1; j < w.shells.length; j += 1) {
      const b = w.shells[j]
      if (b.dead) continue
      if (Math.hypot(a.x - b.x, a.y - b.y) < SHELL_R * 2.4) { a.dead = true; b.dead = true; puff(w, (a.x + b.x) / 2, (a.y + b.y) / 2, 8); events.push({ type: 'clink' }) }
    }
  }
  w.shells = w.shells.filter((s) => !s.dead)

  // the mines: set off by time, or by a tank coming near (the one that
  // laid it only once it has had time to get away)
  for (const m of w.mines) {
    if (m.gone) continue
    m.age += dt
    if (m.age > MINE_FUSE) { explode(w, m, events); continue }
    if (m.age < MINE_ARM) continue
    for (const t of w.tanks) {
      if (!t.alive || (t.id === m.owner && m.age < 3)) continue
      if (Math.hypot(t.x - m.x, t.y - m.y) < MINE_TRIGGER) { explode(w, m, events); break }
    }
  }
  w.mines = w.mines.filter((m) => !m.gone)

  // what is left in the air
  for (const b of w.blasts) b.age += dt
  w.blasts = w.blasts.filter((b) => b.age < 0.6)
  for (const b of w.bits) { b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= 0.94; b.vy *= 0.94 }
  w.bits = w.bits.filter((b) => b.age < b.life)
  for (const p of w.smoke) p.age += dt
  w.smoke = w.smoke.filter((p) => p.age < 0.45)
  return events
}

export const enemiesLeft = (w) => w.tanks.filter((t) => !t.player && t.alive).length
export const playerOf = (w) => w.tanks.find((t) => t.player)
export const mineFuse = MINE_FUSE
