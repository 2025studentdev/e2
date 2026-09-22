//This is /src/components/index-react/StarGazing.tsx
import React, { useState, useEffect } from 'react';

interface Star {
    id: number;
    size: number;
    top: number;
    left: number;
    delay: number;
    duration: number;
}

interface Meteor {
    id: number;
    top: string;
    right: string;
    width: number;
    delay: number;
    duration: number;
}

export default function StarGazing() {
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        const newStars = Array.from({ length: 90 }).map((_, i) => ({
            id: i,
            size: Math.random() * 2 + 1,
            top: Math.random() * 100,
            left: Math.random() * 100,
            delay: Math.random() * 5,
            duration: Math.random() * 3 + 2,
        }));
        setStars(newStars);
    }, []);

    const meteors: Meteor[] = [
        { id: 1, top: '5%',  right: '15%', width: 180, delay: 0,   duration: 5 },
        { id: 2, top: '18%', right: '35%', width: 140, delay: 2.4, duration: 7 },
        { id: 3, top: '28%', right: '5%',  width: 220, delay: 4.1, duration: 6 },
        { id: 4, top: '42%', right: '28%', width: 120, delay: 6.5, duration: 8 },
        { id: 5, top: '8%',  right: '55%', width: 160, delay: 9,   duration: 6.5 },
        { id: 6, top: '35%', right: '48%', width: 200, delay: 12,  duration: 7.5 },
    ];

    return (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#0b1021] via-[#111a3a] to-[#0a0e1c] flex flex-col items-center justify-center">
            {/* 背景中央微光 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(40,80,150,0.15)_0%,_transparent_60%)] pointer-events-none" />

            {/* 闪烁的星星 */}
            <div className="absolute inset-0 pointer-events-none">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            top: `${star.top}%`,
                            left: `${star.left}%`,
                            animation: `twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`,
                        }}
                    />
                ))}
            </div>

            {/* 流星 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {meteors.map((m) => (
                    <div
                        key={m.id}
                        className="shooting-star"
                        style={{
                            top: m.top,
                            right: m.right,
                            width: `${m.width}px`,
                            animationDelay: `${m.delay}s`,
                            animationDuration: `${m.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* 发光文字 */}
            <div className="relative z-10 text-center space-y-6 px-6">
                <h1 className="text-3xl md:text-5xl font-bold text-white tracking-[0.15em] [text-shadow:0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(255,255,255,0.5),0_0_40px_rgba(80,140,255,0.6)]">
                    我们仰望同一片星空
                </h1>
                <h2 className="text-2xl md:text-4xl font-medium text-white tracking-[0.15em] [text-shadow:0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(255,255,255,0.5),0_0_40px_rgba(80,140,255,0.6)]">
                    却各自走向不同的远方
                </h2>
            </div>

            <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 0.9; transform: scale(1.3); }
        }
        .shooting-star {
          position: absolute;
          height: 2px;
          border-radius: 9999px;
          background: linear-gradient(270deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 20%, rgba(160,200,255,0.2) 60%, transparent 100%);
          opacity: 0;
          animation-name: shooting-star;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
          transform-origin: right center;
        }
        .shooting-star::after {
          content: '';
          position: absolute;
          right: -2px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 12px 3px rgba(180,220,255,0.9), 0 0 24px 6px rgba(120,180,255,0.5);
        }
        @keyframes shooting-star {
          0%   { transform: rotate(135deg) translateX(0);      opacity: 0; }
          8%   { opacity: 1; }
          70%  { opacity: 0.9; }
          100% { transform: rotate(135deg) translateX(1600px); opacity: 0; }
        }
      `}</style>
        </div>
    );
}