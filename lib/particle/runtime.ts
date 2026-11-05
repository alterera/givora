// Single-asset port of the Particleify "image transition" runtime
// (reference/particleify-image-transition-click-swirl.html). No transitions or click driver:
// the product is shown as a still cloud with the configured motion, effect and hover.
import * as THREE from 'three'
import {
  IMAGE_TRANSITION_VERTEX,
  IMAGE_TRANSITION_FRAGMENT,
  IMAGE_TRANSITION_EFFECT_MODES,
  IMAGE_TRANSITION_HOVER_MODES,
} from './shaders'

export type ViewerConfig = {
  particleCount: number
  particleSize: number
  objectScale: number
  motion: 'sway' | 'spin' | 'none'
  effect: string
  effectStrength: number
  effectSpeed: number
  hoverEffect: string
  hoverRadius: number
  hoverStrength: number
  hoverReturn: number
  colorMode: 'original' | 'custom'
  customColor: string
  backgroundColor: string
  glow: number
}

export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  particleCount: 80000,
  particleSize: 75,
  objectScale: 0.8,
  motion: 'spin',
  effect: 'default',
  effectStrength: 0.55,
  effectSpeed: 1,
  hoverEffect: 'light-brush',
  hoverRadius: 0.22,
  hoverStrength: 0.65,
  hoverReturn: 0.35,
  colorMode: 'original',
  customColor: '#ff0040',
  backgroundColor: '#000000',
  glow: 0,
}

export type ViewerOptions = {
  assetUrl: string
  assetType: 'image' | 'cloud'
  palette: string[]
  config?: Partial<ViewerConfig>
  /** Override particle count (e.g. low for grid cards). */
  maxParticles?: number
  /** Drag to orbit, wheel to zoom. Use on detail pages only. */
  interactive?: boolean
  /** Morph from the default spindle into the artwork on load (default true). */
  intro?: boolean
  /** Piece seed: makes particle layout and colour variation unique to this piece. */
  seed?: number
  /** Serial like "GIV-0042"; its number is etched into the cloud as a particle plaque. */
  serial?: string
  /** Owner viewing their own piece: enables the collector-only effect. */
  owner?: boolean
  /** Called with the viewer API (or null on dispose) so the page can offer captures. */
  onReady?: (api: ViewerApi | null) => void
  onError?: (message: string) => void
}

/** The default "spindle" shape from the Particleify default-effect reference. */
function spindleSample(count: number, rand: () => number, accent: string): Sample {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const [ar, ag, ab] = hexRgb(accent)
  for (let i = 0; i < count; i++) {
    const t = (rand() - 0.5) * 5
    const angle = rand() * Math.PI * 2
    const radius = (0.4 + Math.pow(Math.abs(t), 2.4)) * (0.75 + rand() * 0.55)
    positions[i * 3] = radius * Math.cos(angle) * 2.9
    positions[i * 3 + 1] = t * 7.5
    positions[i * 3 + 2] = radius * Math.sin(angle) * 2.9
    const accentPoint = rand() > 0.7
    colors[i * 3] = accentPoint ? ar : 1
    colors[i * 3 + 1] = accentPoint ? ag : 1
    colors[i * 3 + 2] = accentPoint ? ab : 1
  }
  return { positions, colors }
}

export type ViewerApi = {
  /** Render one frame at width x height and return a PNG. */
  capture(width: number, height: number): Promise<Blob>
  /** Record the live canvas for `seconds` and return a webm. */
  recordLoop(seconds?: number): Promise<Blob>
}

type Sample = { positions: Float32Array; colors: Float32Array }

function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function morton(x: number, y: number) {
  const spread = (n: number) => {
    n &= 0x3ff
    n = (n | (n << 8)) & 0x00ff00ff
    n = (n | (n << 4)) & 0x0f0f0f0f
    n = (n | (n << 2)) & 0x33333333
    n = (n | (n << 1)) & 0x55555555
    return n
  }
  return (spread(x) | (spread(y) << 1)) >>> 0
}

function hexRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

/** Our baked cloud: Float32 xyz * N then Uint8 rgb * N (see bake.ts). Colours are stored, not palette-derived. */
/** Stand-in shape for pieces whose artwork has not been uploaded yet: a seeded, softly glowing knot. */
function placeholderCloud(rand: () => number) {
  const count = 24000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const p = 2 + Math.floor(rand() * 3), q = 3 + Math.floor(rand() * 4)
  for (let i = 0; i < count; i++) {
    const t = rand() * Math.PI * 2
    const r = 7 + 3.2 * Math.cos(q * t)
    const jitter = 0.9 + rand() * 1.4, a = rand() * Math.PI * 2
    positions[i * 3] = r * Math.cos(p * t) + Math.cos(a) * jitter
    positions[i * 3 + 1] = r * Math.sin(p * t) + Math.sin(a) * jitter
    positions[i * 3 + 2] = 3.2 * Math.sin(q * t) + (rand() - 0.5) * jitter
    const k = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3))
    colors[i * 3] = 0.1 * k; colors[i * 3 + 1] = k; colors[i * 3 + 2] = 0.62 * k
  }
  return { positions, colors, count }
}

async function loadBakedCloud(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not load the 3D shape.')
  const buffer = await response.arrayBuffer()
  const count = Math.floor(buffer.byteLength / 15)
  const positions = new Float32Array(buffer.slice(0, count * 12))
  const rgb = new Uint8Array(buffer, count * 12, count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < colors.length; i++) colors[i] = rgb[i] / 255
  return { positions, colors, count }
}

function cloudSample(cloud: { positions: Float32Array; colors: Float32Array; count: number }, count: number, rand: () => number): Sample {
  const RES = 200, SPAN = 38, SCALE = 1.15
  const order = new Array<number>(cloud.count)
  const keys = new Array<number>(cloud.count)
  for (let k = 0; k < cloud.count; k++) {
    order[k] = k
    const gx = Math.max(0, Math.min(RES - 1, Math.round(((cloud.positions[k * 3] * SCALE) / SPAN + 0.5) * RES)))
    const gy = Math.max(0, Math.min(RES - 1, Math.round((0.5 - (cloud.positions[k * 3 + 1] * SCALE) / SPAN) * RES)))
    keys[k] = morton(gx, gy)
  }
  order.sort((a, b) => keys[a] - keys[b])
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p = order[Math.min(cloud.count - 1, Math.floor(((i + 0.5) * cloud.count) / count))] * 3
    for (let c = 0; c < 3; c++) {
      positions[i * 3 + c] = cloud.positions[p + c] * SCALE + (rand() - 0.5) * 0.08
      colors[i * 3 + c] = cloud.colors[p + c]
    }
  }
  return { positions, colors }
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The image could not be loaded.'))
    img.src = url
  })
}

function imageSample(img: HTMLImageElement, count: number, rand: () => number): Sample {
  const RES = 200, SPAN = 38, DEPTH = 12
  const canvas = document.createElement('canvas')
  canvas.width = RES; canvas.height = RES
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const nw = img.naturalWidth || img.width || RES
  const nh = img.naturalHeight || img.height || RES
  const aspect = nw / nh
  const dw = aspect > 1 ? RES : RES * aspect
  const dh = aspect > 1 ? RES / aspect : RES
  const ox = (RES - dw) / 2, oy = (RES - dh) / 2
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, RES, RES)
  ctx.drawImage(img, ox, oy, dw, dh)
  let data = ctx.getImageData(0, 0, RES, RES).data
  const points: number[][] = []
  for (let y = 0; y < RES; y++) {
    for (let x = 0; x < RES; x++) {
      const o = (y * RES + x) * 4
      const b = (data[o] + data[o + 1] + data[o + 2]) / 3
      if (b > 15) points.push([x, y, (b / 255 - 0.5) * DEPTH, data[o], data[o + 1], data[o + 2]])
    }
  }
  if (!points.length) {
    ctx.clearRect(0, 0, RES, RES)
    ctx.drawImage(img, ox, oy, dw, dh)
    data = ctx.getImageData(0, 0, RES, RES).data
    for (let y = Math.max(0, Math.floor(oy)); y < Math.min(RES, Math.ceil(oy + dh)); y++) {
      for (let x = Math.max(0, Math.floor(ox)); x < Math.min(RES, Math.ceil(ox + dw)); x++) {
        const o = (y * RES + x) * 4
        if (data[o + 3] <= 8) continue
        const s = Math.max(data[o + 3] / 255, (data[o] + data[o + 1] + data[o + 2]) / 765)
        points.push([x, y, (s - 0.5) * DEPTH, data[o], data[o + 1], data[o + 2]])
      }
    }
  }
  if (!points.length) throw new Error('The image has no visible pixels.')
  points.sort((a, b) => morton(a[0], a[1]) - morton(b[0], b[1]))
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const p = points[Math.min(points.length - 1, Math.floor(((i + 0.5) * points.length) / count))]
    positions[i * 3] = (p[0] / RES - 0.5) * SPAN + (rand() - 0.5) * 0.4
    positions[i * 3 + 1] = (0.5 - p[1] / RES) * SPAN + (rand() - 0.5) * 0.4
    positions[i * 3 + 2] = p[2] + (rand() - 0.5) * 1.5
    colors[i * 3] = p[3] / 255; colors[i * 3 + 1] = p[4] / 255; colors[i * 3 + 2] = p[5] / 255
  }
  return { positions, colors }
}

function luminance(hex: string) {
  const c = new THREE.Color(hex)
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
}

/**
 * Per-piece colour variation derived from the seed: a small hue rotation and saturation shift
 * (hue ±8°, saturation ±6%) so every piece differs while the artist's palette still leads.
 */
function applySeedColour(sample: Sample, seed: number) {
  const rand = random(seed * 7 + 1)
  const angle = ((rand() - 0.5) * 16 * Math.PI) / 180
  const sat = 1 + (rand() - 0.5) * 0.12
  const cos = Math.cos(angle), sin = Math.sin(angle)
  // Hue rotation about the grey axis (standard matrix) followed by a saturation scale.
  const m = [
    0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
    0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.140, 0.072 - cos * 0.072 - sin * 0.283,
    0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072,
  ]
  const c = sample.colors
  for (let i = 0; i < c.length; i += 3) {
    const r = c[i], g = c[i + 1], b = c[i + 2]
    const nr = m[0] * r + m[1] * g + m[2] * b
    const ng = m[3] * r + m[4] * g + m[5] * b
    const nb = m[6] * r + m[7] * g + m[8] * b
    const l = 0.299 * nr + 0.587 * ng + 0.114 * nb
    c[i] = Math.min(1, Math.max(0, l + (nr - l) * sat))
    c[i + 1] = Math.min(1, Math.max(0, l + (ng - l) * sat))
    c[i + 2] = Math.min(1, Math.max(0, l + (nb - l) * sat))
  }
}

/** Etch the serial number into the cloud: a small plaque of particles under the artwork. */
function etchSerial(sample: Sample, serial: string, total: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 176; canvas.height = 40
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  ctx.fillStyle = '#fff'
  ctx.font = '700 30px ui-monospace, Menlo, Consolas, monospace'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(`GIV·${serial}`, 88, 21)
  const data = ctx.getImageData(0, 0, 176, 40).data
  const pts: [number, number][] = []
  for (let y = 0; y < 40; y++) for (let x = 0; x < 176; x++) if (data[(y * 176 + x) * 4 + 3] > 128) pts.push([x, y])
  if (!pts.length) return
  const reps = Math.max(1, Math.min(6, Math.floor((total * 0.025) / pts.length)))
  const count = Math.min(total, pts.length * reps)
  const rand = random(99)
  const scale = 9.5 / 176 // plaque ~9.5 units wide
  for (let j = 0; j < count; j++) {
    const i = Math.floor((j / count) * total) // evenly spread replaced particles through the cloud
    const [px, py] = pts[j % pts.length]
    sample.positions[i * 3] = (px - 88) * scale + (rand() - 0.5) * 0.04
    sample.positions[i * 3 + 1] = -19.5 - (py - 20) * scale + (rand() - 0.5) * 0.04
    sample.positions[i * 3 + 2] = (rand() - 0.5) * 0.15
    sample.colors[i * 3] = 0.95; sample.colors[i * 3 + 1] = 0.95; sample.colors[i * 3 + 2] = 0.95
  }
}

/** Try progressively simpler attributes; a null context makes THREE crash with a cryptic error. */
function createContext(canvas: HTMLCanvasElement) {
  const attempts: [string, WebGLContextAttributes][] = [
    ['webgl2', { antialias: true, powerPreference: 'high-performance' }],
    ['webgl2', { antialias: true }],
    ['webgl', { antialias: true }],
    ['webgl', { antialias: false, failIfMajorPerformanceCaveat: false }],
  ]
  for (const [type, attrs] of attempts) {
    const gl = canvas.getContext(type, attrs) as WebGLRenderingContext | WebGL2RenderingContext | null
    if (gl && !gl.isContextLost()) return gl
  }
  return null
}

/** Mounts the particle scene on a canvas. Call the returned dispose() on unmount. */
export function createParticleViewer(canvas: HTMLCanvasElement, options: ViewerOptions) {
  const cfg: ViewerConfig = { ...DEFAULT_VIEWER_CONFIG, ...options.config }
  let disposed = false
  let raf = 0
  let last = 0
  let time = 0
  let visible = true

  const context = createContext(canvas)
  if (!context) throw new Error('WebGL is unavailable or the GPU context could not be created. Enable hardware acceleration and reload.')
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true })
  renderer.setClearColor(cfg.backgroundColor, 1)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000)
  const deviceRatio = Math.min(window.devicePixelRatio || 1, 2)
  // The collector-only effect: owners see a slow scan shimmer unless the artist set their own effect.
  const effectName = options.owner && cfg.effect === 'default' ? 'scan' : cfg.effect
  const seedBase = options.seed ?? 11

  const lightness = luminance(cfg.backgroundColor)
  const custom = new THREE.Color(cfg.customColor)
  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 1 }, uProgress: { value: 0 }, uStyle: { value: 1 },
    uStrength: { value: 1 }, uGlow: { value: cfg.glow }, uPointSize: { value: cfg.particleSize },
    uEffectMode: { value: IMAGE_TRANSITION_EFFECT_MODES[effectName as keyof typeof IMAGE_TRANSITION_EFFECT_MODES] ?? 0 },
    uEffectIntensity: { value: 0 }, uEffectStrength: { value: cfg.effectStrength }, uEffectSpeed: { value: cfg.effectSpeed },
    uHoverMode: { value: IMAGE_TRANSITION_HOVER_MODES[cfg.hoverEffect as keyof typeof IMAGE_TRANSITION_HOVER_MODES] ?? 0 },
    uHoverPointer: { value: new THREE.Vector2(2, 2) }, uHoverIntensity: { value: 0 },
    uHoverRadius: { value: cfg.hoverRadius }, uHoverStrength: { value: cfg.hoverStrength },
    uViewportAspect: { value: 1 }, uSourceType: { value: 0 }, uExplosionTime: { value: 0 },
    uCanvasLightness: { value: lightness },
    uParticleColorMode: { value: cfg.colorMode === 'custom' ? 1 : 0 },
    uCustomParticleColor: { value: new THREE.Vector3(custom.r, custom.g, custom.b) },
  }
  const normalBlend = lightness >= 0.58 || (cfg.colorMode === 'custom' && luminance(cfg.customColor) < 0.45)
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: IMAGE_TRANSITION_VERTEX,
    fragmentShader: IMAGE_TRANSITION_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: normalBlend ? THREE.NormalBlending : THREE.AdditiveBlending,
  })

  let points: THREE.Points | null = null
  let geometry: THREE.BufferGeometry | null = null
  let pointRatio = 1
  let effectIntensity = 0
  let explosionTime = 0
  let hoverIntensity = 0
  let pointerInside = false
  const hoverPointer = new THREE.Vector2(2, 2)
  const hoverTarget = new THREE.Vector2(2, 2)
  const interactive = !!options.interactive
  const intro = options.intro !== false
  let introProgress = intro ? 0 : 1
  let hasGeometry = false
  let zoom = 1
  let baseDistance = 45
  let autoBlend = 1
  const drag = { active: false, x: 0, y: 0, lastInput: 0, t: 0 }
  // Orbit state: yaw (spin around the vertical axis) and pitch (tilt) are kept apart, with inertia.
  const spinVel = { yaw: 0, pitch: 0 }
  const touches = new Map<number, { x: number; y: number }>()
  let pinchDist = 0
  const MAX_PITCH = 1.15

  function resize() {
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width || canvas.clientWidth))
    const h = Math.max(1, Math.round(rect.height || canvas.clientHeight))
    renderer.setPixelRatio(deviceRatio)
    renderer.setSize(w, h, false)
    pointRatio = deviceRatio / Math.min(window.devicePixelRatio || 1, 2)
    uniforms.uPointSize.value = cfg.particleSize * pointRatio
    const aspect = w / h
    camera.aspect = aspect
    const half = Math.tan((camera.fov * Math.PI) / 360)
    const fitWidth = (19 * 1.15 * cfg.objectScale) / (half * aspect)
    baseDistance = Math.max(45, fitWidth)
    camera.position.set(0, 0, baseDistance * zoom)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    uniforms.uViewportAspect.value = aspect
  }

  function frame(dt: number) {
    time += dt * 0.48
    effectIntensity += ((effectName === 'default' ? 0 : 1) - effectIntensity) * Math.min(1, dt * 4.8)
    if (effectName === 'explode') {
      explosionTime += dt * 0.96
      if (explosionTime > 2) explosionTime = 0
    }
    const target = pointerInside && cfg.hoverEffect !== 'off' ? 1 : 0
    const response = 1 - Math.exp(-dt / Math.max(cfg.hoverReturn, 0.05))
    hoverPointer.lerp(hoverTarget, Math.min(1, Math.max(response, dt * 7.2)))
    hoverIntensity += (target - hoverIntensity) * Math.min(1, target > hoverIntensity ? Math.max(response, dt * 6) : response)
    if (hasGeometry && introProgress < 1) introProgress = Math.min(1, introProgress + dt / 2.6)
    uniforms.uProgress.value = introProgress
    const userHolding = interactive && (drag.active || performance.now() - drag.lastInput < 1000)
    autoBlend += ((userHolding ? 0 : 1) - autoBlend) * Math.min(1, dt * 5)
    if (points) {
      if (interactive) {
        // Yaw/pitch only (no roll), so the object never ends up on its side.
        points.rotation.order = 'YXZ'
        points.rotation.z = 0
        const auto = cfg.motion === 'spin' || cfg.motion === 'sway'
        if (!drag.active) {
          points.rotation.y += spinVel.yaw * dt
          points.rotation.x += spinVel.pitch * dt
          const decay = Math.exp(-dt * 3.2)
          spinVel.yaw *= decay; spinVel.pitch *= decay
          if (Math.abs(spinVel.yaw) < 0.001) spinVel.yaw = 0
          if (Math.abs(spinVel.pitch) < 0.001) spinVel.pitch = 0
        }
        if (auto) {
          points.rotation.y += dt * (effectName === 'vortex' ? 0.48 * (0.5 + effectIntensity) : 0.15) * autoBlend
        }
        // Ease the tilt back toward a gentle level once the user lets go.
        const level = auto ? Math.sin(time * 0.15) * 0.1 : 0
        points.rotation.x += (level - points.rotation.x) * Math.min(1, dt * 1.6) * autoBlend
        points.rotation.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, points.rotation.x))
      } else if (cfg.motion === 'spin') {
        points.rotation.y += dt * (effectName === 'vortex' ? 0.48 * (0.5 + effectIntensity) : 0.15)
        points.rotation.z += dt * 0.06
        points.rotation.x += (Math.sin(time * 0.15) * 0.12 - points.rotation.x) * Math.min(1, dt * 4.8)
      } else if (cfg.motion === 'sway') {
        points.rotation.set(Math.sin(time * 0.3) * 0.08, Math.sin(time * 0.7) * 0.32, 0)
      } else {
        points.rotation.set(0, 0, 0)
      }
    }
    uniforms.uTime.value = time
    uniforms.uEffectIntensity.value = effectIntensity
    uniforms.uExplosionTime.value = explosionTime
    uniforms.uHoverPointer.value.copy(hoverPointer)
    uniforms.uHoverIntensity.value = hoverIntensity
    renderer.render(scene, camera)
  }

  function tick(now: number) {
    raf = 0
    if (disposed || !visible || document.hidden) return
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60
    last = now
    frame(dt)
    raf = requestAnimationFrame(tick)
  }
  function wake() {
    if (!raf && !disposed && visible && !document.hidden) {
      last = 0
      raf = requestAnimationFrame(tick)
    }
  }

  function updatePointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    hoverTarget.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }
  const setZoom = (z: number) => {
    zoom = Math.min(1.5, Math.max(0.55, z))
    camera.position.z = baseDistance * zoom
  }
  const pinchSpan = () => {
    const [a, b] = [...touches.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }
  const onMove = (e: PointerEvent) => {
    const isTouch = e.pointerType === 'touch'
    if (!isTouch) { pointerInside = !drag.active; updatePointer(e) }
    if (!interactive) return
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (touches.size === 2) { // two fingers: pinch to zoom
      const d = pinchSpan()
      if (pinchDist > 0 && d > 0) setZoom(zoom * (pinchDist / d))
      pinchDist = d
      return
    }
    if (drag.active && points) {
      const dx = e.clientX - drag.x
      const dy = isTouch ? 0 : e.clientY - drag.y // on touch, vertical swipes belong to page scrolling
      const dtm = Math.max(1, e.timeStamp - drag.t) / 1000
      const k = 0.0085 * Math.min(1.4, zoom + 0.4) // finer control when zoomed in
      points.rotation.y += dx * k
      points.rotation.x = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, points.rotation.x + dy * k))
      spinVel.yaw = Math.max(-9, Math.min(9, (dx * k) / dtm))
      spinVel.pitch = Math.max(-6, Math.min(6, (dy * k) / dtm))
      drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp; drag.lastInput = performance.now()
    }
  }
  const onLeave = () => { pointerInside = false }
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.size === 2) { pinchDist = pinchSpan(); drag.active = false; return }
    } else if (e.button !== 0) return
    drag.active = true; drag.x = e.clientX; drag.y = e.clientY; drag.t = e.timeStamp; drag.lastInput = performance.now()
    spinVel.yaw = 0; spinVel.pitch = 0
    pointerInside = false
    if (e.pointerType !== 'touch') canvas.setPointerCapture?.(e.pointerId)
    canvas.style.cursor = 'grabbing'
  }
  const onUp = (e: PointerEvent) => {
    touches.delete(e.pointerId)
    if (touches.size < 2) pinchDist = 0
    if (touches.size === 1) { // one finger left after a pinch: carry on rotating from there
      const [rest] = [...touches.values()]
      drag.active = true; drag.x = rest.x; drag.y = rest.y; drag.t = e.timeStamp
      return
    }
    drag.active = false; drag.lastInput = performance.now()
    if (canvas.hasPointerCapture?.(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    canvas.style.cursor = 'grab'
  }
  // Scrolling the page over the art must keep working; zoom only on Ctrl/Cmd+wheel or trackpad pinch.
  const onWheel = (e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    setZoom(zoom + e.deltaY * (e.ctrlKey && Math.abs(e.deltaY) < 20 ? 0.01 : 0.002))
  }
  const onDouble = () => { // double-click / double-tap: reset the view
    setZoom(1); spinVel.yaw = 0; spinVel.pitch = 0
    if (points) points.rotation.x = 0
  }
  if (interactive) {
    canvas.style.cursor = 'grab'
    // Vertical swipes scroll the page; horizontal drags and pinches are ours.
    canvas.style.touchAction = 'pan-y'
    canvas.style.userSelect = 'none'
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('dblclick', onDouble)
    canvas.addEventListener('wheel', onWheel, { passive: false })
  }
  canvas.addEventListener('pointerenter', onMove)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerleave', onLeave)

  const ro = new ResizeObserver(() => { resize(); if (!raf) frame(0) })
  ro.observe(canvas)
  const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; wake() }, { rootMargin: '80px' })
  io.observe(canvas)
  const onVis = () => wake()
  document.addEventListener('visibilitychange', onVis)
  resize()

  // Build the particle geometry asynchronously.
  ;(async () => {
    try {
      const total = Math.max(5000, Math.min(150000, Math.round(options.maxParticles ?? cfg.particleCount)))
      const sample =
        options.assetType === 'cloud'
          ? cloudSample(options.assetUrl ? await loadBakedCloud(options.assetUrl) : placeholderCloud(random(seedBase + 11)), total, random(seedBase))
          : imageSample(await loadImage(options.assetUrl), total, random(seedBase))
      if (disposed) return
      if (options.seed != null) applySeedColour(sample, options.seed)
      if (options.serial) etchSerial(sample, options.serial.replace(/^GIV-/, ''), total)
      const rand = random(seedBase + 5)
      const offsets = new Float32Array(total * 3)
      for (let j = 0; j < offsets.length; j++) offsets[j] = (rand() - 0.5) * 2
      const normals = new Float32Array(total * 3)
      for (let n = 0; n < total; n++) normals[n * 3 + 2] = 1
      geometry = new THREE.BufferGeometry()
      // With the intro, particles start as the default spindle and morph into the artwork.
      const from = intro ? spindleSample(total, random(3), options.palette[0] ?? '#00ff66') : sample
      geometry.setAttribute('position', new THREE.BufferAttribute(from.positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(from.colors, 3))
      geometry.setAttribute('targetPosition', new THREE.BufferAttribute(sample.positions, 3))
      geometry.setAttribute('targetColor', new THREE.BufferAttribute(sample.colors, 3))
      geometry.setAttribute('targetNormal', new THREE.BufferAttribute(normals, 3))
      geometry.setAttribute('randomOffset', new THREE.BufferAttribute(offsets, 3))
      points = new THREE.Points(geometry, material)
      points.frustumCulled = false
      points.scale.setScalar(cfg.objectScale)
      scene.add(points)
      uniforms.uStyle.value = 2 // swirl
      hasGeometry = true
      resize()
      wake()
    } catch (e) {
      options.onError?.(e instanceof Error ? e.message : String(e))
    }
  })()

  const api: ViewerApi = {
    capture(width, height) {
      return new Promise((resolve, reject) => {
        const max = Math.min(renderer.capabilities.maxTextureSize, 8192)
        const w = Math.min(width, max), h = Math.min(height, max)
        const cssW = Math.max(1, canvas.clientWidth)
        renderer.setPixelRatio(1)
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        uniforms.uViewportAspect.value = w / h
        // Keep particles the same apparent size at the larger resolution.
        uniforms.uPointSize.value = cfg.particleSize * (w / (cssW * deviceRatio))
        renderer.render(scene, camera)
        canvas.toBlob((blob) => {
          resize() // back to the on-page size
          if (!raf) frame(0)
          if (blob) resolve(blob)
          else reject(new Error('Could not capture the image.'))
        }, 'image/png')
      })
    },
    recordLoop(seconds = 6) {
      return new Promise((resolve, reject) => {
        if (typeof MediaRecorder === 'undefined') return reject(new Error('Recording is not supported in this browser.'))
        const stream = canvas.captureStream(30)
        const mime = ['video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
        const chunks: Blob[] = []
        rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
        rec.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }))
        rec.onerror = () => reject(new Error('Recording failed.'))
        rec.start()
        setTimeout(() => rec.state !== 'inactive' && rec.stop(), seconds * 1000)
      })
    },
  }
  options.onReady?.(api)

  return {
    ...api,
    dispose() {
      options.onReady?.(null)
      disposed = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointerenter', onMove)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('dblclick', onDouble)
      geometry?.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
