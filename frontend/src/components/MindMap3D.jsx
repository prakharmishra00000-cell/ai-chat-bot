import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------------------------------
// MERMAID SYNTAX PARSER FOR 3D GRAPH EXTRACTION
// ----------------------------------------------------------------------------
function parseMermaidToGraph(chartCode) {
  const nodes = [];
  const links = [];
  const lines = chartCode.split('\n');
  const nodeMap = new Map();

  let isMindmap = chartCode.includes('mindmap');

  if (isMindmap) {
    let lastNodesAtLevel = [];
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'mindmap') return;

      const indent = line.length - line.trimStart().length;
      const level = Math.floor(indent / 2);

      let label = trimmed;
      let id = trimmed.replace(/[^a-zA-Z0-9]/g, '_');

      const matchShape = trimmed.match(/^([a-zA-Z0-9_-]+)\s*[\(\[\{]+"?([^\)\]\}]+)"?[\)\]\}]+/);
      if (matchShape) {
        id = matchShape[1];
        label = matchShape[2];
      } else {
        label = trimmed.replace(/^[\s\-\+\*]+/g, '').trim();
        id = label.replace(/[^a-zA-Z0-9]/g, '_');
      }

      if (!id || !label) return;

      const node = { id, label, level };
      nodes.push(node);
      nodeMap.set(id, node);

      lastNodesAtLevel[level] = id;
      if (level > 0 && lastNodesAtLevel[level - 1]) {
        links.push({ source: lastNodesAtLevel[level - 1], target: id });
      }
    });
  } else {
    // Flowchart parser
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('graph') || trimmed.startsWith('flowchart')) return;

      const parts = trimmed.split(/-->|==>|-.->|--/);
      if (parts.length >= 2) {
        let prevId = null;
        parts.forEach((part, idx) => {
          let cleanPart = part.trim();
          if (cleanPart.startsWith('>') || cleanPart.startsWith('-') || cleanPart.includes('text')) return;

          const matchNode = cleanPart.match(/^([a-zA-Z0-9_-]+)\s*[\(\[\{]+"?([^\)\]\}]+)"?[\)\]\}]+/);
          let id, label;
          if (matchNode) {
            id = matchNode[1];
            label = matchNode[2];
          } else {
            id = cleanPart.replace(/[^a-zA-Z0-9_-]/g, '');
            label = cleanPart;
          }

          if (!id) return;

          if (!nodeMap.has(id)) {
            const node = { id, label: label || id, level: idx };
            nodes.push(node);
            nodeMap.set(id, node);
          }

          if (prevId) {
            links.push({ source: prevId, target: id });
          }
          prevId = id;
        });
      } else {
        const matchNode = trimmed.match(/^([a-zA-Z0-9_-]+)\s*[\(\[\{]+"?([^\)\]\}]+)"?[\)\]\}]+/);
        if (matchNode) {
          const id = matchNode[1];
          const label = matchNode[2];
          if (!nodeMap.has(id)) {
            const node = { id, label, level: 0 };
            nodes.push(node);
            nodeMap.set(id, node);
          }
        }
      }
    });
  }

  if (nodes.length === 0) {
    nodes.push({ id: 'root', label: 'Mind Map', level: 0 });
  }

  return { nodes, links };
}

// ----------------------------------------------------------------------------
// SPHERICAL TREE LAYOUT POSITION COMPUTER
// ----------------------------------------------------------------------------
const computePositions = (nodes, links) => {
  const positions = {};
  const childrenMap = {};
  
  links.forEach(l => {
    if (!childrenMap[l.source]) childrenMap[l.source] = [];
    childrenMap[l.source].push(l.target);
  });

  const root = nodes.find(n => n.level === 0) || nodes[0];
  if (!root) return {};

  positions[root.id] = [0, 0, 0];

  const layoutNode = (nodeId, level, parentPos) => {
    const children = childrenMap[nodeId] || [];
    if (children.length === 0) return;

    const count = children.length;
    const radius = level === 1 ? 14 : 7;

    children.forEach((childId, idx) => {
      const phi = Math.acos(-1 + (2 * idx) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;

      const x = parentPos[0] + radius * Math.sin(phi) * Math.cos(theta);
      const y = parentPos[1] + radius * Math.sin(phi) * Math.sin(theta);
      const z = parentPos[2] + radius * Math.cos(phi);

      positions[childId] = [x, y, z];
      layoutNode(childId, level + 1, [x, y, z]);
    });
  };

  layoutNode(root.id, 1, [0, 0, 0]);

  nodes.forEach(n => {
    if (!positions[n.id]) {
      positions[n.id] = [
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ];
    }
  });

  return positions;
};

// ----------------------------------------------------------------------------
// RENDER SUBCOMPONENTS
// ----------------------------------------------------------------------------
function LinkLine({ start, end, color }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color={color} linewidth={2.5} transparent opacity={0.65} />
    </line>
  );
}

function NodeSphere({ position, node, color, secondaryColor }) {
  const [hovered, setHovered] = useState(false);
  const sphereRef = useRef();

  useFrame((state) => {
    if (sphereRef.current) {
      const scale = hovered ? 1.35 + Math.sin(state.clock.elapsedTime * 6) * 0.1 : 1.0;
      sphereRef.current.scale.setScalar(scale);
    }
  });

  const nodeColor = node.level === 0 ? color : (node.level === 1 ? secondaryColor : '#ffffff');
  const size = node.level === 0 ? 1.4 : (node.level === 1 ? 0.9 : 0.6);

  return (
    <group position={position}>
      <mesh
        ref={sphereRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={nodeColor}
          emissiveIntensity={hovered ? 2.0 : 0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Dynamic Floating Label */}
      <Html distanceFactor={18} position={[0, size + 1.2, 0]} center>
        <div style={{
          background: 'rgba(5, 10, 25, 0.85)',
          color: '#fff',
          padding: '4px 10px',
          borderRadius: '6px',
          border: `1px solid ${nodeColor}`,
          fontSize: node.level === 0 ? '12px' : '10px',
          fontWeight: node.level === 0 ? 'bold' : 'normal',
          fontFamily: 'Inter, sans-serif',
          whiteSpace: 'nowrap',
          boxShadow: `0 0 10px ${nodeColor}44`,
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)'
        }}>
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function MindMap3DScene({ graphData, color, secondaryColor }) {
  const positions = useMemo(() => computePositions(graphData.nodes, graphData.links), [graphData]);
  const groupRef = useRef();

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle auto-rotation
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <pointLight position={[20, 20, 20]} intensity={1.5} />
      <pointLight position={[-20, -20, -20]} intensity={1.0} />

      {/* Render links */}
      {graphData.links.map((link, idx) => {
        const start = positions[link.source];
        const end = positions[link.target];
        if (!start || !end) return null;
        return <LinkLine key={`link-${idx}`} start={start} end={end} color={color} />;
      })}

      {/* Render nodes */}
      {graphData.nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        return (
          <NodeSphere
            key={node.id}
            position={pos}
            node={node}
            color={color}
            secondaryColor={secondaryColor}
          />
        );
      })}
    </group>
  );
}

// ----------------------------------------------------------------------------
// EXPORTED CONTAINER COMPONENT
// ----------------------------------------------------------------------------
export default function MindMap3D({ chartCode }) {
  const graphData = useMemo(() => parseMermaidToGraph(chartCode), [chartCode]);

  // Extract current theme colors dynamically from CSS variables
  const [themeColors, setThemeColors] = useState({ primary: '#00f2fe', secondary: '#7f00ff' });

  useEffect(() => {
    const primary = getComputedStyle(document.documentElement).getPropertyValue('--accent-cyan').trim() || '#00f2fe';
    const secondary = getComputedStyle(document.documentElement).getPropertyValue('--accent-purple').trim() || '#7f00ff';
    setThemeColors({ primary, secondary });
  }, [chartCode]);

  return (
    <div style={{
      width: '100%',
      height: '350px',
      background: 'rgba(5, 5, 12, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '8px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
    }}>
      <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
        <MindMap3DScene
          graphData={graphData}
          color={themeColors.primary}
          secondaryColor={themeColors.secondary}
        />
        <OrbitControls enableZoom={true} enablePan={true} maxDistance={60} minDistance={10} />
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '12px',
        fontSize: '10px',
        color: 'rgba(255,255,255,0.4)',
        pointerEvents: 'none',
        fontFamily: 'Inter, sans-serif'
      }}>
        🖱️ Drag to rotate | Scroll to zoom
      </div>
    </div>
  );
}
