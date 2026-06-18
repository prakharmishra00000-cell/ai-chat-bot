import React, { useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const KnowledgeGraph = ({ data, onNodeClickAction }) => {
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const parsedData = useMemo(() => {
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        return {
          nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
          links: Array.isArray(parsed.links) ? parsed.links : []
        };
      }
      return {
        nodes: Array.isArray(data?.nodes) ? data.nodes : [],
        links: Array.isArray(data?.links) ? data.links : []
      };
    } catch (e) {
      console.error('Failed to parse graph data', e);
      return { nodes: [], links: [] };
    }
  }, [data]);

  return (
    <div className="graph-panel" ref={containerRef}>
      <div className="graph-overlay">
        <h3>🕸️ Knowledge Graph</h3>
        <p>{parsedData.nodes.length} Nodes | {parsedData.links.length} Links</p>
        <p style={{marginTop: '5px', fontSize: '0.7rem', color: '#888'}}>Scroll to zoom, drag to pan</p>
      </div>
      
      {parsedData.nodes.length > 0 ? (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={parsedData}
          nodeLabel="label"
          nodeColor={node => {
            // Provide some cool colors based on group
            const colors = ['#ff4b4b', '#4b7bff', '#4bff88', '#f8ff4b', '#ff4bf8', '#4bffff'];
            return node.group ? colors[node.group % colors.length] : '#4b7bff';
          }}
          nodeRelSize={6}
          linkLabel="relationship"
          linkColor={() => 'rgba(255,255,255,0.2)'}
          linkWidth={1.5}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          backgroundColor="#050508"
          onNodeClick={node => {
            // Center/zoom on node
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(8, 2000);
            // Trigger auto-prompt in chat
            if (onNodeClickAction && node.label) {
              onNodeClickAction(`Tell me more details about ${node.label} in this context`);
            }
          }}
        />
      ) : (
        <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#888'}}>
          <p>{data?.error ? "Error: AI could not parse the request into a graph." : "No graph data available. Ask a conceptual question."}</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
