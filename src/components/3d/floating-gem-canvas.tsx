'use client';

import { Canvas } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';

export default function FloatingGemCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.2], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 4]} intensity={1.3} />
      <directionalLight position={[-3, -1, -2]} intensity={0.3} color="#fef3c7" />

      <Float speed={1.6} rotationIntensity={1.1} floatIntensity={1.6}>
        <mesh>
          <octahedronGeometry args={[0.8, 0]} />
          <MeshTransmissionMaterial
            thickness={0.6}
            roughness={0.05}
            transmission={1}
            ior={1.5}
            chromaticAberration={0.05}
            color="#f5c77e"
          />
        </mesh>
      </Float>
    </Canvas>
  );
}
