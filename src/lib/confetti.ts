/**
 * A short, one-off confetti burst for reaching a goal — the one moment of
 * celebration in the app (SPEC §5.5). Skipped under reduced motion.
 */
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "60" });
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2f855a";
  const colors = [accent, "#f6ad55", "#63b3ed", "#f687b3", "#68d391"];
  const particles = Array.from({ length: 90 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const speed = 7 + Math.random() * 7;
    return {
      x: innerWidth / 2,
      y: innerHeight * 0.55,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  const duration = 1200;
  const start = performance.now();
  function frame(now: number) {
    const t = (now - start) / duration;
    if (t >= 1 || !ctx) return canvas.remove();
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = 1 - t * t;
    for (const p of particles) {
      p.vy += 0.35;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
