import { Game2048 } from './components/Game2048';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f0f1e] flex items-center justify-center relative overflow-hidden">
      {/* Grid background pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radial glow effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)'
        }}
      />
      
      <Game2048 />
    </div>
  );
}
