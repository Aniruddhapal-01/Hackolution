/**
 * PixelSnow — Canvas-based pixel snow / particle effect
 *
 * Props:
 *   color          — hex or css color of flakes          default "#ffffff"
 *   flakeSize      — base size multiplier (0–1)          default 0.01
 *   minFlakeSize   — minimum pixel size                  default 1.25
 *   pixelResolution— canvas resolution divisor           default 200
 *   speed          — movement speed multiplier           default 1.25
 *   density        — fraction of pixels that are flakes  default 0.3
 *   direction      — angle in degrees (0=up, 90=right)   default 125
 *   brightness     — brightness multiplier               default 1
 *   depthFade      — depth fade strength                 default 8
 *   farPlane       — max depth value                     default 20
 *   gamma          — gamma correction                    default 0.4545
 *   variant        — "square" | "circle"                 default "square"
 */

import React, { useRef, useEffect, useCallback } from "react";

interface PixelSnowProps {
  color?:           string;
  flakeSize?:       number;
  minFlakeSize?:    number;
  pixelResolution?: number;
  speed?:           number;
  density?:         number;
  direction?:       number;
  brightness?:      number;
  depthFade?:       number;
  farPlane?:        number;
  gamma?:           number;
  variant?:         "square" | "circle";
  style?:           React.CSSProperties;
  className?:       string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full  = clean.length === 3
    ? clean.split("").map(c => c + c).join("")
    : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface Flake {
  x: number;
  y: number;
  z: number;   // depth 0–farPlane
  size: number;
  speed: number;
  opacity: number;
}

export default function PixelSnow({
  color           = "#ffffff",
  flakeSize       = 0.01,
  minFlakeSize    = 1.25,
  pixelResolution = 200,
  speed           = 1.25,
  density         = 0.3,
  direction       = 125,
  brightness      = 1,
  depthFade       = 8,
  farPlane        = 20,
  gamma           = 0.4545,
  variant         = "square",
  style,
  className,
}: PixelSnowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flakesRef = useRef<Flake[]>([]);
  const rafRef    = useRef<number>(0);
  const lastRef   = useRef<number>(0);

  // Convert direction angle to dx/dy unit vector
  // 0° = up (0,-1), 90° = right (1,0), 125° = down-right
  const rad = (direction * Math.PI) / 180;
  const dx  = Math.sin(rad);
  const dy  = Math.cos(rad);

  const [r, g, b] = hexToRgb(color);

  const initFlakes = useCallback((w: number, h: number) => {
    const count = Math.floor((w / pixelResolution) * (h / pixelResolution) * density * 800);
    flakesRef.current = Array.from({ length: count }, () => {
      const z    = Math.random() * farPlane;
      const size = Math.max(minFlakeSize, flakeSize * (farPlane - z + 1) * pixelResolution * 0.05);
      return {
        x:       Math.random() * w,
        y:       Math.random() * h,
        z,
        size,
        speed:   speed * (1 + (farPlane - z) / farPlane),
        opacity: Math.random() * 0.5 + 0.5,
      };
    });
  }, [pixelResolution, density, farPlane, flakeSize, minFlakeSize, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
      initFlakes(canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (ts: number) => {
      const dt = Math.min((ts - lastRef.current) / 16.67, 3); // cap at 3 frames
      lastRef.current = ts;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      for (const f of flakesRef.current) {
        // Move
        f.x += dx * f.speed * dt;
        f.y += dy * f.speed * dt;

        // Wrap around edges
        if (f.x < -f.size)  f.x = w + f.size;
        if (f.x > w + f.size) f.x = -f.size;
        if (f.y < -f.size)  f.y = h + f.size;
        if (f.y > h + f.size) f.y = -f.size;

        // Depth-based opacity with gamma correction
        const depthRatio = (farPlane - f.z) / farPlane;
        const rawAlpha   = Math.pow(depthRatio, depthFade / farPlane) * f.opacity * brightness;
        const alpha      = Math.pow(Math.min(1, rawAlpha), gamma);

        ctx.globalAlpha = alpha;
        ctx.fillStyle   = `rgb(${r},${g},${b})`;

        if (variant === "circle") {
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
        }
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [color, flakeSize, minFlakeSize, pixelResolution, speed, density,
      direction, brightness, depthFade, farPlane, gamma, variant, initFlakes,
      dx, dy, r, g, b]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width:   "100%",
        height:  "100%",
        ...style,
      }}
    />
  );
}
