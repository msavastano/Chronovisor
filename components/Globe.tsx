import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Coordinates } from '../types';

interface GlobeProps {
  onSelectCoordinates: (coords: Coordinates) => void;
  selectedCoordinates: Coordinates | null;
}

const Globe: React.FC<GlobeProps> = ({ onSelectCoordinates, selectedCoordinates }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, -30, 0]);
  const [geoData, setGeoData] = useState<any>(null);

  // Fetch Map Data once
  useEffect(() => {
    // Using a reliable GeoJSON source for world land masses
    const dataUrl = "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson";
    d3.json(dataUrl).then((data) => {
      setGeoData(data);
    }).catch(err => {
      console.error("Failed to load map data", err);
    });
  }, []);

  useEffect(() => {
    if (!wrapperRef.current || !svgRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = width; // Keep it square

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("cursor", "crosshair");

    // Clear previous renders
    svg.selectAll("*").remove();

    // Projection
    const projection = d3.geoOrthographic()
      .scale(width / 2.2)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate(rotation);

    const path = d3.geoPath().projection(projection);

    // 1. Globe Background (Ocean)
    svg.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", width / 2.2)
      .attr("fill", "#020617") // Very dark slate/black
      .attr("stroke", "#0e7490")
      .attr("stroke-width", 2)
      .attr("opacity", 1);

    // 2. Graticule (Grid lines) - Behind land
    const graticule = d3.geoGraticule();
    svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#0891b2") // Cyan-600
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.2);

    // 3. Land Masses
    if (geoData) {
        svg.append("g")
           .selectAll("path")
           .data(geoData.features)
           .enter()
           .append("path")
           .attr("d", path as any)
           .attr("fill", "#0f172a") // Slate-900
           .attr("stroke", "#06b6d4") // Cyan-500 (Neon edges)
           .attr("stroke-width", 0.8)
           .attr("opacity", 0.8)
           .style("filter", "drop-shadow(0 0 2px rgba(6, 182, 212, 0.3))");
    }

    // Drag Behavior
    const drag = d3.drag<SVGSVGElement, unknown>()
      .on("drag", (event) => {
        const k = 75 / projection.scale();
        const r = projection.rotate();
        const nextRotation: [number, number, number] = [r[0] + event.dx * k, r[1] - event.dy * k, r[2]];
        projection.rotate(nextRotation);
        setRotation(nextRotation);
      });

    svg.call(drag);

    // Click Behavior
    svg.on("click", (event) => {
      // Get click position
      const [x, y] = d3.pointer(event);
      // Invert projection to get Lat/Lng
      const coords = projection.invert?.([x, y]);
      if (coords) {
        onSelectCoordinates({ lng: coords[0], lat: coords[1] });
      }
    });

    // Marker for selected coordinates
    if (selectedCoordinates) {
        // Calculate visibility (is it on the front side?)
        const center = projection([selectedCoordinates.lng, selectedCoordinates.lat]);
        // Simple visibility check using geoDistance or d3 circle clipping
        // We use geoCircle which handles clipping automatically with the path generator
        const circleGenerator = d3.geoCircle().center([selectedCoordinates.lng, selectedCoordinates.lat]).radius(2.5);
        
        svg.append("path")
            .datum(circleGenerator())
            .attr("d", path)
            .attr("fill", "#ef4444") // Red-500
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .style("filter", "drop-shadow(0 0 8px #ef4444)");
            
        // Add a "ping" effect ring
        const pingGenerator = d3.geoCircle().center([selectedCoordinates.lng, selectedCoordinates.lat]).radius(5);
        svg.append("path")
            .datum(pingGenerator())
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#ef4444")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2")
            .attr("opacity", 0.6);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotation, selectedCoordinates, geoData]);

  // Auto-rotate towards selected coordinates if they change externally (optional, but nice polish)
  useEffect(() => {
     if (selectedCoordinates) {
         // Rotate globe to center the selection
         setRotation([-selectedCoordinates.lng, -selectedCoordinates.lat * 0.5, 0]);
     }
  }, [selectedCoordinates?.lat, selectedCoordinates?.lng]);

  return (
    <div ref={wrapperRef} className="w-full aspect-square relative overflow-hidden rounded-full border-4 border-cyan-900/50 shadow-[0_0_50px_rgba(6,182,212,0.15)] bg-black group">
      <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0_0_60px_rgba(0,0,0,0.9)] z-10"></div>
      
      {/* Grid Overlay for extra tech feel */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-20 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)]"></div>
      
      <svg ref={svgRef} className="w-full h-full z-0 transition-transform duration-700 ease-out"></svg>
      
      {!geoData && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <span className="text-cyan-500 text-xs animate-pulse">LOADING CARTOGRAPHY DATA...</span>
          </div>
      )}

      {/* Overlay UI elements */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <span className="text-[10px] text-cyan-300 bg-black/60 px-3 py-1 rounded-full border border-cyan-800 backdrop-blur-md">
            DRAG TO ROTATE • CLICK TO TARGET
         </span>
      </div>
    </div>
  );
};

export default Globe;