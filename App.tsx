import React, { useState } from 'react';
import Globe from './components/Globe';
import ControlPanel from './components/ControlPanel';
import ViewScreen from './components/ViewScreen';
import { Coordinates, TravelResult, TimeParams } from './types';
import { HISTORICAL_EVENTS } from './constants';
import { executeTimeTravel, checkAndRequestApiKey, lookupHistoricalEvent } from './services/geminiService';

function App() {
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  // Default to current date/time
  const now = new Date();
  const [timeParams, setTimeParams] = useState<TimeParams>({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds()
  });

  const [isTraveling, setIsTraveling] = useState<boolean>(false);
  const [result, setResult] = useState<TravelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRandomize = () => {
    const randomEvent = HISTORICAL_EVENTS[Math.floor(Math.random() * HISTORICAL_EVENTS.length)];
    setSelectedCoordinates(randomEvent.coordinates);
    setTimeParams(randomEvent.time);
  };

  const handleEventLookup = async (query: string) => {
    setError(null);
    try {
      const data = await lookupHistoricalEvent(query, isMockMode);
      if (data) {
        setSelectedCoordinates(data.coordinates);
        setTimeParams(data.time);
      } else {
        setError("Event not found in historical database.");
      }
    } catch (e) {
      setError("Search system offline.");
    }
  };

  const handleTravel = async () => {
    if (!selectedCoordinates) return;
    
    setIsTraveling(true);
    setError(null);

    try {
      if (!isMockMode) {
          // Pre-flight check for key only if not mocking
          const hasKey = await checkAndRequestApiKey();
          if (!hasKey) {
            throw new Error("API Key selection is required for Temporal Displacement.");
          }
      }

      const travelResult = await executeTimeTravel(
        selectedCoordinates.lat,
        selectedCoordinates.lng,
        timeParams,
        isMockMode
      );
      setResult(travelResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Temporal Displacement Failed. Systems Unstable.");
    } finally {
      setIsTraveling(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-cyan-500 holo-grid overflow-hidden flex flex-col font-mono">
      {/* Header */}
      <header className="p-4 border-b border-cyan-900 bg-black/90 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 rounded-full flex items-center justify-center animate-spin-slow">
             <div className="w-6 h-6 border border-cyan-300 rounded-full"></div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-[Orbitron]">
              CHRONO<span className="text-white">VISOR</span>
            </h1>
            <p className="text-[10px] text-cyan-700 tracking-[0.3em] uppercase">Nano Banana Pro Module Online</p>
          </div>
        </div>
        
        <div className="text-right hidden md:block">
           <div className="text-xs text-cyan-800">SYSTEM DATE</div>
           <div className="text-xl font-bold text-cyan-600">{new Date().toISOString().split('T')[0]}</div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="flex-1 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
        
        {/* Left Column: Navigation (Globe) & Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Globe Container */}
          <div className="relative">
             <div className="absolute -inset-1 bg-cyan-500/20 blur-xl rounded-full"></div>
             <Globe 
               selectedCoordinates={selectedCoordinates} 
               onSelectCoordinates={setSelectedCoordinates} 
             />
          </div>

          {/* Controls */}
          <div className="flex-1 min-h-[300px]">
             <ControlPanel 
               timeParams={timeParams}
               setTimeParams={setTimeParams}
               coordinates={selectedCoordinates}
               setCoordinates={setSelectedCoordinates}
               onRandomize={handleRandomize}
               onTravel={handleTravel}
               onEventLookup={handleEventLookup}
               isTraveling={isTraveling}
               isMockMode={isMockMode}
               onToggleMockMode={() => setIsMockMode(!isMockMode)}
             />
          </div>
        </div>

        {/* Right Column: Viewscreen */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
           <ViewScreen result={result} loading={isTraveling} />
           
           {/* Error Display */}
           {error && (
             <div className="bg-red-900/20 border border-red-500/50 p-4 text-red-400 font-mono text-sm flex items-center gap-4">
               <span className="text-2xl">⚠️</span>
               <div>
                 <div className="font-bold">CRITICAL ERROR</div>
                 <div>{error}</div>
                 {!isMockMode && (
                     <button 
                        onClick={() => window.aistudio?.openSelectKey()} 
                        className="mt-2 text-xs underline hover:text-white"
                      >
                        RESET SECURITY CREDENTIALS (API KEY)
                     </button>
                 )}
               </div>
             </div>
           )}

           {/* Flavor Text / Footer */}
           <div className="mt-auto border-t border-cyan-900/30 pt-4 flex justify-between text-[10px] text-cyan-800 uppercase">
              <span>Powered by Gemini 3 Pro Image Preview</span>
              <span>Temporal Stability: 98.4%</span>
           </div>
        </div>
      </main>
    </div>
  );
}

export default App;