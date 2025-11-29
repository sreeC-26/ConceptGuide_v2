import { useNavigate } from 'react-router-dom';
import DependencyGraph from './DependencyGraph';

export default function MindMapPage({ mindMap, onBack, onContinueToPath }) {
  const navigate = useNavigate();

  if (!mindMap || !mindMap.nodes || mindMap.nodes.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="text-center">
          <p className="text-xl text-pink-400 mb-4">No mind map available</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg bg-pink-500 text-white hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#1A1A1A' }}>
      <div className="container mx-auto max-w-7xl">
        {/* Header with Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-lg transition-all duration-200 hover:opacity-90"
            style={{
              fontFamily: 'Poppins, sans-serif',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              border: '1px solid #FF4081',
            }}
          >
            ← Back
          </button>
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: '#FFFFFF' }}>
            Concept Dependency Map
          </h2>
          <div style={{ width: '100px' }}></div> {/* Spacer for centering */}
        </div>

        {/* Mind Map - Larger Display */}
        <div className="mb-8" style={{ minHeight: '600px' }}>
          <DependencyGraph
            mindMap={mindMap}
            onComplete={() => {}} // Don't auto-advance, use button instead
          />
        </div>

        {/* Continue to Learning Path Button */}
        <div className="flex justify-center">
          <button
            onClick={onContinueToPath}
            className="px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 hover:opacity-90 shadow-lg"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: 'linear-gradient(135deg, #FF4081 0%, #E0007A 100%)',
              color: '#FFFFFF',
            }}
          >
            Continue to Learning Path
          </button>
        </div>
      </div>
    </div>
  );
}

