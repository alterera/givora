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
  assetType: 'bin' | 'image' | 'cloud'
  palette: string[]
  config?: Partial<ViewerConfig>
  /** Override particle count (e.g. low for grid cards). */
  maxParticles?: number
  /** Drag to orbit, wheel to zoom. Use on detail pages only. */
  interactive?: boolean
  /** Morph from the default spindle into the artwork on load (default true). */
  intro?: boolean
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

function hash(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return h - Math.floor(h)
}
function noise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  let fx = x - ix, fy = y - iy, fz = z - iz
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz)
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), fx), lerp(c(0, 1, 0), c(1, 1, 0), fx), fy),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), fx), lerp(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz
  )
}

function hexRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16)
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255]
}

/** Our baked cloud: Float32 xyz * N then Uint8 rgb * N (see bake.ts). Colours are stored, not palette-derived. */
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

/** Baked .bin cloud (Int16 xyz) -> positions/colours, same maths as Particleify's loadPointCloud. */
async function loadCloud(url: string, paletteHex: string[]) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not load the 3D shape.')
  const raw = new Int16Array(await response.arrayBuffer())
  const count = Math.floor(raw.length / 3)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const palette = paletteHex.map(hexRgb)
  const yaw = (70 * Math.PI) / 180
  const cos = Math.cos(yaw), sin = Math.sin(yaw)
  for (let i = 0; i < count; i++) {
    const x = raw[i * 3] / 32767, y = raw[i * 3 + 1] / 32767, z = raw[i * 3 + 2] / 32767
    positions[i * 3] = (x * cos + z * sin) * 15
    positions[i * 3 + 1] = y * 15
    positions[i * 3 + 2] = (-x * sin + z * cos) * 15
    const n = Math.min(1, Math.max(0, noise(x * 2.4 + 7.1, y * 2.4 + 3.3, z * 2.4) * 1.6 - 0.3))
    const from = n < 0.5 ? palette[0] : palette[1]
    const to = n < 0.5 ? palette[1] : palette[2]
    const t = n < 0.5 ? n * 2 : n * 2 - 1
    const shade = 0.7 + hash(i, 1.7, 9.2) * 0.3
    for (let c = 0; c < 3; c++) colors[i * 3 + c] = (from[c] + (to[c] - from[c]) * t) * shade
  }
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

  const lightness = luminance(cfg.backgroundColor)
  const custom = new THREE.Color(cfg.customColor)
  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 1 }, uProgress: { value: 0 }, uStyle: { value: 1 },
    uStrength: { value: 1 }, uGlow: { value: cfg.glow }, uPointSize: { value: cfg.particleSize },
    uEffectMode: { value: IMAGE_TRANSITION_EFFECT_MODES[cfg.effect as keyof typeof IMAGE_TRANSITION_EFFECT_MODES] ?? 0 },
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
  const drag = { active: false, x: 0, y: 0, lastInput: 0 }

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
    effectIntensity += ((cfg.effect === 'default' ? 0 : 1) - effectIntensity) * Math.min(1, dt * 4.8)
    if (cfg.effect === 'explode') {
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
      if (cfg.motion === 'spin' || (interactive && cfg.motion === 'sway')) {
        points.rotation.y += dt * (cfg.effect === 'vortex' ? 0.48 * (0.5 + effectIntensity) : 0.15) * autoBlend
        points.rotation.z += dt * 0.06 * autoBlend
        points.rotation.x += (Math.sin(time * 0.15) * 0.12 - points.rotation.x) * Math.min(1, dt * 4.8) * autoBlend
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
  const onMove = (e: PointerEvent) => {
    pointerInside = !drag.active
    updatePointer(e)
    if (interactive && drag.active && points) {
      points.rotation.y += (e.clientX - drag.x) * 0.005
      points.rotation.x += (e.clientY - drag.y) * 0.005
      drag.x = e.clientX; drag.y = e.clientY; drag.lastInput = performance.now()
    }
  }
  const onLeave = () => { pointerInside = false }
  const onDown = (e: PointerEvent) => {
    drag.active = true; drag.x = e.clientX; drag.y = e.clientY; drag.lastInput = performance.now()
    pointerInside = false
    canvas.setPointerCapture?.(e.pointerId)
    canvas.style.cursor = 'grabbing'
  }
  const onUp = (e: PointerEvent) => {
    drag.active = false; drag.lastInput = performance.now()
    canvas.releasePointerCapture?.(e.pointerId)
    canvas.style.cursor = 'grab'
  }
  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    zoom = Math.min(1.5, Math.max(0.55, zoom + e.deltaY * 0.001))
    camera.position.z = baseDistance * zoom
  }
  if (interactive) {
    canvas.style.cursor = 'grab'
    canvas.style.touchAction = 'pan-y'
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
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
          ? cloudSample(await loadBakedCloud(options.assetUrl), total, random(11))
          : options.assetType === 'bin'
          ? cloudSample(await loadCloud(options.assetUrl, options.palette), total, random(11))
          : imageSample(await loadImage(options.assetUrl), total, random(11))
      if (disposed) return
      const rand = random(5)
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

  return {
    dispose() {
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
      geometry?.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
