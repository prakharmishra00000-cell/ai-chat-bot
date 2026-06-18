import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sphere, Float, Trail, Instance, Instances, Ring } from '@react-three/drei';
import * as THREE from 'three';

// --- CAMERA CONTROLLER ---
// Smoothly flies the camera to track the active planet while it orbits
function CameraRig({ targetMode, planetsData }) {
  const { camera } = useThree();
  const vec = new THREE.Vector3();
  const targetPos = new THREE.Vector3();
  
  useFrame((state, delta) => {
    // Determine which object to follow based on mode
    let targetPlanet = null;
    let cameraOffset = new THREE.Vector3(0, 0, 0);

    if (targetMode === 'normal' || !targetMode) {
      // Home view: look at Sun, camera pulls back
      targetPos.set(0, 0, 0);
      
      // Slowly rotate the home camera around the sun
      const time = state.clock.getElapsedTime();
      cameraOffset.set(
        Math.sin(time * 0.05) * 80,
        40,
        Math.cos(time * 0.05) * 80
      );
    } else {
      // Find the specific planet assigned to this mode
      targetPlanet = planetsData.find(p => p.mode === targetMode) || planetsData[0];
      if (targetPlanet && targetPlanet.ref.current) {
        // Get the planet's current world position (it's moving!)
        targetPlanet.ref.current.getWorldPosition(targetPos);
        
        // Dynamic camera offset based on planet size
        const dist = targetPlanet.size * 5 + 10;
        
        // Calculate an offset that orbits slightly behind and above the planet
        const time = state.clock.getElapsedTime();
        cameraOffset.set(
          Math.sin(time * 0.2) * dist,
          dist * 0.5,
          Math.cos(time * 0.2) * dist
        );
      } else {
        targetPos.set(0,0,0);
        cameraOffset.set(0, 40, 80);
      }
    }

    // Smoothly interpolate camera position towards the target + offset
    vec.copy(targetPos).add(cameraOffset);
    camera.position.lerp(vec, 0.05); // Speed of camera movement

    // Smoothly interpolate camera lookAt towards the target
    const currentLookAt = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).add(camera.position);
    currentLookAt.lerp(targetPos, 0.05);
    camera.lookAt(currentLookAt);
  });
  
  return null;
}

// --- PLANET COMPONENT ---
function OrbitingPlanet({ data }) {
  const meshRef = useRef();
  
  // Store ref in the data object so the camera can track its exact position
  useEffect(() => {
    data.ref = meshRef;
  }, [data]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // 1. Orbit around the sun
    const t = state.clock.getElapsedTime() * data.orbitSpeed;
    meshRef.current.position.x = Math.cos(t) * data.distance;
    meshRef.current.position.z = Math.sin(t) * data.distance;
    
    // 2. Rotate on its own axis
    meshRef.current.rotation.y += data.rotationSpeed;
  });

  return (
    <group ref={meshRef}>
      {/* The Planet */}
      <Sphere args={[data.size, 64, 64]}>
        <meshStandardMaterial 
          color={data.color} 
          roughness={data.roughness || 0.5} 
          metalness={data.metalness || 0.2}
          emissive={data.emissive || '#000000'}
          emissiveIntensity={data.emissiveIntensity || 0}
        />
      </Sphere>

      {/* Optional Rings (like Saturn) */}
      {data.hasRings && (
        <Ring args={[data.size * 1.4, data.size * 2.2, 64]} rotation={[-Math.PI / 2.2, 0, 0]}>
          <meshStandardMaterial color={data.ringColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </Ring>
      )}

      {/* Orbit Trail */}
      <Trail width={data.size * 0.5} length={20} color={data.color} attenuation={(t) => t * t}>
        <Sphere args={[0.01]} visible={false} />
      </Trail>
    </group>
  );
}

// --- SUN COMPONENT ---
function Sun() {
  const sunRef = useRef();
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += 0.005;
      // Pulsating glow effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      sunRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={sunRef}>
      <pointLight position={[0, 0, 0]} intensity={2000} distance={1000} decay={2} color="#ffffff" />
      <Sphere args={[8, 64, 64]}>
        <meshBasicMaterial color="#ffcc00" />
      </Sphere>
      {/* Outer Glow */}
      <Sphere args={[8.5, 32, 32]}>
        <meshBasicMaterial color="#ff6600" transparent opacity={0.3} side={THREE.BackSide} />
      </Sphere>
      <Sphere args={[9.5, 32, 32]}>
        <meshBasicMaterial color="#ff0000" transparent opacity={0.1} side={THREE.BackSide} />
      </Sphere>
    </group>
  );
}


// --- MAIN BACKGROUND COMPONENT ---
export default function SpaceBackground({ currentMode }) {
  // Define our celestial bodies mapped to specific UI modes
  const planetsData = useMemo(() => [
    {
      mode: 'matrix_simulation', // Deep analysis -> Gas Giant
      name: 'Saturn',
      color: '#e2bf7d',
      size: 4,
      distance: 35,
      orbitSpeed: 0.15,
      rotationSpeed: 0.01,
      hasRings: true,
      ringColor: '#a8946c',
      ref: React.createRef()
    },
    {
      mode: 'optimize', // Optimization -> Earth (Life/Growth)
      name: 'Earth',
      color: '#2b82c9',
      size: 2.5,
      distance: 20,
      orbitSpeed: 0.3,
      rotationSpeed: 0.02,
      roughness: 0.8,
      ref: React.createRef()
    },
    {
      mode: 'generate', // Creation -> Mars (Industry/Forge)
      name: 'Mars',
      color: '#c1440e',
      size: 1.8,
      distance: 14,
      orbitSpeed: 0.4,
      rotationSpeed: 0.03,
      roughness: 0.9,
      ref: React.createRef()
    },
    {
      mode: 'council', // Council -> Mysterious Purple Planet
      name: 'Nebula',
      color: '#7f00ff',
      size: 3.5,
      distance: 50,
      orbitSpeed: 0.08,
      rotationSpeed: 0.005,
      emissive: '#3a0088',
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8,
      ref: React.createRef()
    },
    {
      mode: 'workflow', // Workflow -> Frozen Ice World
      name: 'Ice',
      color: '#00f2fe',
      size: 2,
      distance: 65,
      orbitSpeed: 0.05,
      rotationSpeed: 0.015,
      roughness: 0.1,
      metalness: 0.5,
      ref: React.createRef()
    }
  ], []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: -1,
      background: '#020205', // Deep space black
      overflow: 'hidden'
    }}>
      <Canvas camera={{ position: [0, 40, 80], fov: 45 }}>
        {/* Deep Space Atmosphere */}
        <ambientLight intensity={0.05} />
        <Stars radius={100} depth={50} count={7000} factor={6} saturation={0} fade speed={1} />
        <Stars radius={150} depth={50} count={3000} factor={4} saturation={1} fade speed={2} color="#7f00ff" />
        
        <Sun />

        {/* Render all planets */}
        {planetsData.map((planet, idx) => (
          <OrbitingPlanet key={idx} data={planet} />
        ))}

        {/* Dynamic Camera Controller */}
        <CameraRig targetMode={currentMode} planetsData={planetsData} />
        
        {/* Add fog for depth */}
        <fog attach="fog" args={['#020205', 30, 200]} />
      </Canvas>
    </div>
  );
}
