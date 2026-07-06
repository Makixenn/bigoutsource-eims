import React, { useEffect, useRef } from 'react';

interface LoginBackgroundProps {
  children?: React.ReactNode;
}

export const LoginBackground: React.FC<LoginBackgroundProps> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const numNodes = 20; // ~15-25 nodes
    const maxLinkDistance = 280;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      phase: number;
      phaseSpeed: number;
    }

    const nodes: Node[] = Array.from({ length: numNodes }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 2, // 2-4px
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.01 + Math.random() * 0.02,
    }));

    const maxSpeed = 0.5;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDistance) {
            const opacity = 1 - (dist / maxLinkDistance);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(31, 111, 160, ${opacity * 0.4})`; // #1f6fa0
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const node of nodes) {
        if (!prefersReducedMotion) {
          node.vx += (Math.random() - 0.5) * 0.05;
          node.vy += (Math.random() - 0.5) * 0.05;

          const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
          if (speed > maxSpeed) {
            node.vx = (node.vx / speed) * maxSpeed;
            node.vy = (node.vy / speed) * maxSpeed;
          }

          node.x += node.vx;
          node.y += node.vy;

          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;

          node.phase += node.phaseSpeed;
        }

        const baseOpacity = 0.4 + Math.sin(node.phase) * 0.3; // soft glow/pulse
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31, 111, 160, ${baseOpacity})`;
        ctx.fill();

        // soft halo around node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31, 111, 160, ${baseOpacity * 0.2})`;
        ctx.fill();
      }

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#ffffff] via-[#f3f7fa] to-[#eaf2f7]">
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 blur-[2px]"
      />
      {/* Light radial vignette */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.04) 100%)' }} 
      />
      
      {/* Content Layer */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
};
