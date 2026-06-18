import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Float, Trail, Ring, Sparkles, Line, Text, Plane, Box, Icosahedron, Torus } from '@react-three/drei';
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
      positions[i] += 150 * delta; // Fly towards camera very fast
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
        <pointsMaterial size={0.5} color="#00f2fe" transparent opacity={0.8} />
      </points>
    </group>
  );
}

// ============================================================================
// 3. CYBERPUNK NEON GRID THEME
// ============================================================================
function ThemeCyberGrid() {
  const gridRef = useRef();
  
  useFrame((state, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 15) % 10;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      {/* Moving Grid Floor */}
      <group ref={gridRef} position={[0, -10, 0]}>
        <gridHelper args={[200, 40, '#ff0055', '#7f00ff']} position={[0, 0, -50]} />
      </group>
      {/* Synthwave Sun */}
      <Sphere args={[25, 32, 32]} position={[0, 5, -100]}>
        <meshBasicMaterial color="#f5ed18" />
      </Sphere>
      <Stars radius={150} depth={50} count={2000} factor={4} fade speed={0.5} color="#ff0055" />
    </group>
  );
}

// ============================================================================
// 4. NEURAL NETWORK THEME
// ============================================================================
function ThemeNeuralNet() {
  const groupRef = useRef();
  
  const nodes = useMemo(() => {
    return Array.from({ length: 60 }).map(() => [
      (Math.random() - 0.5) * 80,
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 80
    ]);
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={1} />
      {nodes.map((pos, i) => (
        <Sphere key={i} args={[0.5]} position={pos}>
          <meshBasicMaterial color="#00ff87" />
        </Sphere>
      ))}
      {/* Connect some lines */}
      <Line points={nodes.slice(0, 30)} color="#00ff87" lineWidth={1} transparent opacity={0.2} />
      <Line points={nodes.slice(30, 60)} color="#00f2fe" lineWidth={1} transparent opacity={0.2} />
    </group>
  );
}

// ============================================================================
// 5. PARTICLE OCEAN THEME
// ============================================================================
function ThemeParticleOcean() {
  const pointsRef = useRef();
  
  const { particles, size } = useMemo(() => {
    const temp = [];
    const size = 50;
    for (let ix = 0; ix < size; ix++) {
      for (let iy = 0; iy < size; iy++) {
        temp.push(ix * 2 - size, 0, iy * 2 - size);
      }
    }
    return { particles: new Float32Array(temp), size };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const positions = pointsRef.current.geometry.attributes.position.array;
    const time = state.clock.elapsedTime * 1.5;
    let i = 0;
    for (let ix = 0; ix < size; ix++) {
      for (let iy = 0; iy < size; iy++) {
        positions[i + 1] = Math.sin((ix + time) * 0.3) * 3 + Math.cos((iy + time) * 0.4) * 3;
        i += 3;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group position={[0, -10, 0]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles.length/3} array={particles} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.3} color="#4facfe" />
      </points>
    </group>
  );
}

// ============================================================================
// 6. QUANTUM CLOUD THEME
// ============================================================================
function ThemeQuantumCloud() {
  const cloudRef = useRef();
  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      cloudRef.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={cloudRef}>
      <Sparkles count={5000} scale={60} size={2} speed={0.4} opacity={0.8} color="#7f00ff" />
      <Sparkles count={3000} scale={40} size={4} speed={0.8} opacity={1} color="#00f2fe" />
    </group>
  );
}

// ============================================================================
// 7. FLOATING CRYSTALS THEME
// ============================================================================
function ThemeCrystals() {
  const crystals = useMemo(() => Array.from({ length: 40 }).map(() => ({
    pos: [(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80],
    scale: Math.random() * 2 + 1,
    speed: Math.random() * 0.02
  })), []);

  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={2} color="#00f2fe" />
      <directionalLight position={[-10, -20, -10]} intensity={2} color="#ff0055" />
      {crystals.map((c, i) => (
        <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2} position={c.pos}>
          <Icosahedron args={[c.scale, 0]}>
            <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.8} flatShading />
          </Icosahedron>
        </Float>
      ))}
    </group>
  );
}

// ============================================================================
// 8. BLACK HOLE THEME
// ============================================================================
function ThemeBlackHole() {
  const diskRef = useRef();
  useFrame((state) => {
    if (diskRef.current) {
      diskRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[0, 0, -20]}>
      {/* Event Horizon */}
      <Sphere args={[8, 64, 64]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      {/* Accretion Disk */}
      <group ref={diskRef} rotation={[Math.PI / 2.5, 0, 0]}>
        <Torus args={[12, 3, 16, 100]}>
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.8} />
        </Torus>
        <Torus args={[15, 1, 16, 100]}>
          <meshBasicMaterial color="#ff5500" transparent opacity={0.5} />
        </Torus>
        <Sparkles count={2000} scale={35} size={3} speed={2} opacity={1} color="#ffffff" />
      </group>
      <Stars radius={150} depth={50} count={3000} factor={4} fade />
    </group>
  );
}

// ============================================================================
// 9. DNA HELIX THEME
// ============================================================================
function ThemeDNA() {
  const groupRef = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 200; i++) {
      const y = (i - 100) * 0.4;
      const angle = i * 0.2;
      temp.push({ pos: [Math.cos(angle)*5, y, Math.sin(angle)*5], color: '#00f2fe' });
      temp.push({ pos: [Math.cos(angle + Math.PI)*5, y, Math.sin(angle + Math.PI)*5], color: '#7f00ff' });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, Math.PI/6]}>
      {particles.map((p, i) => (
        <Sphere key={i} args={[0.3]} position={p.pos}>
          <meshBasicMaterial color={p.color} />
        </Sphere>
      ))}
    </group>
  );
}

// ============================================================================
// 10. MATRIX RAIN THEME
// ============================================================================
function ThemeMatrixRain() {
  const rainRef = useRef();
  
  const drops = useMemo(() => {
    return Array.from({ length: 150 }).map(() => ({
      x: (Math.random() - 0.5) * 100,
      y: Math.random() * 100,
      z: (Math.random() - 0.5) * 50 - 20,
      speed: Math.random() * 20 + 10,
      char: String.fromCharCode(0x30A0 + Math.random() * 96)
    }));
  }, []);

  useFrame((state, delta) => {
    if (!rainRef.current) return;
    const children = rainRef.current.children;
    children.forEach((child, i) => {
      child.position.y -= drops[i].speed * delta;
      if (child.position.y < -50) child.position.y = 50;
      // Occasionally change character
      if (Math.random() < 0.05) {
        child.text = String.fromCharCode(0x30A0 + Math.random() * 96);
      }
    });
  });

  return (
    <group ref={rainRef}>
      {drops.map((d, i) => (
        <Text key={i} position={[d.x, d.y, d.z]} color="#39ff14" fontSize={2} anchorX="center" anchorY="middle">
          {d.char}
        </Text>
      ))}
    </group>
  );
}


// ============================================================================
// GLOBAL SCENE MANAGER
// ============================================================================
const THEMES = [
  ThemeSolarSystem,
  ThemeHyperspace,
  ThemeCyberGrid,
  ThemeNeuralNet,
  ThemeParticleOcean,
  ThemeQuantumCloud,
  ThemeCrystals,
  ThemeBlackHole,
  ThemeDNA,
  ThemeMatrixRain
];

function SceneManager({ intervalSeconds = 30 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const fadeRef = useRef();

  useEffect(() => {
    const timer = setInterval(() => {
      // Start fade to black
      setNextIndex((prev) => (prev + 1) % THEMES.length);
      setFading(true);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [intervalSeconds]);

  useFrame((state, delta) => {
    if (!fadeRef.current) return;
    
    // Simple state machine for fading
    if (fading) {
      fadeRef.current.opacity += delta * 1.5; // Fade to black
      if (fadeRef.current.opacity >= 1) {
        fadeRef.current.opacity = 1;
        setCurrentIndex(nextIndex); // Swap theme while screen is black
        setFading(false); // Start fading back in
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
      
      {/* Cinematic Transition Plane (Attached strictly to camera) */}
      <Plane args={[100, 100]} position={[0, 0, -2]}>
        <meshBasicMaterial ref={fadeRef} color="#000000" transparent opacity={0} depthTest={false} />
      </Plane>
    </>
  );
}

// Camera constantly slowly panning no matter what scene it is
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
        {/* Cycle themes every 30 seconds */}
        <SceneManager intervalSeconds={30} />
      </Canvas>
    </div>
  );
}
