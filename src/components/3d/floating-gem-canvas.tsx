'use client';

import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';

/**
 * Decorative gem.
 *
 * Uses a plain physical material rather than MeshTransmissionMaterial: the
 * transmission pass needs render-target features many mobile GPUs decline,
 * where it fell back to rendering a solid black shape. This version relies
 * only on standard lighting, so it looks the same everywhere.
 */
export default function FloatingGemCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[2, 3, 4]} intensity={1.8} />
      <directionalLight position={[-3, -1, -2]} intensity={0.6} color="#fde9c8" />

      <Float speed={1.6} rotationIntensity={1.1} floatIntensity={1.2}>
        <mesh>
          <octahedronGeometry args={[0.85, 0]} />
          <meshPhysicalMaterial
            color="#e8b476"
            metalness={0.25}
            roughness={0.15}
            clearcoat={1}
            clearcoatRoughness={0.1}
            emissive="#8a5a22"
            emissiveIntensity={0.18}
            flatShading
          />
        </mesh>
      </Float>
    </Canvas>
  );
}
