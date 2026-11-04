// Browser-side GLB -> coloured point cloud baker.
// Output format ("cloud"): Float32 xyz * N, followed by Uint8 rgb * N (15 bytes per point).
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'

const TARGET_EXTENT = 30 // longest side after normalising (the viewer expects ~±15)

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055)

type TexData = { w: number; h: number; data: Uint8ClampedArray; flipY: boolean }

function readTexture(tex: THREE.Texture, cache: Map<THREE.Texture, TexData | null>): TexData | null {
  if (cache.has(tex)) return cache.get(tex)!
  let out: TexData | null = null
  const img = tex.image as CanvasImageSource & { width: number; height: number }
  if (img && img.width && img.height) {
    // Downscale huge textures; the cloud can't resolve more detail anyway.
    const scale = Math.min(1, 2048 / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(img, 0, 0, w, h)
    out = { w, h, data: ctx.getImageData(0, 0, w, h).data, flipY: tex.flipY }
  }
  cache.set(tex, out)
  return out
}

function triangleArea(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  const pos = geometry.attributes.position
  const index = geometry.index
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const n = index ? index.count : pos.count
  let area = 0
  const tri = new THREE.Triangle()
  for (let i = 0; i < n; i += 3) {
    const ia = index ? index.getX(i) : i, ib = index ? index.getX(i + 1) : i + 1, ic = index ? index.getX(i + 2) : i + 2
    a.fromBufferAttribute(pos, ia).applyMatrix4(matrix)
    b.fromBufferAttribute(pos, ib).applyMatrix4(matrix)
    c.fromBufferAttribute(pos, ic).applyMatrix4(matrix)
    tri.set(a, b, c)
    area += tri.getArea()
  }
  return area
}

export async function bakeGlbToCloud(file: File, count = 80000): Promise<{ buffer: ArrayBuffer; count: number }> {
  const gltf = await new GLTFLoader().parseAsync(await file.arrayBuffer(), '')
  gltf.scene.updateMatrixWorld(true)

  const meshes: { mesh: THREE.Mesh; area: number }[] = []
  gltf.scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (mesh.isMesh && mesh.geometry?.attributes.position) {
      const area = triangleArea(mesh.geometry, mesh.matrixWorld)
      if (area > 0) meshes.push({ mesh, area })
    }
  })
  if (!meshes.length) throw new Error('The GLB contains no meshes.')
  const totalArea = meshes.reduce((s, m) => s + m.area, 0)

  const positions = new Float32Array(count * 3)
  const colors = new Uint8Array(count * 3)
  const texCache = new Map<THREE.Texture, TexData | null>()
  const p = new THREE.Vector3(), nrm = new THREE.Vector3(), vc = new THREE.Color(), uv = new THREE.Vector2()
  let written = 0

  meshes.forEach(({ mesh, area }, mi) => {
    const n = mi === meshes.length - 1 ? count - written : Math.round((area / totalArea) * count)
    if (n <= 0) return
    const sampler = new MeshSurfaceSampler(mesh).build()
    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
    const base = mat.color ?? new THREE.Color(1, 1, 1)
    const map = mat.map ? readTexture(mat.map, texCache) : null
    const hasUv = !!mesh.geometry.attributes.uv
    const hasVertexColor = !!mesh.geometry.attributes.color

    for (let i = 0; i < n && written < count; i++, written++) {
      vc.set(1, 1, 1) // linear working space
      sampler.sample(p, nrm, hasVertexColor ? vc : undefined, hasUv ? uv : undefined)
      p.applyMatrix4(mesh.matrixWorld)

      let r = base.r * vc.r, g = base.g * vc.g, b = base.b * vc.b
      if (map && hasUv) {
        const u = uv.x - Math.floor(uv.x), v = uv.y - Math.floor(uv.y)
        const x = Math.min(map.w - 1, Math.floor(u * map.w))
        const y = Math.min(map.h - 1, Math.floor((map.flipY ? 1 - v : v) * map.h))
        const o = (y * map.w + x) * 4
        r *= toLinear(map.data[o] / 255); g *= toLinear(map.data[o + 1] / 255); b *= toLinear(map.data[o + 2] / 255)
      }
      positions.set([p.x, p.y, p.z], written * 3)
      colors[written * 3] = Math.round(Math.min(1, toSrgb(r)) * 255)
      colors[written * 3 + 1] = Math.round(Math.min(1, toSrgb(g)) * 255)
      colors[written * 3 + 2] = Math.round(Math.min(1, toSrgb(b)) * 255)
    }
  })

  // Normalise: centre on the bounding box and scale the longest side to TARGET_EXTENT.
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 3; k++) {
      const v = positions[i * 3 + k]
      if (v < min[k]) min[k] = v
      if (v > max[k]) max[k] = v
    }
  }
  const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1
  const s = TARGET_EXTENT / extent
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 3; k++) positions[i * 3 + k] = (positions[i * 3 + k] - (min[k] + max[k]) / 2) * s
  }

  const buffer = new ArrayBuffer(count * 15)
  new Float32Array(buffer, 0, count * 3).set(positions)
  new Uint8Array(buffer, count * 12, count * 3).set(colors)
  return { buffer, count }
}
