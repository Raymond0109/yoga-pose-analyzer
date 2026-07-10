/**
 * 向量/矩阵数学工具
 */

/** 三维向量 */
export interface Vec3 {
  x: number
  y: number
  z: number
}

/** 创建零向量 */
export function vec3Zero(): Vec3 {
  return { x: 0, y: 0, z: 0 }
}

/** 向量加法 */
export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

/** 向量减法 */
export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

/** 向量缩放 */
export function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

/** 向量长度 */
export function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

/** 向量归一化 */
export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v)
  if (len < 0.0001) return vec3Zero()
  return vec3Scale(v, 1 / len)
}

/** 向量点积 */
export function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

/** 向量叉积 */
export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }
}

/** 两点距离 */
export function vec3Distance(a: Vec3, b: Vec3): number {
  return vec3Length(vec3Sub(a, b))
}

/** 三点夹角 (度) */
export function angleBetweenThreePoints(a: Vec3, vertex: Vec3, c: Vec3): number {
  const ba = vec3Sub(a, vertex)
  const bc = vec3Sub(c, vertex)
  const dot = vec3Dot(ba, bc)
  const magBA = vec3Length(ba)
  const magBC = vec3Length(bc)
  if (magBA < 0.0001 || magBC < 0.0001) return 0
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)))
  return Math.acos(cosAngle) * (180 / Math.PI)
}

/** 角度转弧度 */
export function degToRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/** 弧度转角度 */
export function radToDeg(rad: number): number {
  return rad * (180 / Math.PI)
}
