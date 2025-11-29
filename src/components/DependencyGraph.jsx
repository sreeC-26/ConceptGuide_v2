import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

function FitViewHelper({ nodes }) {
  const { fitView } = useReactFlow();
  
  useEffect(() => {
    // Fit view after a short delay to ensure nodes are rendered
    if (nodes && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, maxZoom: 1, minZoom: 0.1, duration: 400 });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [fitView, nodes]);
  
  return null;
}

export default function DependencyGraph({ mindMap, onComplete }) {
  // Convert mindMap data to ReactFlow format with simple circular layout
  const nodes = useMemo(() => {
    if (!mindMap) return [];

    const nodeCount = mindMap.nodes.length;
    // Increase radius significantly to prevent overlapping
    const radius = Math.max(300, nodeCount * 80);
    const centerX = 600;
    const centerY = 400;

    return mindMap.nodes.map((node, index) => {
      // Determine node color based on depth
      const depthColors = {
        0: '#27C93F', // green - foundational
        1: '#FF4081', // pink
        2: '#FFBD2E', // yellow
        3: '#FF5F56', // red - target concept
      };

      // Determine node size based on importance (1-5) - make bigger to prevent text overflow
      const importanceSize = Math.max(120, node.importance * 30);

      // Determine node color based on type
      const typeColors = {
        math: '#FF4081',
        science: '#27C93F',
        code: '#E0007A',
        theory: '#FFBD2E',
      };

      const nodeColor = typeColors[node.type] || '#9B59B6'; // Purple for unknown types
      const depthColor = depthColors[node.depth] || '#9B59B6'; // Purple for depth 4+

      // Simple circular layout
      const angle = (2 * Math.PI * index) / nodeCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: {
          label: node.label,
          description: node.description,
          type: node.type,
          importance: node.importance,
          depth: node.depth,
          estimatedTime: node.estimatedTime,
        },
        style: {
          width: importanceSize,
          height: importanceSize,
          backgroundColor: depthColor,
          color: '#FFFFFF',
          border: `3px solid ${nodeColor}`,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          fontFamily: 'Poppins, sans-serif',
          padding: '8px',
          minWidth: '120px',
          minHeight: '120px',
        },
      };
    });
  }, [mindMap]);

  const edges = useMemo(() => {
    if (!mindMap) return [];

    return mindMap.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: edge.strength === 'critical',
      style: {
        stroke: edge.strength === 'critical' ? '#FF4081' : '#F5D9E4',
        strokeWidth: edge.strength === 'critical' ? 3 : 2,
      },
      label: edge.strength === 'critical' ? 'critical' : 'helpful',
      labelStyle: { 
        fill: '#E0007A', 
        fontWeight: 700, 
        fontSize: '12px', 
        fontFamily: 'Poppins, sans-serif',
      },
      labelBgStyle: {
        fill: '#2D2D2D',
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 8],
      labelBgBorderRadius: 4,
    }));
  }, [mindMap]);

  // Custom node component with tooltip
  const CustomNode = useCallback(({ data }) => {
    return (
      <div className="relative group">
        <Handle type="target" position={Position.Top} />
        <div className="px-2 py-2 text-center" style={{ color: '#FFFFFF' }}>
          <div className="font-semibold text-xs mb-1 leading-tight" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>{data.label}</div>
          <div className="text-xs opacity-90" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>Depth: {data.depth}</div>
          <div className="text-xs opacity-90" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>⭐{data.importance}</div>
        </div>
        <Handle type="source" position={Position.Bottom} />
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="rounded-lg py-2 px-3 max-w-xs shadow-lg" style={{ backgroundColor: '#2D2D2D', border: '1px solid #FF4081' }}>
            <div className="font-semibold mb-1" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>{data.label}</div>
            <div className="mb-2" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4', fontSize: '0.75rem' }}>{data.description}</div>
            <div className="text-xs space-y-1" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
              <div>Type: {data.type}</div>
              <div>Importance: {data.importance}/5</div>
              <div>Depth: {data.depth}</div>
              <div>Time: ~{data.estimatedTime} min</div>
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent" style={{ borderTopColor: '#2D2D2D' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }, []);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), [CustomNode]);

  if (!mindMap || nodes.length === 0) {
    return (
      <div className="gradient-border rounded-lg p-8">
        <div className="window-controls mb-4">
          <div className="window-dot window-dot-red"></div>
          <div className="window-dot window-dot-yellow"></div>
          <div className="window-dot window-dot-green"></div>
        </div>
        <h2 className="text-2xl mb-4" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>Dependency Graph</h2>
        <p style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>No mind map data available.</p>
      </div>
    );
  }

  return (
    <div className="gradient-border rounded-lg p-6">
      <div className="window-controls mb-4">
        <div className="window-dot window-dot-red"></div>
        <div className="window-dot window-dot-yellow"></div>
        <div className="window-dot window-dot-green"></div>
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl flex items-center" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF', fontSize: '2rem' }}>
          <span className="mr-2">🗺️</span>
          Concept Dependency Map
        </h2>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex flex-wrap gap-4 text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#27C93F' }}></div>
            <span>Depth 0 (Foundation)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#FF4081' }}></div>
            <span>Depth 1</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#FFBD2E' }}></div>
            <span>Depth 2</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: '#FF5F56' }}></div>
            <span>Depth 3 (Target)</span>
          </div>
          <div className="flex items-center ml-4">
            <div className="w-3 h-3 border-2 rounded mr-2" style={{ borderColor: '#FF4081', backgroundColor: 'transparent' }}></div>
            <span>Critical Edge</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: '#F5D9E4' }}></div>
            <span>Helpful Edge</span>
          </div>
        </div>
        {mindMap.recommendedPath && mindMap.recommendedPath.length > 0 && (
          <div className="rounded-lg p-3" style={{ backgroundColor: '#1A1A1A', border: '1px solid #FF4081' }}>
            <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Poppins, sans-serif', color: '#FF4081', fontSize: '1.125rem' }}>📚 Recommended Learning Path:</div>
            <div className="text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: '#F5D9E4' }}>
              {mindMap.recommendedPath.map((nodeId, idx) => {
                const node = mindMap.nodes.find(n => n.id === nodeId);
                return node ? (
                  <span key={nodeId}>
                    {idx > 0 && <span className="mx-2" style={{ color: '#FF4081' }}>→</span>}
                    <span className="font-medium">{node.label}</span>
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg" style={{ height: '600px', width: '100%', border: '1px solid #FF4081', backgroundColor: '#1A1A1A' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2, maxZoom: 1, minZoom: 0.1 }}
            attributionPosition="bottom-left"
          >
            <FitViewHelper nodes={nodes} />
            <Background color="#2D2D2D" gap={16} />
            <Controls style={{ backgroundColor: '#2D2D2D', border: '1px solid #FF4081' }} />
            <MiniMap
              nodeColor={(node) => {
                const depth = node.data?.depth;
                if (depth === 0) return '#27C93F';
                if (depth === 1) return '#FF4081';
                if (depth === 2) return '#FFBD2E';
                if (depth === 3) return '#FF5F56';
                return '#9B59B6'; // Purple for depth 4+
              }}
              maskColor="rgba(0, 0, 0, 0.5)"
              style={{ backgroundColor: '#2D2D2D', border: '1px solid #FF4081' }}
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
}

