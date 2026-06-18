import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Float, Trail, Ring, Sparkles, Line, Text, Plane, Box, Icosahedron, Torus, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 1. SOLAR SYSTEM THEME
// ============================================================================
function ThemeSolarSystem() {
  const planets = useMemo(() => [
    { color: '#2b82c9', size: 2.5, dist: 20, speed: 0.3 },
    { color: '#c1440e', size: 1.8, dist: 14, speed: 0.4 },
    { color: '#e2bf7d', size: 4, dist: 35, speed: 0.15, rings: true },
    { color: '#00f2fe', size: 2, dist: 50, speed: 0.08 }
  ], []);

  const sunRef = useRef();
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.005;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      sunRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <group ref={sunRef}>
        <pointLight intensity={2000} distance={100} decay={2} color="#ffffff" />
        <Sphere args={[8, 64, 64]}><meshBasicMaterial color="#ffcc00" /></Sphere>
        <Sphere args={[8.5, 32, 32]}><meshBasicMaterial color="#ff6600" transparent opacity={0.3} side={THREE.BackSide} /></Sphere>
      </group>
      {planets.map((p, i) => <OrbitingPlanet key={i} data={p} />)}
    </group>
  );
}

function OrbitingPlanet({ data }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * data.speed;
    ref.current.position.x = Math.cos(t) * data.dist;
    ref.current.position.z = Math.sin(t) * data.dist;
    ref.current.rotation.y += 0.02;
  });
  return (
    <group ref={ref}>
      <Sphere args={[data.size, 32, 32]}>
        <meshStandardMaterial color={data.color} roughness={0.6} />
      </Sphere>
      {data.rings && (
        <Ring args={[data.size*1.4, data.size*2.2, 64]} rotation={[-Math.PI/2.2, 0, 0]}>
          <meshStandardMaterial color="#a8946c" transparent opacity={0.6} side={THREE.DoubleSide} />
        </Ring>
      )}
    </group>
  );
}

// ============================================================================
// 2. HYPERSPACE TUNNEL THEME
// ============================================================================
function ThemeHyperspace() {
  const points = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 2000; i++) {
      temp.push(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 500 - 100
      );
    }
    return new Float32Array(temp);
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const positions = points.current.geometry.attributes.position.array;
    for (let i = 2; i < positions.length; i += 3) {
      positions[i] += 200 * delta; // Fly towards camera very fast
      if (positions[i] > 50) positions[i] = -400; // Reset far away
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <ambientLight intensity={1} />
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2000} array={particles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.5} color="#ffffff" transparent opacity={0.8} />
      </points>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={2000} array={particles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.8} color="#00f2fe" transparent opacity={0.4} />
      </points>
    </group>
  );
}

// ============================================================================
// 3. BLACK HOLE THEME
// ============================================================================
function ThemeBlackHole() {
  const diskRef = useRef();
  const jetRef = useRef();

  useFrame((state) => {
    if (diskRef.current) {
      diskRef.current.rotation.z -= 0.05;
    }
    if (jetRef.current) {
      jetRef.current.rotation.y += 0.1;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={3000} factor={3} saturation={0} fade />
      <ambientLight intensity={0.1} />
      {/* Event Horizon */}
      <Sphere args={[10, 64, 64]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      {/* Accretion Disk */}
      <group ref={diskRef} rotation={[Math.PI / 3, 0, 0]}>
        <Torus args={[18, 5, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ff6600" transparent opacity={0.8} wireframe={false} />
        </Torus>
        <Torus args={[22, 1, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.5} />
        </Torus>
      </group>
      {/* Photosphere / Light Bending Simulation */}
      <Sphere args={[11, 64, 64]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}

// ============================================================================
// 4. DEEP SPACE NEBULA THEME
// ============================================================================
function ThemeNebula() {
  return (
    <group>
      <Stars radius={150} depth={50} count={6000} factor={6} saturation={1} fade />
      <ambientLight intensity={1} />
      <Sparkles count={500} scale={100} size={15} speed={0.1} opacity={0.3} color="#ff3366" />
      <Sparkles count={500} scale={120} size={20} speed={0.2} opacity={0.3} color="#00f2fe" />
      <Sparkles count={500} scale={150} size={25} speed={0.15} opacity={0.2} color="#9d4edd" />
      <Float speed={1} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[30, 32, 32]} position={[0, 0, -50]}>
          <meshBasicMaterial color="#110033" transparent opacity={0.6} />
        </Sphere>
      </Float>
    </group>
  );
}

// ============================================================================
// 5. ASTEROID FIELD THEME
// ============================================================================
function ThemeAsteroidField() {
  const asteroids = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 200; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 100
        ],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.02
      });
    }
    return temp;
  }, []);

  const groupRef = useRef();
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.2} />
      <directionalLight position={[50, 50, 50]} intensity={1.5} color="#ffffff" />
      <group ref={groupRef}>
        {asteroids.map((ast, i) => (
          <Asteroid key={i} data={ast} />
        ))}
      </group>
    </group>
  );
}

function Asteroid({ data }) {
  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.x += data.speed;
    ref.current.rotation.y += data.speed;
  });
  return (
    <Icosahedron ref={ref} args={[1, 1]} position={data.position} rotation={data.rotation} scale={data.scale}>
      <meshStandardMaterial color="#555555" roughness={0.9} />
    </Icosahedron>
  );
}

// ============================================================================
// 6. SUPERNOVA EXPLOSION THEME
// ============================================================================
function ThemeSupernova() {
  const coreRef = useRef();
  const shockwaveRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coreRef.current) {
      const scale = 1 + Math.sin(t * 10) * 0.05;
      coreRef.current.scale.set(scale, scale, scale);
    }
    if (shockwaveRef.current) {
      let scale = (t % 4) * 15;
      let opacity = 1 - (t % 4) / 4;
      shockwaveRef.current.scale.set(scale, scale, scale);
      shockwaveRef.current.material.opacity = opacity;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.5} />
      <group ref={coreRef}>
        <Sphere args={[8, 64, 64]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
        <Sphere args={[10, 64, 64]}>
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.6} side={THREE.BackSide} />
        </Sphere>
      </group>
      <Sphere ref={shockwaveRef} args={[1, 64, 64]}>
        <meshBasicMaterial color="#00f2fe" transparent opacity={1} side={THREE.DoubleSide} />
      </Sphere>
      <pointLight intensity={5000} color="#00f2fe" distance={200} />
    </group>
  );
}

// ============================================================================
// 7. PULSAR (NEUTRON STAR) THEME
// ============================================================================
function ThemePulsar() {
  const pulsarRef = useRef();

  useFrame((state) => {
    if (pulsarRef.current) {
      pulsarRef.current.rotation.z += 0.2;
      pulsarRef.current.rotation.x = Math.PI / 4; // Tilted
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.1} />
      
      <group ref={pulsarRef}>
        {/* Core */}
        <Sphere args={[4, 64, 64]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
        {/* Beams */}
        <Cylinder args={[0.5, 5, 200, 32]} position={[0, 100, 0]}>
          <meshBasicMaterial color="#9d4edd" transparent opacity={0.6} />
        </Cylinder>
        <Cylinder args={[0.5, 5, 200, 32]} position={[0, -100, 0]}>
          <meshBasicMaterial color="#9d4edd" transparent opacity={0.6} />
        </Cylinder>
        {/* Magnetic Field Visualization */}
        <Torus args={[15, 0.1, 16, 100]} rotation={[Math.PI/2, 0, 0]}>
          <meshBasicMaterial color="#00f2fe" transparent opacity={0.3} />
        </Torus>
      </group>
      <pointLight intensity={3000} color="#9d4edd" distance={150} />
    </group>
  );
}

// ============================================================================
// 8. GALAXY SPIRAL THEME
// ============================================================================
function ThemeGalaxySpiral() {
  const galaxyRef = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    const arms = 4;
    for (let i = 0; i < 3000; i++) {
      const distance = Math.random() * 40 + 2;
      const angle = (i % arms) * (Math.PI * 2 / arms) + distance * 0.2 + (Math.random() * 0.5);
      temp.push(
        Math.cos(angle) * distance,
        (Math.random() - 0.5) * (10 / (distance * 0.1 + 1)), // Flatter at edges
        Math.sin(angle) * distance
      );
    }
    return new Float32Array(temp);
  }, []);

  useFrame((state) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y -= 0.005;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={2000} factor={3} saturation={0} fade />
      <group ref={galaxyRef} rotation={[0.2, 0, 0.2]}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={3000} array={particles} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={0.6} color="#ffb86c" transparent opacity={0.8} />
        </points>
        {/* Galactic Core */}
        <Sphere args={[4, 32, 32]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
        <pointLight intensity={2000} color="#ffb86c" distance={100} />
      </group>
    </group>
  );
}

// ============================================================================
// 9. BINARY STAR SYSTEM THEME
// ============================================================================
function ThemeBinaryStars() {
  const systemRef = useRef();

  useFrame(() => {
    if (systemRef.current) {
      systemRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.2} />
      <group ref={systemRef}>
        {/* Star 1 (Blue Giant) */}
        <group position={[15, 0, 0]}>
          <Sphere args={[6, 32, 32]}><meshBasicMaterial color="#00f2fe" /></Sphere>
          <pointLight intensity={1500} color="#00f2fe" distance={150} />
        </group>
        {/* Star 2 (Red Dwarf) */}
        <group position={[-15, 0, 0]}>
          <Sphere args={[3, 32, 32]}><meshBasicMaterial color="#ff3366" /></Sphere>
          <pointLight intensity={800} color="#ff3366" distance={100} />
        </group>
        {/* Gravitational pull effect / trail */}
        <Torus args={[15, 0.1, 16, 100]} rotation={[Math.PI/2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
        </Torus>
      </group>
    </group>
  );
}

// ============================================================================
// 10. EXOPLANET & MOON THEME
// ============================================================================
function ThemeExoplanet() {
  const planetRef = useRef();
  const moonRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.002;
    }
    if (moonRef.current) {
      moonRef.current.position.x = Math.cos(t * 0.5) * 20;
      moonRef.current.position.z = Math.sin(t * 0.5) * 20;
      moonRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <Stars radius={100} depth={50} count={4000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.1} />
      <directionalLight position={[-50, 20, 30]} intensity={2} color="#ffffff" />
      
      {/* Massive Exoplanet */}
      <Sphere ref={planetRef} args={[25, 64, 64]} position={[20, -10, -40]}>
        <meshStandardMaterial color="#2d1b4e" roughness={0.7} />
      </Sphere>
      
      {/* Orbiting Moon */}
      <group position={[20, -10, -40]}>
        <Sphere ref={moonRef} args={[3, 32, 32]}>
          <meshStandardMaterial color="#888888" roughness={0.9} />
        </Sphere>
      </group>
    </group>
  );
}

// ============================================================================
// SCENE MANAGER & THEME REGISTRY
// ============================================================================
const THEMES = [
  ThemeSolarSystem,
  ThemeHyperspace,
  ThemeBlackHole,
  ThemeNebula,
  ThemeAsteroidField,
  ThemeSupernova,
  ThemePulsar,
  ThemeGalaxySpiral,
  ThemeBinaryStars,
  ThemeExoplanet
];

function SceneManager({ intervalSeconds = 30 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeRef = useRef();

  useEffect(() => {
    const timer = setInterval(() => {
      setNextIndex((prev) => (prev + 1) % THEMES.length);
      setFading(true);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [intervalSeconds]);

  useFrame((state, delta) => {
    if (!fadeRef.current) return;
    
    if (fading) {
      fadeRef.current.opacity += delta * 1.5; // Fade to black
      if (fadeRef.current.opacity >= 1) {
        fadeRef.current.opacity = 1;
        setCurrentIndex(nextIndex); // Swap theme
        setFading(false); // Start fading in
      }
    } else {
      if (fadeRef.current.opacity > 0) {
        fadeRef.current.opacity -= delta * 1.5; // Fade from black
        if (fadeRef.current.opacity <= 0) fadeRef.current.opacity = 0;
      }
    }
  });

  const ActiveTheme = THEMES[currentIndex];

  return (
    <>
      <ActiveTheme />
      <Plane args={[100, 100]} position={[0, 0, -2]}>
        <meshBasicMaterial ref={fadeRef} color="#000000" transparent opacity={0} depthTest={false} />
      </Plane>
    </>
  );
}

// Global camera sweeping motion
function MasterCamera() {
  const { camera } = useThree();
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    camera.position.x = Math.sin(time * 0.05) * 10;
    camera.position.y = Math.sin(time * 0.03) * 5 + 10;
    camera.position.z = Math.cos(time * 0.05) * 10 + 60;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function SpaceBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      background: '#020205', 
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [0, 10, 70], fov: 45 }}>
        <MasterCamera />
        <SceneManager intervalSeconds={30} />
      </Canvas>
    </div>
  );
}
