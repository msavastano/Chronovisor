import React, { useState } from 'react';
import { TravelResult } from '../types';
import { generateSouvenir } from '../utils/souvenirGenerator';

interface ViewScreenProps {
  result: TravelResult | null;
  loading: boolean;
}

const ViewScreen: React.FC<ViewScreenProps> = ({ result, loading }) => {
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

        {!loading && !result && (
          <div className="text-center space-y-4 opacity-50">
            <div className="text-6xl text-cyan-900">∅</div>
            <div className="text-cyan-700 font-mono text-sm">NO TEMPORAL DATA LOADED</div>
            <div className="text-cyan-900 text-xs">Select coordinates and timeframe to begin visualization.</div>
          </div>
        )}

        {!loading && result && (
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
