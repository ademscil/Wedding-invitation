'use client';

import { Canvas } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';

function Ring({ position, rotation, radius }: { position: [number, number, number]; rotation: [number, number, number]; radius: number }) {
  return (
    <mesh position={position} rotation={rotation}>
      <torusGeometry args={[radius, radius * 0.16, 32, 100]} />
      <meshStandardMaterial color="#e6b866" metalness={0.55} roughness={0.3} emissive="#3d2a10" emissiveIntensity={0.15} />
    </mesh>
  );
}

function Gem({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} scale={0.55}>
      <octahedronGeometry args={[0.22, 0]} />
      <MeshTransmissionMaterial thickness={0.5} roughness={0.05} transmission={1} ior={1.5} chromaticAberration={0.04} color="#ffe9c7" />
    </mesh>
  );
}

export default function WeddingRingsCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 40 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={1.8} color="#fff4dd" />
      <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#fef3c7" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#ffffff" />

      <Float speed={1.4} rotationIntensity={0.6} floatIntensity={1.2}>
        <group rotation={[0.3, 0, 0]}>
          <Ring position={[-0.55, 0, 0]} rotation={[Math.PI / 2, 0, 0]} radius={1} />
          <Ring position={[0.55, 0, 0.15]} rotation={[Math.PI / 2, 0.2, 0]} radius={1} />
          <Gem position={[0, 0, 0.55]} />
        </group>
      </Float>
    </Canvas>
  );
}
