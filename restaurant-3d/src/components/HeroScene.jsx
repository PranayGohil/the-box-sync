/**
 * Cinematic Hero Scene (React Three Fiber)
 * - Floating food sphere "portal" rings
 * - Depth-layered environment
 * - Scroll-reactive camera drift
 */
import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Float, Environment, MeshDistortMaterial,
  MeshWobbleMaterial, Stars,
} from '@react-three/drei';
import * as THREE from 'three';

/* ── Animated distorted sphere — ambient orb */
function Orb({ position, color, radius = 1, speed = 0.5, distort = 0.4 }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.getElapsedTime() * speed * 0.4;
    mesh.current.rotation.x = clock.getElapsedTime() * speed * 0.2;
  });
  return (
    <Float speed={speed} floatIntensity={1.5} rotationIntensity={0.4}>
      <mesh ref={mesh} position={position}>
        <sphereGeometry args={[radius, 64, 64]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={1.8}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.75}
        />
      </mesh>
    </Float>
  );
}

/* ── Torus ring that slowly rotates */
function Ring({ position, color, rotation = [0, 0, 0], radius = 1.4, tube = 0.06 }) {
  const mesh = useRef();
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = rotation[0] + clock.getElapsedTime() * 0.3;
    mesh.current.rotation.z = rotation[2] + clock.getElapsedTime() * 0.15;
  });
  return (
    <mesh ref={mesh} position={position}>
      <torusGeometry args={[radius, tube, 16, 120]} />
      <meshStandardMaterial color={color} metalness={0.95} roughness={0.05} />
    </mesh>
  );
}

/* ── Particle field */
function ParticleField({ count = 200 }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#f27a1a" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ── Camera that drifts subtly with mouse / time */
function CameraRig() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useFrame(({ clock }) => {
    // Subtle sinusoidal drift
    camera.position.x += (mouse.current.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.02;
    camera.position.z = 6 + Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 1.5]}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[8, 6, 4]}  intensity={2}   color="#f59e42" />
      <pointLight      position={[-6, -4, -4]} intensity={1}   color="#D4AF37" />
      <pointLight      position={[0, 8, 2]}    intensity={0.6} color="#ffffff" />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#f27a1a"
        castShadow
      />

      {/* Background stars */}
      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />

      {/* Particle field */}
      <ParticleField count={300} />

      {/* Primary orb — left */}
      <Orb position={[-2.8, 0.4, 0]}  color="#f27a1a" radius={1.2} speed={0.7} distort={0.5} />
      {/* Gold accent orb — right */}
      <Orb position={[2.8, -0.6, -1]} color="#D4AF37" radius={0.75} speed={0.5} distort={0.3} />
      {/* Small accent */}
      <Orb position={[0.5, 2.2, -2]}  color="#ba430d" radius={0.45} speed={1.1} distort={0.6} />

      {/* Torus rings */}
      <Ring position={[2.2, 1.0, -1.5]} color="#D4AF37" rotation={[0.5, 0, 0.8]} radius={1.5} tube={0.05} />
      <Ring position={[-1.8, -1.5, -2]} color="#f27a1a" rotation={[1.2, 0, 0.3]} radius={1.0} tube={0.04} />

      <Environment preset="city" />
    </Canvas>
  );
}
