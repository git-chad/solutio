import { useFrame } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import type { Mesh } from "three"
import { abs, cos, sin, time, vec3 } from "three/tsl"
import { MeshBasicNodeMaterial } from "three/webgpu"

const Scene = () => {
  const meshRef = useRef<Mesh>(null)

  useFrame((_state, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta
    meshRef.current.rotation.y += delta
  })

  const material = useMemo(() => {
    const mat = new MeshBasicNodeMaterial()
    mat.colorNode = abs(vec3(sin(time), cos(time.mul(4)), sin(time.mul(2))))
    return mat
  }, [])
  return (
    <mesh ref={meshRef} material={material} scale={10}>
      <boxGeometry />
    </mesh>
  )
}

export default Scene
