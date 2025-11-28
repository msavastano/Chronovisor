import React, { useState } from 'react';
import { Coordinates, TimeParams } from '../types';
import { MIN_YEAR, MAX_YEAR } from '../constants';

interface ControlPanelProps {
  timeParams: TimeParams;
  setTimeParams: (params: TimeParams) => void;
  coordinates: Coordinates | null;
  setCoordinates: (coords: Coordinates) => void;
  onRandomize: () => void;
  onTravel: () => void;
  onEventLookup: (query: string) => Promise<void>;
  isTraveling: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  timeParams,
  setTimeParams,
  coordinates,
  setCoordinates,
  onRandomize,
  onTravel,
  onEventLookup,
  isTraveling
}) => {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeParams({ ...timeParams, year: Number(e.target.value) });
  };

  const handleTimeChange = (field: keyof TimeParams, value: number) => {
    setTimeParams({ ...timeParams, [field]: value });
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim() || isSearching) return;
    setIsSearching(true);
    await onEventLookup(searchQuery);
    setIsSearching(false);
    setSearchQuery('');
  };

  // Coordinate Helpers
  const currentLat = coordinates?.lat || 0;
  const currentLng = coordinates?.lng || 0;
  
  // Check for -0 to correctly display direction for 0 values if previously set to S/W
  const isNegativeZero = (n: number) => n === 0 && (1 / n === -Infinity);

  const latMagnitude = Math.abs(currentLat);
  const latDirection = (currentLat < 0 || isNegativeZero(currentLat)) ? 'S' : 'N';

  const lngMagnitude = Math.abs(currentLng);
  const lngDirection = (currentLng < 0 || isNegativeZero(currentLng)) ? 'W' : 'E';

  const updateCoordinates = (type: 'lat' | 'lng', magStr: string, dir: string) => {
    let mag = parseFloat(magStr);
    if (isNaN(mag)) mag = 0;
    mag = Math.abs(mag); // Ensure positive magnitude

    if (type === 'lat') {
        if (mag > 90) mag = 90;
        const sign = dir === 'S' ? -1 : 1;
        // mag * sign produces -0 if mag is 0 and sign is -1, which is what we want for state
        const newLat = mag * sign; 
        setCoordinates({ lat: newLat, lng: currentLng });
    } else {
        if (mag > 180) mag = 180;
        const sign = dir === 'W' ? -1 : 1;
        const newLng = mag * sign;
        setCoordinates({ lat: currentLat, lng: newLng });
    }
  };

  const getEraLabel = (y: number) => {
    if (y < -3000) return "ANCIENT HISTORY";
    if (y < 500) return "CLASSICAL ANTIQUITY";
    if (y < 1500) return "MIDDLE AGES";
    if (y < 1900) return "EARLY MODERN";
    if (y < 2025) return "MODERN ERA";
    return "THE FUTURE";
  };

  // Helper for 2 digit padding
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex flex-col gap-5 p-6 bg-slate-900/80 tech-border backdrop-blur-sm h-full justify-center">
      
      {/* Search Module */}
      <div className="space-y-2 pb-4 border-b border-cyan-900/30">
        <label className="text-cyan-400 text-xs font-bold tracking-widest uppercase flex justify-between">
           <span>Neural Event Search</span>
           {isSearching && <span className="animate-pulse text-cyan-200">SCANNING DB...</span>}
        </label>
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Ex: Fall of the Berlin Wall" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                disabled={isSearching}
                className="w-full bg-black/60 border border-cyan-800 text-cyan-200 text-xs p-2 outline-none focus:border-cyan-500 placeholder-cyan-800"
            />
            <button 
                onClick={handleSearchSubmit}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-700 text-cyan-300 px-3 transition-colors disabled:opacity-50"
            >
               🔍
            </button>
        </div>
      </div>

      {/* Coordinates Input */}
      <div className="space-y-2">
        <label className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Target Vector</label>
        
        <div className="grid grid-cols-2 gap-3">
            {/* Latitude */}
            <div className="bg-black/60 border border-cyan-800 p-2 relative group focus-within:border-cyan-500 transition-colors">
                <label className="absolute top-1 left-2 text-[8px] text-cyan-700 font-bold uppercase tracking-wider">LATITUDE</label>
                <div className="flex items-center mt-3 gap-2">
                    <input 
                        type="number" 
                        value={latMagnitude}
                        onChange={(e) => updateCoordinates('lat', e.target.value, latDirection)}
                        step="0.0001"
                        min="0"
                        max="90"
                        className="w-full bg-transparent text-cyan-200 font-mono text-sm outline-none text-right"
                    />
                    <select 
                        value={latDirection}
                        onChange={(e) => updateCoordinates('lat', latMagnitude.toString(), e.target.value)}
                        className="bg-slate-900 text-cyan-400 border border-cyan-800 text-xs font-bold outline-none cursor-pointer p-1 hover:text-cyan-200"
                    >
                        <option value="N">°N</option>
                        <option value="S">°S</option>
                    </select>
                </div>
            </div>

            {/* Longitude */}
            <div className="bg-black/60 border border-cyan-800 p-2 relative group focus-within:border-cyan-500 transition-colors">
                <label className="absolute top-1 left-2 text-[8px] text-cyan-700 font-bold uppercase tracking-wider">LONGITUDE</label>
                <div className="flex items-center mt-3 gap-2">
                    <input 
                        type="number" 
                        value={lngMagnitude}
                        onChange={(e) => updateCoordinates('lng', e.target.value, lngDirection)}
                        step="0.0001"
                        min="0"
                        max="180"
                        className="w-full bg-transparent text-cyan-200 font-mono text-sm outline-none text-right"
                    />
                     <select 
                        value={lngDirection}
                        onChange={(e) => updateCoordinates('lng', lngMagnitude.toString(), e.target.value)}
                        className="bg-slate-900 text-cyan-400 border border-cyan-800 text-xs font-bold outline-none cursor-pointer p-1 hover:text-cyan-200"
                    >
                        <option value="E">°E</option>
                        <option value="W">°W</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* Temporal Controls */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
             <label className="text-cyan-400 text-xs font-bold tracking-widest uppercase">Temporal Coordinate</label>
             <span className="text-cyan-600 text-[10px]">{getEraLabel(timeParams.year)}</span>
        </div>
       
        {/* Main Year Display */}
        <div className="relative flex items-center justify-center bg-black border-2 border-cyan-600 rounded-lg p-3">
            <span className="text-3xl font-black text-white font-mono tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {timeParams.year <= 0 ? `${Math.abs(timeParams.year)} BC` : `AD ${timeParams.year}`}
            </span>
        </div>

        {/* Year Slider */}
        <input
          type="range"
          min={-10000}
          max={3000}
          step={10}
          value={timeParams.year}
          onChange={handleYearChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
        />
        <div className="flex justify-between text-[10px] text-cyan-700 font-mono">
            <span>10,000 BC</span>
            <span>PRESENT</span>
            <span>3000 AD</span>
        </div>
        
        {/* Precise Inputs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
           {/* Year Manual */}
           <div className="flex flex-col gap-1">
              <label className="text-cyan-700 text-[9px]">YEAR</label>
              <input 
                 type="number" 
                 value={timeParams.year} 
                 onChange={(e) => handleTimeChange('year', parseInt(e.target.value) || 0)}
                 min={MIN_YEAR}
                 max={MAX_YEAR}
                 className="bg-black border border-cyan-800 text-cyan-400 p-1 text-center font-mono focus:border-cyan-400 outline-none"
               />
           </div>

           {/* Month / Day */}
           <div className="flex gap-1">
              <div className="flex flex-col gap-1 w-1/2">
                <label className="text-cyan-700 text-[9px]">MONTH</label>
                <input 
                    type="number" 
                    value={timeParams.month}
                    onChange={(e) => handleTimeChange('month', Math.max(1, Math.min(12, parseInt(e.target.value) || 1)))}
                    min={1} max={12}
                    className="bg-black border border-cyan-800 text-cyan-400 p-1 text-center font-mono focus:border-cyan-400 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 w-1/2">
                <label className="text-cyan-700 text-[9px]">DAY</label>
                <input 
                    type="number" 
                    value={timeParams.day}
                    onChange={(e) => handleTimeChange('day', Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                    min={1} max={31}
                    className="bg-black border border-cyan-800 text-cyan-400 p-1 text-center font-mono focus:border-cyan-400 outline-none"
                />
              </div>
           </div>
        </div>

        {/* Time Fine Tuning */}
        <div className="border border-cyan-900/50 bg-black/40 p-2 rounded">
           <label className="text-cyan-600 text-[9px] block mb-1 tracking-wider">FINE TUNING (HH:MM:SS)</label>
           <div className="flex items-center gap-1">
                <input 
                    type="number" 
                    value={pad(timeParams.hour)}
                    onChange={(e) => handleTimeChange('hour', Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                    min={0} max={23}
                    className="bg-black border border-cyan-800 text-cyan-300 w-full p-1 text-center font-mono focus:border-cyan-400 outline-none"
                />
                <span className="text-cyan-600">:</span>
                <input 
                    type="number" 
                    value={pad(timeParams.minute)}
                    onChange={(e) => handleTimeChange('minute', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    min={0} max={59}
                    className="bg-black border border-cyan-800 text-cyan-300 w-full p-1 text-center font-mono focus:border-cyan-400 outline-none"
                />
                <span className="text-cyan-600">:</span>
                <input 
                    type="number" 
                    value={pad(timeParams.second)}
                    onChange={(e) => handleTimeChange('second', Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    min={0} max={59}
                    className="bg-black border border-cyan-800 text-cyan-300 w-full p-1 text-center font-mono focus:border-cyan-400 outline-none"
                />
           </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <button
          onClick={onRandomize}
          disabled={isTraveling || isSearching}
          className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-200 font-bold tracking-wider text-sm transition-all uppercase flex flex-col items-center justify-center gap-1 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="group-hover:text-cyan-400 transition-colors">⚡ Random Flux</span>
        </button>

        <button
          onClick={onTravel}
          disabled={!coordinates || isTraveling || isSearching}
          className={`py-3 px-4 border text-white font-bold tracking-wider text-sm transition-all uppercase flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(6,182,212,0.3)]
            ${!coordinates || isTraveling || isSearching
              ? 'bg-slate-800 border-slate-600 text-slate-500 cursor-not-allowed' 
              : 'bg-cyan-700 hover:bg-cyan-600 border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]'}`}
        >
          {isTraveling ? (
            <span className="animate-pulse">ENGAGING...</span>
          ) : (
            <span>🚀 INITIATE JUMP</span>
          )}
        </button>
      </div>

      <div className="mt-2 text-[10px] text-cyan-800 text-center font-mono">
        SYSTEM STATUS: {isTraveling || isSearching ? 'PROCESSING' : 'READY FOR INPUT'}
      </div>
    </div>
  );
};

export default ControlPanel;