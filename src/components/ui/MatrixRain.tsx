import { useEffect, useRef, useCallback } from 'react';

const CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
  '0123456789' +
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
  'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзиклмнопрстуфхцчшщъыьэюя' +
  'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसह';

const FONT_SIZE = 14;
const COLUMN_SPACING = 18;
const FPS = 10;
const FRAME_INTERVAL = 1000 / FPS;
const CHAR_ALPHA_MAX = 0.12;
const CHAR_ALPHA_LEAD = 0.28;

interface Column {
  y: number;
  speed: number;
  length: number;
  chars: string[];
  charTimer: number;
  charInterval: number;
}

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

function createColumn(height: number): Column {
  const length = Math.floor(Math.random() * 16) + 8;
  return {
    y: Math.floor(Math.random() * -(height / FONT_SIZE)),
    speed: 0.15 + Math.random() * 0.2,
    length,
    chars: Array.from({ length }, randomChar),
    charTimer: 0,
    charInterval: Math.floor(Math.random() * 6) + 4,
  };
}

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const columnsRef = useRef<Column[]>([]);

  const initColumns = useCallback((width: number, height: number) => {
    const count = Math.floor(width / COLUMN_SPACING);
    columnsRef.current = Array.from({ length: count }, () => createColumn(height));
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;

    const cols = columnsRef.current;
    const rows = Math.ceil(height / FONT_SIZE);

    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      const x = i * COLUMN_SPACING + COLUMN_SPACING / 2;

      for (let j = 0; j < col.length; j++) {
        const row = Math.floor(col.y) - (col.length - 1 - j);
        if (row < 0 || row >= rows) continue;

        const progress = j / (col.length - 1);
        const isLead = j === col.length - 1;

        const alpha = isLead
          ? CHAR_ALPHA_LEAD
          : progress * CHAR_ALPHA_MAX;

        const leadColor = isLead
          ? `rgba(248, 249, 250, ${alpha})`
          : `rgba(173, 181, 189, ${alpha})`;
        ctx.fillStyle = leadColor;
        ctx.fillText(col.chars[j], x, row * FONT_SIZE);
      }

      col.charTimer++;
      if (col.charTimer >= col.charInterval) {
        col.charTimer = 0;
        const mutateIdx = Math.floor(Math.random() * col.length);
        col.chars[mutateIdx] = randomChar();
      }

      col.y += col.speed;

      if (col.y - col.length > rows) {
        cols[i] = createColumn(height);
        cols[i].y = -Math.floor(Math.random() * 10);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      initColumns(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = (time: number) => {
      animRef.current = requestAnimationFrame(loop);
      const delta = time - lastTimeRef.current;
      if (delta < FRAME_INTERVAL) return;
      lastTimeRef.current = time - (delta % FRAME_INTERVAL);
      draw(ctx, canvas.width, canvas.height);
    };

    animRef.current = requestAnimationFrame(loop);

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animRef.current);
      } else {
        lastTimeRef.current = 0;
        animRef.current = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [draw, initColumns]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
