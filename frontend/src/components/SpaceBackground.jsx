import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Float, Trail, Ring, Sparkles, Cloud, Plane } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 1. THE BIG BANG (Violent Explosion of Everything)
// ============================================================================
function ThemeBigBang() {
  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      // Explode outward incredibly fast
      const scale = 1 + (state.clock.elapsedTime * 20); 
      particlesRef.current.scale.set(scale, scale, scale);
      particlesRef.current.rotation.y += 0.05;
      particlesRef.current.rotation.z += 0.05;
    }
  });

  return (
    <group>
      <pointLight intensity={5000} distance={500} color="#ffffff" />
      <group ref={particlesRef}>
        <Sparkles count={5000} scale={10} size={8} speed={10} color="#ffffff" />
        <Sparkles count={3000} scale={8} size={15} speed={15} color="#00ffff" />
        <Sparkles count={4000} scale={12} size={10} speed={8} color="#ff00ff" />
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
      // Move stars forward extremely fast to simulate warp speed
      starsRef.current.position.z += delta * 500;
      if (starsRef.current.position.z > 200) {
        starsRef.current.position.z = -200; // Reset
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={1} />
      <group ref={starsRef}>
        {/* Long stretching stars */}
        <Sparkles count={2000} scale={[100, 100, 500]} size={6} speed={0} color="#88ccff" />
        <Sparkles count={1000} scale={[50, 50, 800]} size={10} speed={0} color="#ffffff" />
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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Planets rushing toward each other
    const dist = Math.max(0, 20 - t * 15);
    
    if (p1Ref.current) p1Ref.current.position.x = -dist;
    if (p2Ref.current) p2Ref.current.position.x = dist;

    // Explosion debris triggers when they hit
    if (debrisRef.current) {
      if (dist === 0) {
        const explosionScale = 1 + (t - 1.3) * 50;
        debrisRef.current.scale.set(explosionScale, explosionScale, explosionScale);
        debrisRef.current.visible = true;
      } else {
        debrisRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      <Stars radius={150} depth={50} count={2000} factor={4} />
      <pointLight intensity={1000} distance={200} color="#ffaa00" />
      
      <Sphere ref={p1Ref} args={[8, 32, 32]} position={[-20, 0, 0]}>
        <meshBasicMaterial color="#3388ff" />
      </Sphere>
      
      <Sphere ref={p2Ref} args={[6, 32, 32]} position={[20, 0, 0]}>
        <meshBasicMaterial color="#ff5500" />
      </Sphere>

      {/* Explosion Debris */}
      <group ref={debrisRef}>
        <Sparkles count={3000} scale={2} size={15} speed={0} color="#ffaa00" />
        <Sparkles count={2000} scale={2} size={25} speed={0} color="#ff2200" />
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
      // Dust rushing inward rapidly
      const scale = Math.max(0.1, 1 - (t * 0.5) % 1);
      dustRef.current.scale.set(scale, scale, scale);
      dustRef.current.rotation.y += 0.2;
    }
    if (starRef.current) {
      // Star pulsing and growing
      const pulse = 1 + Math.sin(t * 10) * 0.1;
      starRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group>
      <Stars radius={150} count={1000} />
      <group ref={dustRef}>
        <Sparkles count={5000} scale={100} size={5} speed={2} color="#ff5500" />
        <Sparkles count={2000} scale={50} size={8} speed={5} color="#ffaa00" />
      </group>
      <group ref={starRef}>
        <pointLight intensity={2000} distance={100} color="#ffffff" />
        <Sphere args={[2, 32, 32]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
      </group>
    </group>
  );
}

// ============================================================================
// 5. BLACK HOLE DEVOURING A STAR (Spaghettification)
// ============================================================================
function ThemeBlackHoleDevour() {
  const streamRef = useRef();

  useFrame((state) => {
    if (streamRef.current) {
      streamRef.current.rotation.z -= 0.1; // Fast swirling
    }
  });

  return (
    <group>
      <Stars radius={150} count={2000} />
      {/* The Black Hole */}
      <Sphere args={[5, 64, 64]} position={[0,0,0]}>
        <meshBasicMaterial color="#000000" />
      </Sphere>
      <Ring args={[5.5, 8, 128]} rotation={[Math.PI/2.5, 0, 0]}>
        <meshBasicMaterial color="#ff0000" side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </Ring>
      
      {/* The dying star */}
      <Sphere args={[3, 32, 32]} position={[20, 10, 0]}>
        <meshBasicMaterial color="#ffffaa" />
      </Sphere>

      {/* Spaghettification Stream tearing rapidly into the black hole */}
      <group ref={streamRef}>
        <Sparkles count={3000} scale={[25, 2, 2]} position={[10, 5, 0]} size={10} speed={20} color="#ffaa00" />
      </group>
    </group>
  );
}

// ============================================================================
// 6. GAMMA RAY BURST (Lightning Fast Laser)
// ============================================================================
function ThemeGammaRayBurst() {
  const beamRef = useRef();

  useFrame((state) => {
    // Pulse the beam violently
    if (beamRef.current) {
      const pulse = Math.random() > 0.5 ? 2 : 0.5;
      beamRef.current.scale.y = pulse;
      beamRef.current.opacity = Math.random();
    }
  });

  return (
    <group>
      <Stars radius={150} count={2000} />
      {/* The collapsing star */}
      <Sphere args={[4, 32, 32]}>
        <meshBasicMaterial color="#00ffff" />
      </Sphere>
      
      {/* Violent Gamma Ray beam shooting across the entire screen */}
      <mesh ref={beamRef} rotation={[0, 0, Math.PI/4]}>
        <cylinderGeometry args={[2, 2, 500, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
      
      <Sparkles count={1000} scale={[500, 5, 5]} size={15} speed={50} color="#00aaff" rotation={[0, 0, Math.PI/4]} />
    </group>
  );
}

// ============================================================================
// 7. WORMHOLE TRAVEL (Falling through a dimension)
// ============================================================================
function ThemeWormholeTravel() {
  const tunnelRef = useRef();

  useFrame((state) => {
    if (tunnelRef.current) {
      tunnelRef.current.rotation.z += 0.1; // Spinning incredibly fast
      tunnelRef.current.position.z += 5; // Moving forward fast
      if (tunnelRef.current.position.z > 50) {
        tunnelRef.current.position.z = -50;
      }
    }
  });

  return (
    <group>
      <group ref={tunnelRef}>
        <Ring args={[10, 15, 128]} position={[0,0,-20]}>
          <meshBasicMaterial color="#aa00ff" side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </Ring>
        <Ring args={[5, 10, 128]} position={[0,0,-40]}>
          <meshBasicMaterial color="#00ffff" side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </Ring>
        <Sparkles count={4000} scale={[30, 30, 200]} size={8} speed={10} color="#ffffff" />
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
      // Expands aggressively and resets
      const scale = 1 + (state.clock.elapsedTime * 30) % 150;
      shockwaveRef.current.scale.set(scale, scale, scale);
      shockwaveRef.current.opacity = Math.max(0, 1 - scale/150);
    }
  });

  return (
    <group>
      <Stars radius={150} count={2000} />
      <Sphere args={[2, 32, 32]}>
        <meshBasicMaterial color="#ffffff" />
      </Sphere>
      {/* Shockwave Ring */}
      <Ring ref={shockwaveRef} args={[1, 1.2, 128]}>
        <meshBasicMaterial color="#ff0055" transparent side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </Ring>
      <Sparkles count={5000} scale={100} size={5} speed={20} color="#ff5500" />
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
      galaxyRef.current.rotation.y += 0.2; // Spinning dangerously fast
      // Particles flying outward
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
      galaxyRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group rotation={[Math.PI / 4, 0, 0]}>
      <Stars radius={150} count={2000} />
      <group ref={galaxyRef}>
        <pointLight intensity={2000} distance={100} color="#ffffff" />
        <Sphere args={[4, 32, 32]}><meshBasicMaterial color="#ffffff" /></Sphere>
        {/* Rapidly expanding violent arms */}
        <Sparkles count={5000} scale={[100, 2, 100]} size={5} speed={30} color="#00aaff" />
        <Sparkles count={2000} scale={[150, 5, 150]} size={3} speed={40} color="#ff00ff" />
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
      pulsarRef.current.rotation.z += 1; // Spinning insanely fast
      pulsarRef.current.rotation.x += 0.5;
    }
  });

  return (
    <group>
      <Stars radius={150} count={2000} />
      <group ref={pulsarRef}>
        <Sphere args={[2, 32, 32]}>
          <meshBasicMaterial color="#00ffff" />
        </Sphere>
        {/* Violent sweeping beams */}
        <mesh position={[0, 50, 0]}>
          <cylinderGeometry args={[0.5, 5, 100, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[0, -50, 0]}>
          <cylinderGeometry args={[0.5, 5, 100, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
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

function SceneManager({ intervalSeconds = 15 }) { // Switch faster for high action
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
      fadeRef.current.opacity += delta * 3; // Fade to black very fast
      if (fadeRef.current.opacity >= 1) {
        fadeRef.current.opacity = 1;
        setCurrentIndex(nextIndex); // Swap theme
        setFading(false); // Start fading in
      }
    } else {
      if (fadeRef.current.opacity > 0) {
        fadeRef.current.opacity -= delta * 3; // Fade from black very fast
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

// Dynamic, faster camera motion for action scenes
function MasterCamera() {
  const { camera } = useThree();
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    camera.position.x = Math.sin(time * 0.5) * 5; // Faster shake/pan
    camera.position.y = Math.sin(time * 0.8) * 5 + 10;
    camera.position.z = Math.cos(time * 0.5) * 5 + 60;
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
      <Canvas camera={{ position: [0, 10, 70], fov: 50 }}>
        <MasterCamera />
        <SceneManager intervalSeconds={15} />
      </Canvas>
    </div>
  );
}
