import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Ring, Sparkles, Plane } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 1. THE BIG BANG (Violent Explosion of Everything)
// ============================================================================
function ThemeBigBang() {
  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      // Explode outward incredibly fast (Aggressive Scaling)
      const scale = 1 + (state.clock.elapsedTime * 150); 
      particlesRef.current.scale.set(scale, scale, scale);
      particlesRef.current.rotation.y += 0.5;
      particlesRef.current.rotation.z += 0.5;
    }
  });

  return (
    <group>
      <pointLight intensity={10000} distance={1000} color="#ffffff" />
      <group ref={particlesRef}>
        <Sparkles count={8000} scale={15} size={15} speed={50} color="#ffffff" blending={THREE.AdditiveBlending} />
        <Sparkles count={5000} scale={12} size={25} speed={80} color="#00ffff" blending={THREE.AdditiveBlending} />
        <Sparkles count={6000} scale={18} size={20} speed={40} color="#ff00ff" blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 2. WARP SPEED (Lightning Fast Movement)
// ============================================================================
function ThemeWarpSpeed() {
  const starsRef = useRef();
  
  useFrame((state, delta) => {
    if (starsRef.current) {
      // Move stars forward extremely fast to simulate warp speed (Aggressive Speed)
      starsRef.current.position.z += delta * 3000;
      if (starsRef.current.position.z > 1000) {
        starsRef.current.position.z = -1000; // Reset
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={2} />
      <group ref={starsRef}>
        {/* Long stretching stars, massive scale */}
        <Sparkles count={5000} scale={[200, 200, 2000]} size={15} speed={0} color="#88ccff" blending={THREE.AdditiveBlending} />
        <Sparkles count={3000} scale={[100, 100, 3000]} size={25} speed={0} color="#ffffff" blending={THREE.AdditiveBlending} />
        <Sparkles count={2000} scale={[50, 50, 5000]} size={40} speed={0} color="#ff0055" blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 3. PLANETARY COLLISION (Violent Impact)
// ============================================================================
function ThemePlanetaryCollision() {
  const p1Ref = useRef();
  const p2Ref = useRef();
  const debrisRef = useRef();
  const flashRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Planets rushing toward each other at INSANE speeds
    const dist = Math.max(0, 50 - t * 80);
    
    if (p1Ref.current) p1Ref.current.position.x = -dist;
    if (p2Ref.current) p2Ref.current.position.x = dist;

    // Explosion debris triggers when they hit
    if (dist === 0) {
      if (debrisRef.current) {
        const explosionScale = 1 + (t - (50/80)) * 250;
        debrisRef.current.scale.set(explosionScale, explosionScale, explosionScale);
        debrisRef.current.visible = true;
      }
      if (flashRef.current) {
        flashRef.current.intensity = Math.max(0, 5000 - (t - (50/80)) * 5000);
      }
    } else {
      if (debrisRef.current) debrisRef.current.visible = false;
      if (flashRef.current) flashRef.current.intensity = 0;
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={2000} factor={4} />
      <pointLight ref={flashRef} intensity={0} distance={500} color="#ffffff" />
      
      <Sphere ref={p1Ref} args={[8, 32, 32]} position={[-50, 0, 0]}>
        <meshBasicMaterial color="#3388ff" />
      </Sphere>
      
      <Sphere ref={p2Ref} args={[6, 32, 32]} position={[50, 0, 0]}>
        <meshBasicMaterial color="#ff5500" />
      </Sphere>

      {/* Extreme Explosion Debris */}
      <group ref={debrisRef} visible={false}>
        <Sparkles count={5000} scale={4} size={30} speed={0} color="#ffaa00" blending={THREE.AdditiveBlending} />
        <Sparkles count={4000} scale={5} size={50} speed={0} color="#ff2200" blending={THREE.AdditiveBlending} />
        <Sparkles count={2000} scale={3} size={80} speed={0} color="#ffffff" blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 4. STAR FORMATION (Rapid Coalescence)
// ============================================================================
function ThemeStarFormation() {
  const dustRef = useRef();
  const starRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (dustRef.current) {
      // Dust rushing inward VIOLENTLY
      const scale = Math.max(0.01, 1 - (t * 2) % 1);
      dustRef.current.scale.set(scale, scale, scale);
      dustRef.current.rotation.y += 1.5;
      dustRef.current.rotation.x += 1.5;
    }
    if (starRef.current) {
      // Star pulsing violently
      const pulse = 1 + Math.sin(t * 50) * 0.5;
      starRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group>
      <Stars radius={150} count={2000} />
      <group ref={dustRef}>
        <Sparkles count={8000} scale={200} size={15} speed={10} color="#ff5500" blending={THREE.AdditiveBlending} />
        <Sparkles count={5000} scale={100} size={25} speed={20} color="#ffaa00" blending={THREE.AdditiveBlending} />
      </group>
      <group ref={starRef}>
        <pointLight intensity={5000} distance={200} color="#ffffff" />
        <Sphere args={[3, 32, 32]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
      </group>
    </group>
  );
}

// ============================================================================
// 5. BLACK HOLE DEVOURING A STAR (Violent Spaghettification)
// ============================================================================
function ThemeBlackHoleDevour() {
  const streamRef = useRef();
  const starRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (streamRef.current) {
      streamRef.current.rotation.z -= 1.5; // INSANE swirling
      streamRef.current.scale.set(1 + Math.sin(t*10)*0.2, 1, 1);
    }
    if (starRef.current) {
      // Star shaking violently as it dies
      starRef.current.position.y = 10 + Math.sin(t*50)*0.5;
      starRef.current.position.x = 20 + Math.cos(t*50)*0.5;
    }
  });

  return (
    <group>
      <Stars radius={150} count={3000} speed={5} />
      {/* The Black Hole */}
      <Sphere args={[6, 64, 64]} position={[0,0,0]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      <Ring args={[6.5, 10, 128]} rotation={[Math.PI/2.5, 0, 0]}>
        <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </Ring>
      
      {/* The dying star */}
      <Sphere ref={starRef} args={[4, 32, 32]} position={[20, 10, 0]}>
        <meshBasicMaterial color="#ffffaa" />
      </Sphere>

      {/* Massive Spaghettification Stream tearing rapidly into the black hole */}
      <group ref={streamRef}>
        <Sparkles count={8000} scale={[30, 5, 5]} position={[12, 6, 0]} size={20} speed={100} color="#ff3300" blending={THREE.AdditiveBlending} />
        <Sparkles count={4000} scale={[25, 2, 2]} position={[10, 5, 0]} size={30} speed={150} color="#ffaa00" blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 6. GAMMA RAY BURST (Blinding Lightning Fast Laser)
// ============================================================================
function ThemeGammaRayBurst() {
  const beamRef = useRef();

  useFrame((state) => {
    // Pulse the beam violently and rapidly
    if (beamRef.current) {
      const pulse = Math.random() > 0.2 ? 5 : 0.5;
      beamRef.current.scale.x = pulse;
      beamRef.current.scale.z = pulse;
      beamRef.current.opacity = Math.random();
    }
  });

  return (
    <group>
      <Stars radius={150} count={3000} speed={10} />
      {/* The collapsing star */}
      <Sphere args={[5, 32, 32]}>
        <meshBasicMaterial color="#00ffff" />
      </Sphere>
      
      {/* EXTREME Gamma Ray beam shooting across the entire screen */}
      <mesh ref={beamRef} rotation={[0, 0, Math.PI/4]}>
        <cylinderGeometry args={[4, 4, 1000, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>
      
      <Sparkles count={5000} scale={[1000, 10, 10]} size={30} speed={200} color="#00aaff" rotation={[0, 0, Math.PI/4]} blending={THREE.AdditiveBlending} />
    </group>
  );
}

// ============================================================================
// 7. WORMHOLE TRAVEL (Violent fall through a dimension)
// ============================================================================
function ThemeWormholeTravel() {
  const tunnelRef = useRef();

  useFrame((state) => {
    if (tunnelRef.current) {
      tunnelRef.current.rotation.z += 0.8; // Spinning incredibly fast
      tunnelRef.current.position.z += 50; // Moving forward insanely fast
      if (tunnelRef.current.position.z > 200) {
        tunnelRef.current.position.z = -200;
      }
    }
  });

  return (
    <group>
      <group ref={tunnelRef}>
        {[...Array(20)].map((_, i) => (
          <Ring key={i} args={[10 + i, 12 + i, 128]} position={[0, 0, -i * 20]}>
            <meshBasicMaterial color={`hsl(${(i * 20) % 360}, 100%, 50%)`} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </Ring>
        ))}
        <Sparkles count={10000} scale={[50, 50, 800]} size={20} speed={50} color="#ffffff" blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 8. MASSIVE SUPERNOVA (Violent Expanding Shockwave)
// ============================================================================
function ThemeSupernovaShockwave() {
  const shockwaveRef = useRef();

  useFrame((state) => {
    if (shockwaveRef.current) {
      // Expands aggressively fast and resets
      const scale = 1 + (state.clock.elapsedTime * 150) % 300;
      shockwaveRef.current.scale.set(scale, scale, scale);
      shockwaveRef.current.opacity = Math.max(0, 1 - scale/300);
    }
  });

  return (
    <group>
      <Stars radius={150} count={3000} speed={5} />
      <Sphere args={[3, 32, 32]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
      {/* Hyper Shockwave Ring */}
      <Ring ref={shockwaveRef} args={[1, 1.5, 128]}>
        <meshBasicMaterial color="#ff0055" transparent side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </Ring>
      <Sparkles count={8000} scale={200} size={15} speed={100} color="#ff5500" blending={THREE.AdditiveBlending} />
    </group>
  );
}

// ============================================================================
// 9. GALAXY TEARING APART (Spinning out of control)
// ============================================================================
function ThemeGalaxyTear() {
  const galaxyRef = useRef();

  useFrame((state) => {
    if (galaxyRef.current) {
      galaxyRef.current.rotation.y += 1.5; // Spinning dangerously fast
      // Particles flying outward violently
      const scale = 1 + (state.clock.elapsedTime * 10) % 10;
      galaxyRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      <Stars radius={150} count={3000} speed={5} />
      <group ref={galaxyRef}>
        <pointLight intensity={5000} distance={200} color="#ffffff" />
        <Sphere args={[6, 32, 32]}><meshBasicMaterial color="#ffffff" /></Sphere>
        {/* Rapidly expanding violent arms */}
        <Sparkles count={8000} scale={[200, 5, 200]} size={15} speed={150} color="#00aaff" blending={THREE.AdditiveBlending} />
        <Sparkles count={5000} scale={[300, 10, 300]} size={10} speed={200} color="#ff00ff" blending={THREE.AdditiveBlending} />
      </group>
    </group>
  );
}

// ============================================================================
// 10. NEUTRON STAR PULSAR (Machine-gun light beams)
// ============================================================================
function ThemeRapidPulsar() {
  const pulsarRef = useRef();

  useFrame((state) => {
    if (pulsarRef.current) {
      pulsarRef.current.rotation.z += 3; // Spinning insanely fast (like a blade)
      pulsarRef.current.rotation.x += 1.5;
    }
  });

  return (
    <group>
      <Stars radius={150} count={4000} speed={10} />
      <group ref={pulsarRef}>
        <Sphere args={[3, 32, 32]}>
          <meshBasicMaterial color="#00ffff" />
        </Sphere>
        {/* Violent sweeping beams acting like a circular saw */}
        <mesh position={[0, 100, 0]}>
          <cylinderGeometry args={[2, 10, 200, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -100, 0]}>
          <cylinderGeometry args={[2, 10, 200, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// SCENE MANAGER & THEME REGISTRY
// ============================================================================

const THEMES = [
  ThemeBigBang,
  ThemeWarpSpeed,
  ThemePlanetaryCollision,
  ThemeStarFormation,
  ThemeBlackHoleDevour,
  ThemeGammaRayBurst,
  ThemeWormholeTravel,
  ThemeSupernovaShockwave,
  ThemeGalaxyTear,
  ThemeRapidPulsar
];

function SceneManager({ intervalSeconds = 8 }) { // Extremely fast theme switching (8s)
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
      fadeRef.current.opacity += delta * 10; // Blink transition (virtually instant)
      if (fadeRef.current.opacity >= 1) {
        fadeRef.current.opacity = 1;
        setCurrentIndex(nextIndex); // Swap theme
        setFading(false); // Start fading in
      }
    } else {
      if (fadeRef.current.opacity > 0) {
        fadeRef.current.opacity -= delta * 10;
        if (fadeRef.current.opacity <= 0) fadeRef.current.opacity = 0;
      }
    }
  });

  const ActiveTheme = THEMES[currentIndex];

  return (
    <>
      <ActiveTheme />
      <Plane args={[200, 200]} position={[0, 0, -2]}>
        <meshBasicMaterial ref={fadeRef} color="#ffffff" transparent opacity={0} depthTest={false} blending={THREE.AdditiveBlending} />
      </Plane>
    </>
  );
}

// Extremely violent camera shake and fast panning
function MasterCamera() {
  const { camera } = useThree();
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Aggressive fast pan
    camera.position.x = Math.sin(time * 2) * 15; 
    camera.position.y = Math.sin(time * 3) * 15 + 10;
    camera.position.z = Math.cos(time * 2) * 15 + 60;
    
    // Violent high-frequency camera shake
    camera.position.x += (Math.random() - 0.5) * 2;
    camera.position.y += (Math.random() - 0.5) * 2;
    camera.position.z += (Math.random() - 0.5) * 2;
    
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
      background: '#000000', 
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [0, 10, 70], fov: 60 }}>
        <MasterCamera />
        <SceneManager intervalSeconds={8} />
      </Canvas>
    </div>
  );
}
