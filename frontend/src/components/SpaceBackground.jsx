import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Float, Trail, Ring, Sparkles, Cloud, Instances, Instance, Plane } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 1. EXOPLANET TRANSIT (Kepler/TESS Telescope View)
// ============================================================================
function ThemeExoplanetTransit() {
  const planetRef = useRef();
  const coronaRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (planetRef.current) {
      planetRef.current.position.x = Math.sin(t * 0.2) * 40;
      planetRef.current.position.z = Math.cos(t * 0.2) * 20 + 15;
    }
    if (coronaRef.current) {
      const scale = 1 + Math.sin(t * 5) * 0.03;
      coronaRef.current.scale.set(scale, scale, scale);
      coronaRef.current.rotation.z += 0.002;
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={3000} factor={4} saturation={1} fade speed={0.5} />
      {/* Massive Blazing Star */}
      <group position={[0, 0, -20]}>
        <pointLight intensity={5000} distance={200} decay={2} color="#ffaa00" />
        <Sphere args={[18, 64, 64]}>
          <meshBasicMaterial color="#ff5500" />
        </Sphere>
        {/* Corona glow */}
        <Sphere ref={coronaRef} args={[20, 64, 64]}>
          <meshBasicMaterial color="#ff2200" transparent opacity={0.4} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
        </Sphere>
        <Sphere args={[23, 64, 64]}>
          <meshBasicMaterial color="#ff8800" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
        </Sphere>
      </group>
      
      {/* Transiting Exoplanet (Pitch Black Silhouette) */}
      <Sphere ref={planetRef} args={[4, 32, 32]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
    </group>
  );
}

// ============================================================================
// 2. GRAVITATIONAL LENSING (Einstein Ring)
// ============================================================================
function ThemeGravitationalLens() {
  const ringRef = useRef();
  
  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z -= 0.001;
      const scale = 1 + Math.sin(state.clock.elapsedTime) * 0.02;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={8000} factor={2} saturation={0} fade speed={0.2} />
      {/* Unseen massive object (black void) */}
      <Sphere args={[15, 64, 64]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      {/* Lensed distant galaxy light (Einstein Ring) */}
      <group ref={ringRef}>
        <Ring args={[15.5, 17, 128]} rotation={[0, 0, 0]}>
          <meshBasicMaterial color="#4488ff" transparent opacity={0.8} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        <Ring args={[16, 19, 128]} rotation={[0, 0, Math.PI/4]}>
          <meshBasicMaterial color="#8844ff" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        <Sparkles count={500} scale={35} size={6} speed={0.2} color="#ffffff" />
      </group>
    </group>
  );
}

// ============================================================================
// 3. QUASAR ACCRETION DISK (M87 / Sagittarius A*)
// ============================================================================
function ThemeQuasar() {
  const diskRef = useRef();
  const jetRef = useRef();

  useFrame((state) => {
    if (diskRef.current) {
      diskRef.current.rotation.z += 0.01;
    }
    if (jetRef.current) {
      const scale = 1 + Math.random() * 0.1;
      jetRef.current.scale.y = scale;
    }
  });

  return (
    <group rotation={[Math.PI / 6, Math.PI / 4, 0]}>
      <Stars radius={150} depth={50} count={2000} factor={3} saturation={1} fade speed={1} />
      {/* Black Hole Event Horizon */}
      <Sphere args={[8, 64, 64]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      {/* Accretion Disk */}
      <group ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <Ring args={[9, 18, 128]}>
          <meshBasicMaterial color="#ff4400" transparent opacity={0.9} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        <Ring args={[18, 25, 128]}>
          <meshBasicMaterial color="#ff8800" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        <Sparkles count={1000} scale={[50, 50, 2]} size={3} speed={2} color="#ffaa00" />
      </group>
      {/* Relativistic Jets */}
      <group ref={jetRef}>
        <Cylinder args={[1, 5, 100, 32]} position={[0, 50, 0]}>
          <meshBasicMaterial color="#00aaff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </Cylinder>
        <Cylinder args={[1, 5, 100, 32]} position={[0, -50, 0]}>
          <meshBasicMaterial color="#00aaff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </Cylinder>
        <Sparkles count={500} scale={[10, 150, 10]} size={8} speed={10} color="#ffffff" />
      </group>
    </group>
  );
}
// Helper for simple geometries
function Cylinder({ args, ...props }) {
  return <mesh {...props}><cylinderGeometry args={args} /></mesh>
}

// ============================================================================
// 4. EMISSION NEBULA (JWST Pillars of Creation Style)
// ============================================================================
function ThemeEmissionNebula() {
  return (
    <group>
      <Stars radius={150} depth={50} count={4000} factor={4} saturation={1} fade speed={0.5} />
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={100} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={100} color="#ff00ff" />
      
      {/* Massive Volumetric Clouds */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={2}>
        <Cloud opacity={0.5} speed={0.4} width={50} depth={1.5} segments={20} color="#440088" position={[-15, 0, -20]} />
        <Cloud opacity={0.4} speed={0.4} width={50} depth={1.5} segments={20} color="#004488" position={[15, 10, -30]} />
        <Cloud opacity={0.6} speed={0.4} width={40} depth={1.5} segments={20} color="#aa0044" position={[0, -15, -15]} />
      </Float>

      {/* Newborn Stars inside Nebula */}
      <Sparkles count={200} scale={40} size={15} speed={0.2} color="#00ffff" />
    </group>
  );
}

// ============================================================================
// 5. PROTOPLANETARY DISK (T-Tauri Star Formation)
// ============================================================================
function ThemeProtoplanetaryDisk() {
  const diskRef = useRef();

  useFrame((state) => {
    if (diskRef.current) {
      diskRef.current.rotation.y += 0.002;
      diskRef.current.rotation.x = Math.PI / 2.5 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
      {/* Newborn Star (Infrared) */}
      <pointLight intensity={2000} distance={100} decay={2} color="#ff3300" />
      <Sphere args={[4, 32, 32]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
      <Sphere args={[5, 32, 32]}>
        <meshBasicMaterial color="#ff3300" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </Sphere>

      {/* Dusty Disk */}
      <group ref={diskRef}>
        <Ring args={[10, 30, 128]}>
          <meshBasicMaterial color="#883311" transparent opacity={0.6} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </Ring>
        <Ring args={[32, 45, 128]}>
          <meshBasicMaterial color="#552211" transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </Ring>
        {/* Planet forming in the gap */}
        <Sphere args={[1, 16, 16]} position={[31, 0, 0]}>
          <meshBasicMaterial color="#ff0000" />
        </Sphere>
        <Sparkles count={3000} scale={[90, 90, 4]} size={2} speed={0.5} color="#ff8844" />
      </group>
    </group>
  );
}

// ============================================================================
// 6. SUPERNOVA REMNANT (Crab Nebula Style)
// ============================================================================
function ThemeSupernovaRemnant() {
  const explosionRef = useRef();

  useFrame((state) => {
    if (explosionRef.current) {
      explosionRef.current.rotation.y += 0.001;
      explosionRef.current.rotation.z += 0.0005;
      const scale = 1 + (state.clock.elapsedTime * 0.01); // Slowly expanding
      explosionRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={2000} factor={2} saturation={0} fade speed={0.1} />
      {/* Central Pulsar */}
      <pointLight intensity={1000} distance={150} decay={2} color="#ffffff" />
      <Sphere args={[0.5, 16, 16]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>

      {/* Expanding Filamentary Gas */}
      <group ref={explosionRef}>
        <Sparkles count={5000} scale={40} size={4} speed={0.1} color="#ff0055" />
        <Sparkles count={3000} scale={35} size={3} speed={0.1} color="#aa00ff" />
        <Sparkles count={2000} scale={25} size={5} speed={0.1} color="#00ffff" />
      </group>
    </group>
  );
}

// ============================================================================
// 7. MAGNETAR STARQUAKE (Neutron Star)
// ============================================================================
function ThemeMagnetar() {
  const starRef = useRef();
  const burstRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (starRef.current) {
      starRef.current.rotation.y += 0.5; // Very fast spin
    }
    if (burstRef.current) {
      // Random gamma-ray bursts
      const isBursting = Math.random() > 0.98;
      burstRef.current.opacity = isBursting ? 1 : 0;
      burstRef.current.scale.set(isBursting ? 1.5 : 1, isBursting ? 1.5 : 1, isBursting ? 1.5 : 1);
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={3000} factor={2} saturation={0} fade speed={1} />
      {/* Intense core */}
      <pointLight intensity={3000} distance={100} decay={2} color="#ffffff" />
      <group ref={starRef}>
        <Sphere args={[3, 32, 32]}>
          <meshBasicMaterial color="#e0ffff" />
        </Sphere>
        {/* Magnetic field lines (simulated with rings) */}
        {[...Array(6)].map((_, i) => (
          <Ring key={i} args={[4, 4.2, 64]} rotation={[Math.PI / 2, (i * Math.PI) / 6, 0]}>
            <meshBasicMaterial color="#00ffff" transparent opacity={0.3} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </Ring>
        ))}
      </group>
      {/* Blinding Flashes */}
      <Sphere args={[30, 32, 32]}>
        <meshBasicMaterial ref={burstRef} color="#ffffff" transparent opacity={0} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </Sphere>
    </group>
  );
}

// ============================================================================
// 8. COSMIC COLLISION (Interacting Spiral Galaxies)
// ============================================================================
function ThemeCosmicCollision() {
  const g1Ref = useRef();
  const g2Ref = useRef();

  useFrame((state) => {
    if (g1Ref.current) g1Ref.current.rotation.y += 0.002;
    if (g2Ref.current) g2Ref.current.rotation.y -= 0.003;
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={2000} factor={2} saturation={0} fade speed={0.1} />
      
      {/* Galaxy 1 (Blue) */}
      <group ref={g1Ref} position={[-15, 5, -10]} rotation={[Math.PI / 3, 0, 0]}>
        <pointLight intensity={500} distance={100} color="#0088ff" />
        <Sphere args={[2, 32, 32]}><meshBasicMaterial color="#ffffff" /></Sphere>
        <Sparkles count={3000} scale={[40, 4, 40]} size={2} speed={0.2} color="#00aaff" />
        {/* Tidal Tail */}
        <Sparkles count={1000} scale={[60, 2, 10]} position={[20, 0, -10]} size={1.5} speed={0.1} color="#0066ff" />
      </group>

      {/* Galaxy 2 (Orange) */}
      <group ref={g2Ref} position={[15, -5, -20]} rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <pointLight intensity={500} distance={100} color="#ff8800" />
        <Sphere args={[1.5, 32, 32]}><meshBasicMaterial color="#ffffff" /></Sphere>
        <Sparkles count={2500} scale={[30, 3, 30]} size={2} speed={0.2} color="#ffaa00" />
        {/* Tidal Tail */}
        <Sparkles count={800} scale={[50, 2, 8]} position={[-15, 0, 10]} size={1.5} speed={0.1} color="#ff6600" />
      </group>
    </group>
  );
}

// ============================================================================
// 9. CONTACT BINARY (Roche Lobe Overflow)
// ============================================================================
function ThemeContactBinary() {
  const systemRef = useRef();

  useFrame((state) => {
    if (systemRef.current) {
      systemRef.current.rotation.y += 0.02; // Fast orbit
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={4000} factor={3} saturation={1} fade speed={0.5} />
      <ambientLight intensity={0.5} />
      
      <group ref={systemRef}>
        <pointLight intensity={2000} distance={150} color="#ffddaa" position={[0,0,0]} />
        
        {/* Star 1 (Massive, Blue-White) */}
        <Sphere args={[8, 64, 64]} position={[-6, 0, 0]} scale={[1, 1, 1.2]}>
          <meshBasicMaterial color="#aaddff" />
        </Sphere>
        
        {/* Star 2 (Smaller, Yellow) */}
        <Sphere args={[5, 64, 64]} position={[6, 0, 0]} scale={[1, 1, 1.3]}>
          <meshBasicMaterial color="#ffdd88" />
        </Sphere>

        {/* Shared Plasma Envelope (Roche Lobe) */}
        <Sparkles count={2000} scale={[25, 12, 12]} size={4} speed={2} color="#ffffff" />
        
        {/* Mass transfer stream */}
        <Sparkles count={500} scale={[15, 2, 2]} position={[0, 0, 0]} size={6} speed={5} color="#ffffaa" />
      </group>
    </group>
  );
}

// ============================================================================
// 10. ROGUE PLANET (Deep Interstellar Space)
// ============================================================================
function ThemeRoguePlanet() {
  const planetRef = useRef();

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y -= 0.0005;
    }
  });

  return (
    <group>
      {/* Faint Galactic Core in the background */}
      <Stars radius={200} depth={100} count={10000} factor={4} saturation={1} fade speed={0} />
      <Sparkles count={3000} scale={[150, 150, 20]} position={[0, 0, -80]} size={10} speed={0} color="#ffaa55" opacity={0.2} />
      
      <ambientLight intensity={0.01} />
      {/* Weak directional light simulating starlight */}
      <directionalLight position={[10, 5, -20]} intensity={0.3} color="#aaddff" />
      
      {/* Dark, Frozen Rogue Planet */}
      <Sphere ref={planetRef} args={[12, 64, 64]}>
        <meshStandardMaterial color="#11111a" roughness={0.9} metalness={0.1} />
      </Sphere>
    </group>
  );
}

// ============================================================================
// SCENE MANAGER & THEME REGISTRY
// ============================================================================

const THEMES = [
  ThemeExoplanetTransit,
  ThemeGravitationalLens,
  ThemeQuasar,
  ThemeEmissionNebula,
  ThemeProtoplanetaryDisk,
  ThemeSupernovaRemnant,
  ThemeMagnetar,
  ThemeCosmicCollision,
  ThemeContactBinary,
  ThemeRoguePlanet
];

function SceneManager({ intervalSeconds = 30 }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
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
