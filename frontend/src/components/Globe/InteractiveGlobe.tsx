import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { LAUNCH_SITES } from '../../data/spaceData';
import { Globe, Compass, RotateCcw, Crosshair } from 'lucide-react';

export interface GlobeMarkerSite {
  id?: string;
  name?: string;
  siteName?: string;
  country: string;
  coordinates: [number, number];
  totalLaunches?: number;
  successRate?: number;
  verified?: boolean;
  [key: string]: any;
}

interface InteractiveGlobeProps {
  onSelectSite?: (site: any) => void;
  selectedSiteId?: string | null;
  launchSites?: any[];
}

// GLSL Shaders for Photorealistic Textured Earth viewed from space
const VS_SOURCE = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FS_SOURCE = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_radius;
uniform vec2 u_rotation; // lambda, phi in degrees
uniform sampler2D u_earthTex;
uniform sampler2D u_cloudTex;
uniform float u_cloudOffset;
uniform float u_hasClouds;

const float PI = 3.141592653589793;
const float RAD2DEG = 180.0 / PI;

void main() {
  // Convert from WebGL coordinates (bottom-up) to viewport screen coordinates (top-down)
  vec2 screenPixel = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  vec2 delta = screenPixel - u_center;
  float dist = length(delta);
  float distNorm = dist / u_radius;

  // Space outside Earth and atmosphere
  if (distNorm > 1.14) {
    discard;
  }

  // Realistic Rayleigh atmospheric halo outside the planet silhouette
  vec3 atmoBlue = vec3(0.24, 0.62, 0.98);
  vec3 sunDir = normalize(vec3(-0.55, -0.42, 0.72)); // Sunlight from upper-left

  if (distNorm > 1.0) {
    float atmoAlpha = smoothstep(1.14, 1.0, distNorm) * 0.42;
    vec2 normal2D = normalize(delta);
    float sunFacing = max(0.0, dot(vec3(normal2D, 0.0), -sunDir));
    atmoAlpha *= (0.35 + 0.65 * sunFacing);
    gl_FragColor = vec4(atmoBlue * atmoAlpha, atmoAlpha);
    return;
  }

  // Unit sphere coordinate reconstruction
  float x3d = delta.x / u_radius;
  float y3d = delta.y / u_radius;
  float z3d = sqrt(max(0.0, 1.0 - x3d * x3d - y3d * y3d));

  // Invert 3D orthographic projection into geographic latitude and longitude
  float phi = asin(clamp(-y3d, -1.0, 1.0));
  float lambda = atan(x3d, z3d);

  float latDeg = phi * RAD2DEG + u_rotation.y;
  float lngDeg = lambda * RAD2DEG - u_rotation.x;

  // Equirectangular UV coordinate mapping
  float u = fract((lngDeg + 180.0) / 360.0);
  float v = clamp((90.0 - latDeg) / 180.0, 0.001, 0.999);

  // Sample NASA high-resolution surface texture
  vec4 earthTex = texture2D(u_earthTex, vec2(u, v));

  // Physical directional lighting
  vec3 N = vec3(x3d, y3d, z3d);
  float diffuse = max(0.0, dot(N, sunDir));

  // Ocean specular reflection (water reflects sunlight glint)
  float oceanMask = clamp((earthTex.b - earthTex.r * 1.1) * 3.5, 0.0, 1.0);
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(sunDir + V);
  float spec = pow(max(0.0, dot(N, H)), 32.0) * oceanMask * diffuse * 0.60;

  // Day/night surface shading with rich dark side
  vec3 dayColor = earthTex.rgb * (0.12 + 0.88 * diffuse) + vec3(0.65, 0.88, 1.0) * spec;

  // Subtle realistic cloud coverage
  if (u_hasClouds > 0.5) {
    float cloudU = fract(u + u_cloudOffset);
    vec4 cloudTex = texture2D(u_cloudTex, vec2(cloudU, v));
    float cloudDensity = cloudTex.a * cloudTex.r * 0.65;
    vec3 cloudLit = vec3(0.96, 0.98, 1.0) * (0.16 + 0.84 * diffuse);
    dayColor = mix(dayColor, cloudLit, cloudDensity);
  }

  // Atmospheric limb glow (thin blue layer visible along Earth curvature)
  float rim = pow(1.0 - z3d, 3.2);
  vec3 limbGlow = atmoBlue * rim * 0.55 * (0.3 + 0.7 * diffuse);
  dayColor += limbGlow;

  // Smooth antialiased silhouette transition
  float edgeAlpha = smoothstep(1.0, 0.996, distNorm);

  gl_FragColor = vec4(dayColor, edgeAlpha);
}
`;

export const InteractiveGlobe: React.FC<InteractiveGlobeProps> = ({ 
  onSelectSite, 
  selectedSiteId,
  launchSites 
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [rotation, setRotation] = useState<{ lambda: number; phi: number }>({ lambda: -45, phi: 25 });
  const [zoom, setZoom] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredSite, setHoveredSite] = useState<any | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // References for WebGL state & animation loop
  const animFrameRef = useRef<number | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const earthTextureRef = useRef<WebGLTexture | null>(null);
  const cloudTextureRef = useRef<WebGLTexture | null>(null);
  const texturesLoadedRef = useRef<{ earth: boolean; clouds: boolean }>({ earth: false, clouds: false });
  const cloudOffsetRef = useRef<number>(0);
  const orbitAngleRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const autoRotateRef = useRef<boolean>(true);
  const rotationRef = useRef<{ lambda: number; phi: number }>({ lambda: -45, phi: 25 });
  const zoomRef = useRef<number>(1);

  // Sync state to refs for high-performance animation loop
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Normalize active sites to guarantee verified coordinates and clean identifiers
  const activeSites = useMemo(() => {
    if (launchSites && launchSites.length > 0) {
      return launchSites
        .filter((s: any) => 
          s.coordinates && 
          Array.isArray(s.coordinates) && 
          s.coordinates.length === 2 && 
          s.coordinates[0] !== null && 
          s.coordinates[1] !== null &&
          !isNaN(s.coordinates[0]) &&
          !isNaN(s.coordinates[1])
        )
        .map((s: any) => {
          const name = s.siteName || s.name || '';
          return {
            id: s.id || s.siteName || s.name || '',
            name,
            country: s.country || '',
            coordinates: s.coordinates as [number, number],
            totalLaunches: s.totalLaunches ?? 0,
            successRate: s.successRate ?? 0,
            raw: s
          };
        });
    }

    return LAUNCH_SITES.map(s => ({
      id: s.id,
      name: s.name,
      country: s.country,
      coordinates: s.coordinates,
      totalLaunches: s.totalLaunches,
      successRate: s.successRate,
      raw: s
    }));
  }, [launchSites]);

  // When selectedSiteId changes, orient the globe smoothly to center on the selected site
  useEffect(() => {
    if (!selectedSiteId) return;

    const target = activeSites.find(s => 
      s.id === selectedSiteId || 
      s.name.toLowerCase() === selectedSiteId.toLowerCase() ||
      s.name.toLowerCase().startsWith(selectedSiteId.toLowerCase()) ||
      selectedSiteId.toLowerCase().startsWith(s.name.toLowerCase())
    );

    if (target && target.coordinates) {
      // Bring target coordinates to facing camera position
      const newRot = {
        lambda: -(target.coordinates[1] + 90),
        phi: target.coordinates[0]
      };
      setRotation(newRot);
      rotationRef.current = newRot;
      setAutoRotate(false);
      autoRotateRef.current = false;
    }
  }, [selectedSiteId, activeSites]);

  // Initialize WebGL Shaders and Textures
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;

    const gl = glCanvas.getContext('webgl', { alpha: true, antialias: true }) || 
               glCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      console.warn('WebGL not supported, falling back to 2D canvas');
      return;
    }
    glRef.current = gl;

    // Compile Shader helper
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Uniform locations
    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      center: gl.getUniformLocation(program, 'u_center'),
      radius: gl.getUniformLocation(program, 'u_radius'),
      rotation: gl.getUniformLocation(program, 'u_rotation'),
      earthTex: gl.getUniformLocation(program, 'u_earthTex'),
      cloudTex: gl.getUniformLocation(program, 'u_cloudTex'),
      cloudOffset: gl.getUniformLocation(program, 'u_cloudOffset'),
      hasClouds: gl.getUniformLocation(program, 'u_hasClouds')
    };

    // Fullscreen rendering quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Texture creation helper
    const loadGLTexture = (url: string, isCloud = false): WebGLTexture | null => {
      const texture = gl.createTexture();
      if (!texture) return null;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      // Placeholder while image is loading
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
        gl.UNSIGNED_BYTE, new Uint8Array([10, 26, 47, 255])
      );

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!glRef.current) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        if (isCloud) {
          texturesLoadedRef.current.clouds = true;
        } else {
          texturesLoadedRef.current.earth = true;
        }
      };
      img.src = url;
      return texture;
    };

    // Load local NASA satellite textures from project assets
    earthTextureRef.current = loadGLTexture('/assets/earth_atmos_2048.jpg', false);
    cloudTextureRef.current = loadGLTexture('/assets/earth_clouds_1024.png', true);

    return () => {
      if (gl) {
        if (program) gl.deleteProgram(program);
        if (vs) gl.deleteShader(vs);
        if (fs) gl.deleteShader(fs);
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (earthTextureRef.current) gl.deleteTexture(earthTextureRef.current);
        if (cloudTextureRef.current) gl.deleteTexture(cloudTextureRef.current);
      }
    };
  }, []);

  // Main Render & Animation Loop
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.floor(rect.width * dpr);
      const targetH = Math.floor(rect.height * dpr);

      canvas.width = targetW;
      canvas.height = targetH;

      if (glCanvas) {
        glCanvas.width = targetW;
        glCanvas.height = targetH;
        if (glRef.current) {
          glRef.current.viewport(0, 0, targetW, targetH);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const renderFrame = () => {
      // Auto-rotation update
      if (autoRotateRef.current && !isDraggingRef.current) {
        const nextLambda = (rotationRef.current.lambda + 0.12) % 360;
        rotationRef.current.lambda = nextLambda;
        setRotation(prev => ({ ...prev, lambda: nextLambda }));
      }

      orbitAngleRef.current += 0.018;
      cloudOffsetRef.current = (cloudOffsetRef.current + 0.00015) % 1.0;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = Math.min(width, height) * 0.38;
      const radius = baseRadius * zoomRef.current;
      const currentRot = rotationRef.current;

      // ----------------------------------------------------
      // 1. WebGL Realistic Earth Rendering
      // ----------------------------------------------------
      const gl = glRef.current;
      const program = programRef.current;
      const uniforms = uniformsRef.current;

      if (gl && program && earthTextureRef.current) {
        gl.viewport(0, 0, width, height);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.uniform2f(uniforms.resolution, width, height);
        gl.uniform2f(uniforms.center, cx, cy);
        gl.uniform1f(uniforms.radius, radius);
        gl.uniform2f(uniforms.rotation, currentRot.lambda, currentRot.phi);
        gl.uniform1f(uniforms.cloudOffset, cloudOffsetRef.current);
        gl.uniform1f(uniforms.hasClouds, texturesLoadedRef.current.clouds ? 1.0 : 0.0);

        // Bind Earth surface texture (unit 0)
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, earthTextureRef.current);
        gl.uniform1i(uniforms.earthTex, 0);

        // Bind Cloud texture (unit 1)
        if (cloudTextureRef.current) {
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, cloudTextureRef.current);
          gl.uniform1i(uniforms.cloudTex, 1);
        }

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // ----------------------------------------------------
      // 2. 2D Canvas Overlay: Pins, Labels, Orbital Track
      // ----------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      // Deep space outer atmospheric haze
      const outerGlow = ctx.createRadialGradient(cx, cy, radius * 0.90, cx, cy, radius * 1.30);
      outerGlow.addColorStop(0, 'rgba(57, 213, 242, 0.18)');
      outerGlow.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
      outerGlow.addColorStop(1, 'rgba(5, 9, 20, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Orthographic Projection helper: lat/long -> 3D sphere -> 2D screen
      const project = (latDeg: number, lngDeg: number): { x: number; y: number; visible: boolean; depth: number } => {
        const rad = Math.PI / 180;
        const lambda = (lngDeg + currentRot.lambda) * rad;
        const phi = (latDeg - currentRot.phi) * rad;

        const x3d = Math.cos(phi) * Math.sin(lambda);
        const y3d = -Math.sin(phi);
        const z3d = Math.cos(phi) * Math.cos(lambda);

        const visible = z3d > -0.02; // visible on front hemisphere
        const x = cx + x3d * radius;
        const y = cy + y3d * radius;

        return { x, y, visible, depth: z3d };
      };

      // Low Earth Orbit (LEO) Constellation Path
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.18, radius * 0.44, 25 * Math.PI / 180, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(57, 213, 242, 0.28)';
      ctx.setLineDash([4, 6]);
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Satellite position along orbit
      const satOrbitRadiusX = radius * 1.18;
      const satOrbitRadiusY = radius * 0.44;
      const satAngle = orbitAngleRef.current;
      const rawSatX = Math.cos(satAngle) * satOrbitRadiusX;
      const rawSatY = Math.sin(satAngle) * satOrbitRadiusY;
      const rotRad = 25 * Math.PI / 180;
      const satX = cx + rawSatX * Math.cos(rotRad) - rawSatY * Math.sin(rotRad);
      const satY = cy + rawSatX * Math.sin(rotRad) + rawSatY * Math.cos(rotRad);

      // Glowing satellite beacon
      ctx.fillStyle = '#39D5F2';
      ctx.beginPath();
      ctx.arc(satX, satY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(satX, satY, 9, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(57, 213, 242, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // Launch Complex Pins and Information Callouts
      activeSites.forEach(site => {
        const pt = project(site.coordinates[0], site.coordinates[1]);
        if (pt.visible && pt.depth > 0.05) {
          const isSelected = selectedSiteId === site.id || 
            (selectedSiteId && (
              site.name.toLowerCase() === selectedSiteId.toLowerCase() || 
              site.id.toLowerCase() === selectedSiteId.toLowerCase()
            ));
          const isHovered = hoveredSite?.id === site.id;

          // Animated pulse ring
          const pulseSize = 6 + Math.sin(orbitAngleRef.current * 4) * 3;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isSelected ? pulseSize + 4 : pulseSize, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected 
            ? 'rgba(57, 213, 242, 0.95)' 
            : isHovered 
              ? 'rgba(167, 139, 250, 0.90)' 
              : 'rgba(57, 213, 242, 0.45)';
          ctx.lineWidth = isSelected ? 2 : 1.4;
          ctx.stroke();

          // Center solid pip
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, isSelected ? 5.5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? '#39D5F2' : isHovered ? '#A78BFA' : '#648CFF';
          ctx.fill();

          // Label callout for selected or hovered site
          if (isSelected || isHovered) {
            ctx.save();
            ctx.font = '600 11px "Space Grotesk", sans-serif';
            const cleanName = site.name.split('&')[0].split('(')[0].trim();
            const labelText = site.totalLaunches > 0 
              ? `${cleanName} (${site.totalLaunches.toLocaleString()})`
              : cleanName;
            const textWidth = ctx.measureText(labelText).width;

            // Callout line
            ctx.strokeStyle = isSelected ? '#39D5F2' : '#A78BFA';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
            ctx.lineTo(pt.x + 18, pt.y - 18);
            ctx.lineTo(pt.x + 24 + textWidth, pt.y - 18);
            ctx.stroke();

            // Label background tag
            ctx.fillStyle = 'rgba(7, 13, 26, 0.94)';
            ctx.fillRect(pt.x + 20, pt.y - 30, textWidth + 12, 19);
            ctx.strokeStyle = isSelected ? 'rgba(57, 213, 242, 0.5)' : 'rgba(167, 139, 250, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(pt.x + 20, pt.y - 30, textWidth + 12, 19);

            // Text
            ctx.fillStyle = '#EAF3FF';
            ctx.fillText(labelText, pt.x + 26, pt.y - 16);
            ctx.restore();
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeSites, selectedSiteId, hoveredSite]);

  // Mouse drag & navigation handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setAutoRotate(false);
    autoRotateRef.current = false;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newLambda = rotationRef.current.lambda + deltaX * 0.45;
      const newPhi = Math.max(-80, Math.min(80, rotationRef.current.phi - deltaY * 0.45));

      rotationRef.current = { lambda: newLambda, phi: newPhi };
      setRotation({ lambda: newLambda, phi: newPhi });
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
    const radius = Math.min(canvas.width, canvas.height) * 0.38 * zoomRef.current;

    let foundSite: any | null = null;

    activeSites.forEach(site => {
      const rad = Math.PI / 180;
      const lambda = (site.coordinates[1] + rotationRef.current.lambda) * rad;
      const phi = (site.coordinates[0] - rotationRef.current.phi) * rad;

      const x3d = Math.cos(phi) * Math.sin(lambda);
      const y3d = -Math.sin(phi);
      const z3d = Math.cos(phi) * Math.cos(lambda);

      if (z3d > 0.05) {
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
      onSelectSite(hoveredSite.raw || hoveredSite);
    }
  };

  const resetView = () => {
    const initialRot = { lambda: -45, phi: 25 };
    setRotation(initialRot);
    rotationRef.current = initialRot;
    setZoom(1);
    zoomRef.current = 1;
    setAutoRotate(true);
    autoRotateRef.current = true;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] flex items-center justify-center select-none overflow-hidden rounded-2xl bg-gradient-to-b from-[#070D1A] to-[#040812] border border-[#39D5F2]/15 shadow-2xl"
    >
      {/* Background radial starry field */}
      <div className="absolute inset-0 bg-grid-lines opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(57,213,242,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Top telemetry HUD indicator */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A1222]/85 border border-[#39D5F2]/25 backdrop-blur-md text-xs font-mono shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#39D5F2] font-semibold">ORBITAL TELEMETRY</span>
          <span className="text-[#8798B3]">| GSI-EARTH 3D</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#8798B3] bg-[#0A1222]/60 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-md">
          <Crosshair className="w-3.5 h-3.5 text-[#39D5F2]" />
          <span>ROT: {Math.round(rotation.lambda % 360)}° λ / {Math.round(rotation.phi)}° φ</span>
        </div>
      </div>

      {/* Control buttons overlay */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
        <button
          onClick={() => {
            const next = !autoRotate;
            setAutoRotate(next);
            autoRotateRef.current = next;
          }}
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

      {/* Layer 1: Hardware-accelerated WebGL Textured Photorealistic Earth Canvas */}
      <canvas
        ref={glCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Layer 2: 2D Interactive Telemetry Overlay (Pins, Labels, Mouse Events) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-[2]"
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
          <span className="text-[#39D5F2] font-semibold">{activeSites.length}</span> GLOBAL LAUNCH SITES ACTIVE
        </div>
      </div>
    </div>
  );
};
