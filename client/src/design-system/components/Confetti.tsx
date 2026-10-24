import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../utils/motion';
import './Confetti.css';

/** Drawn in semantic tokens so it follows the brand and theme (text is navy in light mode, near-white in dark). */
const COLOR_TOKENS = ['--color-brand', '--color-accent', '--color-success', '--color-warning', '--color-text'];
const FALLBACK_COLORS = ['#009DE0', '#DA291C', '#16A34A', '#F59E0B', '#0A2240'];

const PIECES = 160;
const DURATION_MS = 3200;
const FADE_MS = 700;
const GRAVITY = 0.32;
const DRAG = 0.985;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  wobble: number;
  color: string;
  shape: 'rect' | 'circle';
}

function themeColors(): string[] {
  const styles = getComputedStyle(document.documentElement);
  const colors = COLOR_TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter(Boolean);
  return colors.length ? colors : FALLBACK_COLORS;
}

/** Two cannons in the bottom corners, aimed up and inwards. */
function launch(width: number, height: number, count: number, colors: string[]): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const fromLeft = i % 2 === 0;
    const angle = ((fromLeft ? -60 : -120) + (Math.random() - 0.5) * 40) * (Math.PI / 180);
    const speed = (13 + Math.random() * 9) * Math.min(1.2, Math.max(0.75, height / 800));
    return {
      x: fromLeft ? -10 : width + 10,
      y: height * (0.75 + Math.random() * 0.15),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      shape: Math.random() < 0.7 ? 'rect' : 'circle',
    };
  });
}

/**
 * A one-off celebratory burst for genuinely good moments. It plays once on mount (change its `key` to
 * replay), never blocks interaction, is hidden from assistive tech, and is skipped for reduced motion.
 */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || prefersReducedMotion()) {
      setDone(true);
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Fewer pieces on narrow screens, so a phone isn't buried.
    const count = Math.round(PIECES * Math.min(1, width / 1000 + 0.35));
    const particles = launch(width, height, count, themeColors());
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = elapsed > DURATION_MS - FADE_MS ? Math.max(0, (DURATION_MS - elapsed) / FADE_MS) : 1;

      for (const p of particles) {
        p.vx *= DRAG;
        p.vy = p.vy * DRAG + GRAVITY;
        p.wobble += 0.1;
        p.x += p.vx + Math.sin(p.wobble) * 0.6;
        p.y += p.vy;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          // Scaling by the wobble fakes a paper flip.
          ctx.scale(1, Math.cos(p.wobble));
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < DURATION_MS) frame = requestAnimationFrame(tick);
      else setDone(true);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return done ? null : <canvas ref={canvasRef} className="confetti" aria-hidden="true" />;
}
