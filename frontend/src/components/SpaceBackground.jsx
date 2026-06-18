import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Ring, Sparkles, Cloud, Float, Plane } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 1. THE COSMIC WEB (See the entire universe at once)
// ============================================================================
function ThemeCosmicWeb() {
  const webRef = useRef();

  useFrame((state) => {
    if (webRef.current) {
      webRef.current.rotation.y += 0.0005; // Extremely slow, majestic rotation
      webRef.current.rotation.x += 0.0002;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <group ref={webRef}>
        {/* Massive interconnected structure representing the observable universe */}
        <Sparkles count={5000} scale={[200, 200, 200]} size={8} speed={0.1} color="#4488ff" opacity={0.6} blending={THREE.AdditiveBlending} />
        <Sparkles count={3000} scale={[180, 180, 180]} size={15} speed={0.05} color="#aa44ff" opacity={0.4} blending={THREE.AdditiveBlending} />
        <Sparkles count={2000} scale={[150, 150, 150]} size={25} speed={0.02} color="#ffffff" opacity={0.8} blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 2. DEEP FIELD GALAXIES (Hubble Deep Field)
// ============================================================================
function ThemeDeepField() {
  const fieldRef = useRef();
  
  useFrame((state) => {
    if (fieldRef.current) {
      // Extremely slow zoom into deep space
      fieldRef.current.position.z += 0.02;
    }
  });

  return (
    <group ref={fieldRef}>
      {/* Background stars */}
      <Stars radius={300} depth={100} count={10000} factor={3} saturation={1} fade speed={0.1} />
      {/* Foreground glowing galaxies scattered calmly */}
      <Sparkles count={200} scale={[150, 150, 100]} position={[0, 0, -50]} size={150} speed={0} color="#ffccaa" opacity={0.1} blending={THREE.AdditiveBlending} />
      <Sparkles count={300} scale={[200, 200, 150]} position={[0, 0, -80]} size={100} speed={0} color="#aaccff" opacity={0.1} blending={THREE.AdditiveBlending} />
    </group>
  );
}

// ============================================================================
// 3. CALM NEBULA (Peaceful Space Clouds)
// ============================================================================
function ThemeCalmNebula() {
  return (
    <group>
      <Stars radius={150} depth={50} count={3000} factor={4} saturation={1} fade speed={0.1} />
      <ambientLight intensity={0.3} />
      <pointLight position={[20, 20, 10]} intensity={50} color="#00ffff" />
      <pointLight position={[-20, -20, -10]} intensity={50} color="#ff00ff" />
      
      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Cloud opacity={0.3} speed={0.1} width={80} depth={2} segments={30} color="#220044" position={[-10, 5, -30]} />
        <Cloud opacity={0.2} speed={0.1} width={100} depth={2} segments={30} color="#002244" position={[10, -5, -40]} />
      </Float>
    </group>
  );
}

// ============================================================================
// 4. MILKY WAY CORE (Majestic Galactic Center)
// ============================================================================
function ThemeMilkyWayCore() {
  const coreRef = useRef();

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.001; // Slow, grand rotation
    }
  });

  return (
    <group rotation={[Math.PI / 8, 0, 0]}>
      <Stars radius={150} depth={50} count={5000} factor={3} saturation={0.5} fade speed={0.1} />
      <group ref={coreRef}>
        {/* Core glow */}
        <pointLight intensity={1000} distance={200} color="#ffddaa" />
        <Sphere args={[10, 64, 64]}><meshBasicMaterial color="#ffddaa" transparent opacity={0.1} blending={THREE.AdditiveBlending} /></Sphere>
        {/* Dust lanes */}
        <Sparkles count={5000} scale={[120, 10, 120]} size={10} speed={0.1} color="#ffaa55" opacity={0.3} blending={THREE.AdditiveBlending} />
        <Sparkles count={4000} scale={[150, 15, 150]} size={6} speed={0.1} color="#aaddff" opacity={0.4} blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 5. GENTLE HYPERSPACE (Relaxing Drift)
// ============================================================================
function ThemeGentleHyperspace() {
  const tunnelRef = useRef();

  useFrame((state) => {
    if (tunnelRef.current) {
      tunnelRef.current.position.z += 0.5; // Very smooth, calming forward motion
      if (tunnelRef.current.position.z > 50) {
        tunnelRef.current.position.z = -50;
      }
    }
  });

  return (
    <group>
      <group ref={tunnelRef}>
        <Sparkles count={5000} scale={[50, 50, 200]} size={4} speed={0} color="#ffffff" opacity={0.5} blending={THREE.AdditiveBlending} />
        <Sparkles count={2000} scale={[30, 30, 150]} size={8} speed={0} color="#88ccff" opacity={0.8} blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 6. AURORA BOREALIS IN SPACE (Cosmic Ribbons)
// ============================================================================
function ThemeSpaceAurora() {
  const auroraRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (auroraRef.current) {
      auroraRef.current.position.y = Math.sin(t * 0.2) * 5; // Gentle floating
      auroraRef.current.rotation.z = Math.sin(t * 0.1) * 0.1;
    }
  });

  return (
    <group>
      <Stars radius={150} count={3000} />
      <group ref={auroraRef} position={[0, -10, -20]}>
        <Cloud opacity={0.4} speed={0.2} width={100} depth={1} segments={40} color="#00ff88" />
        <Cloud opacity={0.3} speed={0.3} width={120} depth={1} segments={40} color="#0088ff" position={[0, 5, -5]} />
      </group>
    </group>
  );
}

// ============================================================================
// 7. MAJESTIC EVENT HORIZON (Silent Black Hole)
// ============================================================================
function ThemeEventHorizon() {
  const diskRef = useRef();

  useFrame(() => {
    if (diskRef.current) {
      diskRef.current.rotation.z += 0.002; // Very slow, ominous rotation
    }
  });

  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      <Stars radius={150} count={4000} speed={0.1} />
      {/* Pure black void */}
      <Sphere args={[8, 64, 64]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      {/* Calm glowing ring */}
      <group ref={diskRef} rotation={[Math.PI / 2, 0, 0]}>
        <Ring args={[8.5, 15, 128]}>
          <meshBasicMaterial color="#ffaa55" transparent opacity={0.4} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </Ring>
        <Sparkles count={2000} scale={[30, 30, 2]} size={3} speed={0.5} color="#ffffff" opacity={0.5} />
      </group>
    </group>
  );
}

// ============================================================================
// 8. PEACEFUL BINARY STARS (A slow, elegant dance)
// ============================================================================
function ThemePeacefulBinary() {
  const systemRef = useRef();

  useFrame(() => {
    if (systemRef.current) {
      systemRef.current.rotation.y += 0.003; // Elegant, slow orbit
    }
  });

  return (
    <group>
      <Stars radius={150} count={3000} />
      <ambientLight intensity={0.5} />
      <group ref={systemRef}>
        {/* Star 1 */}
        <pointLight position={[-15, 0, 0]} intensity={1000} color="#aaccff" distance={100} />
        <Sphere args={[4, 64, 64]} position={[-15, 0, 0]}>
          <meshBasicMaterial color="#aaccff" />
        </Sphere>
        <Sparkles count={500} scale={[12, 12, 12]} position={[-15, 0, 0]} size={8} speed={0.2} color="#ffffff" opacity={0.3} blending={THREE.AdditiveBlending} />

        {/* Star 2 */}
        <pointLight position={[15, 0, 0]} intensity={800} color="#ffccaa" distance={100} />
        <Sphere args={[3, 64, 64]} position={[15, 0, 0]}>
          <meshBasicMaterial color="#ffccaa" />
        </Sphere>
        <Sparkles count={500} scale={[10, 10, 10]} position={[15, 0, 0]} size={8} speed={0.2} color="#ffffff" opacity={0.3} blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 9. PLANETARY RINGS (Floating above a giant)
// ============================================================================
function ThemePlanetaryRings() {
  const ringsRef = useRef();

  useFrame(() => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z += 0.001; // Barely moving, massive scale
    }
  });

  return (
    <group rotation={[Math.PI / 8, Math.PI / 6, 0]} position={[20, -10, -40]}>
      <Stars radius={200} count={5000} speed={0.1} />
      <pointLight intensity={1000} position={[-50, 50, 50]} color="#ffffff" />
      
      {/* Gas Giant Planet */}
      <Sphere args={[40, 64, 64]}>
        <meshStandardMaterial color="#334455" roughness={0.8} />
      </Sphere>

      {/* Massive Majestic Rings */}
      <group ref={ringsRef} rotation={[Math.PI / 2, 0, 0]}>
        <Ring args={[45, 80, 128]}>
          <meshStandardMaterial color="#8899aa" transparent opacity={0.4} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </Ring>
        <Sparkles count={5000} scale={[160, 160, 1]} size={2} speed={0.1} color="#ffffff" opacity={0.6} />
      </group>
    </group>
  );
}

// ============================================================================
// 10. DEEP SPACE SILENCE (Lonely, calm void)
// ============================================================================
function ThemeDeepSpaceSilence() {
  return (
    <group>
      {/* Extremely vast, slow, faint starfield */}
      <Stars radius={300} depth={200} count={15000} factor={2} saturation={0} fade speed={0.05} />
      <ambientLight intensity={0.1} />
      
      {/* Gentle, almost invisible background glow */}
      <Sparkles count={1000} scale={[200, 200, 200]} size={30} speed={0.02} color="#ffffff" opacity={0.05} blending={THREE.AdditiveBlending} />
    </group>
  );
}

// ============================================================================
// SCENE MANAGER & THEME REGISTRY
// ============================================================================

const THEMES = [
  ThemeCosmicWeb,
  ThemeDeepField,
  ThemeCalmNebula,
  ThemeMilkyWayCore,
  ThemeGentleHyperspace,
  ThemeSpaceAurora,
  ThemeEventHorizon,
  ThemePeacefulBinary,
  ThemePlanetaryRings,
  ThemeDeepSpaceSilence
];

function SceneManager({ intervalSeconds = 45 }) { // Slow, calm transitions (45s)
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
      fadeRef.current.opacity += delta * 0.5; // Very slow, peaceful fade to black
      if (fadeRef.current.opacity >= 1) {
        fadeRef.current.opacity = 1;
        setCurrentIndex(nextIndex); // Swap theme
        setFading(false); // Start fading in
      }
    } else {
      if (fadeRef.current.opacity > 0) {
        fadeRef.current.opacity -= delta * 0.5; // Very slow fade from black
        if (fadeRef.current.opacity <= 0) fadeRef.current.opacity = 0;
      }
    }
  });

  const ActiveTheme = THEMES[currentIndex];

  return (
    <>
      <ActiveTheme />
      <Plane args={[200, 200]} position={[0, 0, -2]}>
        <meshBasicMaterial ref={fadeRef} color="#000000" transparent opacity={0} depthTest={false} />
      </Plane>
    </>
  );
}

// Majestic, incredibly slow camera panning
function MasterCamera() {
  const { camera } = useThree();
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Very gentle, wide panning to survey the vastness
    camera.position.x = Math.sin(time * 0.05) * 5; 
    camera.position.y = Math.sin(time * 0.03) * 5 + 10;
    camera.position.z = Math.cos(time * 0.04) * 5 + 60;
    
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
      background: '#010103', // Deep, calm space color
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [0, 10, 70], fov: 45 }}>
        <MasterCamera />
        <SceneManager intervalSeconds={45} />
      </Canvas>
    </div>
  );
}
