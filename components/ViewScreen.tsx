import React, { useState } from 'react';
import { TravelResult } from '../types';
import { generateSouvenir } from '../utils/souvenirGenerator';

interface ViewScreenProps {
  result: TravelResult | null;
  loading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

const ViewScreen: React.FC<ViewScreenProps> = ({ result, loading, error, onDismissError }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to format date
  const formatTime = (t: any) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const yearStr = t.year <= 0 ? `${Math.abs(t.year)} BC` : `AD ${t.year}`;
      return `${yearStr} • ${pad(t.month)}/${pad(t.day)} • ${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`;
  };

  const handleDownloadSouvenir = async () => {
    if (!result) return;
    setIsGenerating(true);
    try {
      const dataUrl = await generateSouvenir(result);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `Chronovisor-${result.locationName.replace(/\s+/g, '_')}-${result.time.year}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate souvenir", error);
      alert("Error generating souvenir sequence.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-black tech-border relative overflow-hidden flex flex-col">
      {/* HUD Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900/50 border-b border-cyan-900/30 flex items-center justify-between px-4 z-20">
        <span className="text-cyan-600 text-xs font-mono">VIEWSCREEN // OUTPUT</span>
        <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150"></div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative flex items-center justify-center p-1">
        
        {loading && (
          <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="text-cyan-400 font-mono animate-pulse text-lg">CALCULATING TIMELINE VARIANCE...</div>
            <div className="text-cyan-700 font-mono text-xs max-w-xs text-center">
                Rendering probabilistic quantum imagery from Gemini 3 Pro matrix...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center p-8 overflow-hidden">
            {/* Glitch background lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-[15%] left-0 right-0 h-px bg-red-500 animate-pulse"></div>
              <div className="absolute top-[35%] left-0 right-0 h-0.5 bg-red-600/50" style={{animation: 'pulse 1.5s ease-in-out infinite'}}></div>
              <div className="absolute top-[62%] left-0 right-0 h-px bg-red-500/40 animate-pulse"></div>
              <div className="absolute top-[78%] left-0 right-0 h-0.5 bg-red-600/30" style={{animation: 'pulse 2s ease-in-out infinite'}}></div>
            </div>

            {/* Static noise overlay */}
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20baseFrequency%3D%220.9%22%20type%3D%22fractalNoise%22%20numOctaves%3D%224%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')]"></div>

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_2px] z-10"></div>

            {/* Error content */}
            <div className="relative z-20 text-center space-y-6 max-w-lg">
              {/* Glitchy warning symbol */}
              <div className="relative inline-block">
                <div className="text-7xl text-red-500 animate-pulse font-mono" style={{textShadow: '2px 0 #ff0000, -2px 0 #00ffff'}}>⚠</div>
              </div>

              <div className="space-y-2">
                <div className="text-red-500 font-mono text-xs tracking-[0.5em] uppercase animate-pulse">
                  // SYSTEM MALFUNCTION //
                </div>
                <div className="text-red-400 font-mono text-lg font-bold tracking-wider" style={{textShadow: '0 0 10px rgba(239,68,68,0.5)'}}>
                  TEMPORAL DISPLACEMENT FAILED
                </div>
              </div>

              <div className="bg-red-950/30 border border-red-900/50 p-4 text-left">
                <div className="text-red-500/70 font-mono text-[10px] uppercase tracking-widest mb-2">Error Log {'>'} Diagnostics</div>
                <div className="text-red-300 font-mono text-sm leading-relaxed">
                  {error}
                </div>
              </div>

              <button
                onClick={onDismissError}
                className="bg-red-950/50 hover:bg-red-900/50 border border-red-800/50 hover:border-red-600 text-red-400 hover:text-red-300 px-6 py-2 font-mono text-xs uppercase tracking-widest transition-all"
              >
                Acknowledge &amp; Reset
              </button>
            </div>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="text-center space-y-4 opacity-50">
            <div className="text-6xl text-cyan-900">∅</div>
            <div className="text-cyan-700 font-mono text-sm">NO TEMPORAL DATA LOADED</div>
            <div className="text-cyan-900 text-xs">Select coordinates and timeframe to begin visualization.</div>
          </div>
        )}

        {!loading && !error && result && (
          <div className="w-full h-full relative group">
            {/* Main Image */}
            {result.imageUrl ? (
              <img 
                src={result.imageUrl} 
                alt={result.locationName} 
                className="w-full h-full object-cover"
              />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-slate-900 text-cyan-500 font-mono">
                  [VISUAL FEED ERROR: TEXT ONLY MODE]
               </div>
            )}
            
            {/* Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10"></div>
            
            {/* Souvenir Button (Absolute Positioned) */}
            <button 
              onClick={handleDownloadSouvenir}
              disabled={isGenerating}
              className="absolute top-16 right-4 z-40 bg-black/60 border border-cyan-500 text-cyan-400 text-xs px-3 py-1 hover:bg-cyan-900/50 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              {isGenerating ? (
                <>Processing...</>
              ) : (
                <>
                  <span>Download Souvenir</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </>
              )}
            </button>

            {/* Description Overlay (Bottom) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 pt-12 z-20">
              <div className="flex items-baseline justify-between mb-2">
                 <h2 className="text-2xl font-bold text-white font-mono tracking-tighter drop-shadow-lg">
                    {result.locationName.toUpperCase()}
                 </h2>
                 <span className="text-lg text-cyan-400 font-mono font-bold tracking-tight">
                    {formatTime(result.time)}
                 </span>
              </div>
              <p className="text-cyan-100 font-mono text-sm leading-relaxed border-l-2 border-cyan-500 pl-4 opacity-90 max-w-3xl">
                {result.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewScreen;
