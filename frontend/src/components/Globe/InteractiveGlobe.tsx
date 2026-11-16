import React, { useRef, useEffect, useState } from 'react';
import { LAUNCH_SITES } from '../../data/spaceData';
import { LaunchSite } from '../../types';
import { Globe, Compass, Maximize2, RotateCcw, Crosshair } from 'lucide-react';

interface InteractiveGlobeProps {
  onSelectSite?: (site: LaunchSite) => void;
  selectedSiteId?: string | null;
}

export const InteractiveGlobe: React.FC<InteractiveGlobeProps> = ({ onSelectSite, selectedSiteId }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<{ lambda: number; phi: number }>({ lambda: -45, phi: 25 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredSite, setHoveredSite] = useState<LaunchSite | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const animFrameRef = useRef<number | null>(null);

  // Simplified continent landmasses in lat/long polygons for lightweight, ultra-crisp rendering
  const landmasses = [
    // North America
    [[70, -160], [70, -60], [50, -55], [30, -80], [25, -80], [15, -90], [8, -78], [15, -95], [20, -105], [30, -115], [50, -125], [65, -165], [70, -160]],
    // South America
    [[10, -75], [5, -50], [-10, -35], [-25, -45], [-45, -65], [-55, -70], [-40, -73], [-20, -70], [0, -80], [10, -75]],
    // Eurasia
    [[70, 30], [75, 80], [70, 140], [60, 170], [40, 140], [30, 120], [20, 108], [10, 100], [20, 80], [25, 60], [30, 35], [40, 25], [60, 5], [70, 30]],
    // Africa
    [[35, -5], [37, 10], [32, 32], [12, 44], [-5, 40], [-25, 33], [-35, 20], [-15, 12], [5, 2], [15, -17], [35, -5]],
    // Australia
    [[-12, 130], [-12, 142], [-25, 153], [-38, 148], [-35, 115], [-20, 114], [-12, 130]],
    // India subcontinent detail
    [[30, 72], [28, 85], [22, 88], [13, 80], [8, 77], [15, 73], [24, 68], [30, 72]],
    // UK & Europe coast
    [[58, -5], [58, 2], [50, 0], [45, -1], [43, 6], [45, 13], [54, 10], [55, 5], [58, -5]]
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      width = canvas.width;
      height = canvas.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let orbitAngle = 0;

    const render = () => {
      if (autoRotate && !isDragging) {
        setRotation(prev => ({
          ...prev,
          lambda: (prev.lambda + 0.15) % 360
        }));
      }

      orbitAngle += 0.02;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.38;
      const radius = baseRadius * zoom;

      // 1. Deep Space Atmospheric Glow Behind Earth
      const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.85, cx, cy, radius * 1.35);
      outerGlow.addColorStop(0, 'rgba(57, 213, 242, 0.28)');
      outerGlow.addColorStop(0.5, 'rgba(100, 140, 255, 0.12)');
      outerGlow.addColorStop(1, 'rgba(5, 9, 20, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Earth Globe Sphere (Dark Blue Oceans)
      const oceanGrad = ctx.createRadialGradient(
        cx - radius * 0.35, 
        cy - radius * 0.35, 
        radius * 0.1, 
        cx, 
        cy, 
        radius
      );
      oceanGrad.addColorStop(0, '#102A4A');
      oceanGrad.addColorStop(0.65, '#0A182F');
      oceanGrad.addColorStop(1, '#050D1D');

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();
      ctx.clip(); // Clip everything to Earth circle

      // Projection helper: lat/long -> 3D sphere -> 2D canvas
      const project = (latDeg: number, lngDeg: number): { x: number; y: number; visible: boolean; depth: number } => {
        const rad = Math.PI / 180;
        const lambda = (lngDeg + rotation.lambda) * rad;
        const phi = (latDeg - rotation.phi) * rad;

        // Spherical coordinate mapping
        const x3d = Math.cos(phi) * Math.sin(lambda);
        const y3d = -Math.sin(phi);
        const z3d = Math.cos(phi) * Math.cos(lambda);

        const visible = z3d > -0.05; // slightly over horizon for depth
        const x = cx + x3d * radius;
        const y = cy + y3d * radius;

        return { x, y, visible, depth: z3d };
      };

      // 3. Latitude & Longitude Graticules
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(57, 213, 242, 0.08)';

      // Longitude meridians every 30 deg
      for (let lon = -180; lon < 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 5) {
          const pt = project(lat, lon);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Latitude parallels every 20 deg
      for (let lat = -60; lat <= 60; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 5) {
          const pt = project(lat, lon);
          if (pt.visible) {
            if (!started) {
              ctx.moveTo(pt.x, pt.y);
              started = true;
            } else {
              ctx.lineTo(pt.x, pt.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // 4. Render Continents
      landmasses.forEach(poly => {
        ctx.beginPath();
        let pointsVisible = 0;
        let first = true;

        poly.forEach(([lat, lng]) => {
          const pt = project(lat, lng);
          if (pt.visible) pointsVisible++;
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.closePath();

        if (pointsVisible > 0) {
          ctx.fillStyle = 'rgba(30, 58, 95, 0.85)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(57, 213, 242, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });

      // 5. Orbital Path Ring (Simulating Low Earth Orbit Constellation)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.18, radius * 0.42, 25 * Math.PI / 180, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(57, 213, 242, 0.25)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Satellite position along orbit
      const satOrbitRadiusX = radius * 1.18;
      const satOrbitRadiusY = radius * 0.42;
      const satAngle = orbitAngle;
      const rawSatX = Math.cos(satAngle) * satOrbitRadiusX;
      const rawSatY = Math.sin(satAngle) * satOrbitRadiusY;
      const rotRad = 25 * Math.PI / 180;
      const satX = cx + rawSatX * Math.cos(rotRad) - rawSatY * Math.sin(rotRad);
      const satY = cy + rawSatX * Math.sin(rotRad) + rawSatY * Math.cos(rotRad);

      // Satellite glowing beacon
      ctx.fillStyle = '#39D5F2';
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(satX, satY, 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(57, 213, 242, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // 6. Day/Night Terminator Shadow
      const shadeGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius * 0.7, cy + radius * 0.7);
      shadeGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadeGrad.addColorStop(0.55, 'rgba(3, 7, 18, 0.4)');
      shadeGrad.addColorStop(1, 'rgba(2, 5, 12, 0.88)');
      ctx.fillStyle = shadeGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 7. Atmospheric Horizon Rim Light
      const rimGrad = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius);
      rimGrad.addColorStop(0, 'rgba(57, 213, 242, 0)');
      rimGrad.addColorStop(0.85, 'rgba(57, 213, 242, 0.2)');
      rimGrad.addColorStop(1, 'rgba(167, 139, 250, 0.45)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // End Earth circle clipping

      // 8. Render Launch Complex Pins (On outer layer so labels don't get clipped)
      LAUNCH_SITES.forEach(site => {
        const pt = project(site.coordinates[0], site.coordinates[1]);
        if (pt.visible && pt.depth > 0.05) {
          const isSelected = selectedSiteId === site.id;
          const isHovered = hoveredSite?.id === site.id;

          // Pulse ring
          const pulseSize = 6 + Math.sin(orbitAngle * 4) * 3;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isSelected ? pulseSize + 4 : pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected 
            ? 'rgba(57, 213, 242, 0.8)' 
            : isHovered 
              ? 'rgba(167, 139, 250, 0.8)' 
              : 'rgba(57, 213, 242, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Center solid pip
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isSelected ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#39D5F2' : isHovered ? '#A78BFA' : '#648CFF';
          ctx.fill();

          // Label callout for selected or hovered site
          if (isSelected || isHovered) {
            ctx.save();
            ctx.font = '600 11px "Space Grotesk", sans-serif';
            const labelText = site.name.split('&')[0].trim();
            const textWidth = ctx.measureText(labelText).width;

            // Callout line
            ctx.strokeStyle = isSelected ? '#39D5F2' : '#A78BFA';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pt.x + 18, pt.y - 18);
            ctx.lineTo(pt.x + 24 + textWidth, pt.y - 18);
            ctx.stroke();

            // Label background tag
            ctx.fillStyle = 'rgba(10, 18, 34, 0.92)';
            ctx.fillRect(pt.x + 20, pt.y - 30, textWidth + 12, 18);
            ctx.strokeStyle = 'rgba(57, 213, 242, 0.3)';
            ctx.strokeRect(pt.x + 20, pt.y - 30, textWidth + 12, 18);

            // Text
            ctx.fillStyle = '#EAF3FF';
            ctx.fillText(labelText, pt.x + 26, pt.y - 17);
            ctx.restore();
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [rotation, zoom, autoRotate, isDragging, selectedSiteId, hoveredSite]);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setRotation(prev => ({
        lambda: prev.lambda + deltaX * 0.45,
        phi: Math.max(-80, Math.min(80, prev.phi - deltaY * 0.45))
      }));

      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Hover detection for launch sites
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const mouseX = (e.clientX - rect.left) * dpr;
    const mouseY = (e.clientY - rect.top) * dpr;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.38 * zoom;

    let foundSite: LaunchSite | null = null;

    LAUNCH_SITES.forEach(site => {
      const rad = Math.PI / 180;
      const lambda = (site.coordinates[1] + rotation.lambda) * rad;
      const phi = (site.coordinates[0] - rotation.phi) * rad;

      const x3d = Math.cos(phi) * Math.sin(lambda);
      const y3d = -Math.sin(phi);
      const z3d = Math.cos(phi) * Math.cos(lambda);

      if (z3d > 0.1) {
        const sx = cx + x3d * radius;
        const sy = cy + y3d * radius;
        const dist = Math.hypot(mouseX - sx, mouseY - sy);
        if (dist < 18 * dpr) {
          foundSite = site;
        }
      }
    });

    setHoveredSite(foundSite);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredSite && onSelectSite) {
      onSelectSite(hoveredSite);
    }
  };

  const resetView = () => {
    setRotation({ lambda: -45, phi: 25 });
    setZoom(1);
    setAutoRotate(true);
  };

  return (
    <div className="relative w-full h-full min-h-[460px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#070D1A] to-[#040812] border border-[#39D5F2]/15 shadow-2xl">
      {/* Background radial starry field */}
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,213,242,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Top telemetry HUD indicator */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A1222]/85 border border-[#39D5F2]/25 backdrop-blur-md text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#39D5F2] font-semibold">ORBITAL TELEMETRY</span>
          <span className="text-[#8798B3]">| GSI-EARTH 3D</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#8798B3] bg-[#0A1222]/60 px-2.5 py-1 rounded-md border border-white/5">
          <Crosshair className="w-3.5 h-3.5 text-[#39D5F2]" />
          <span>ROT: {Math.round(rotation.lambda % 360)}° λ / {Math.round(rotation.phi)}° φ</span>
        </div>
      </div>

      {/* Control buttons overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 backdrop-blur-md ${
            autoRotate 
              ? 'bg-[#39D5F2]/15 border-[#39D5F2]/40 text-[#39D5F2]' 
              : 'bg-[#0A1222]/80 border-white/10 text-[#8798B3] hover:text-white'
          }`}
          title="Toggle Earth Auto-Rotation"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          <span>{autoRotate ? 'AUTO' : 'MANUAL'}</span>
        </button>

        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 1.8))}
          className="w-8 h-8 rounded-lg bg-[#0A1222]/80 border border-white/10 hover:border-[#39D5F2]/40 text-[#EAF3FF] flex items-center justify-center text-sm font-mono backdrop-blur-md hover:bg-[#101B2D]"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.7))}
          className="w-8 h-8 rounded-lg bg-[#0A1222]/80 border border-white/10 hover:border-[#39D5F2]/40 text-[#EAF3FF] flex items-center justify-center text-sm font-mono backdrop-blur-md hover:bg-[#101B2D]"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-lg bg-[#0A1222]/80 border border-white/10 hover:border-[#39D5F2]/40 text-[#8798B3] hover:text-[#39D5F2] flex items-center justify-center backdrop-blur-md"
          title="Reset Alignment"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Main 3D Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {/* Bottom telemetry legend */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-4 text-[11px] font-mono text-[#8798B3] bg-[#0A1222]/85 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#39D5F2]" />
            <span>PRIMARY SPACEPORT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
            <span>SELECTED COMPLEX</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#39D5F2]/60" />
            <span>LEO ORBITAL TRAJECTORY</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#8798B3] bg-[#0A1222]/85 px-3 py-1.5 rounded-lg border border-white/10 backdrop-blur-md pointer-events-auto">
          <span className="text-[#39D5F2] font-semibold">{LAUNCH_SITES.length}</span> GLOBAL LAUNCH SITES ACTIVE
        </div>
      </div>
    </div>
  );
};
