import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Star {
  id: number;
  left: string;
  top: string;
  size: string;
  delay: string;
  duration: string;
}

const STAR_COUNT = 150; // Número de estrelas
const MIN_SIZE = 1; // Tamanho mínimo em pixels
const MAX_SIZE = 3; // Tamanho máximo em pixels
const MIN_DELAY = 0; // Atraso mínimo da animação em segundos
const MAX_DELAY = 5; // Atraso máximo da animação em segundos
const MIN_DURATION = 2; // Duração mínima da animação em segundos
const MAX_DURATION = 6; // Duração máxima da animação em segundos

const AnimatedStars: React.FC = () => {
  const stars = useMemo(() => {
    const generatedStars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      generatedStars.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE}px`,
        delay: `${Math.random() * (MAX_DELAY - MIN_DELAY) + MIN_DELAY}s`,
        duration: `${Math.random() * (MAX_DURATION - MIN_DURATION) + MIN_DURATION}s`,
      });
    }
    return generatedStars;
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <div
          key={star.id}
          className={cn(
            "absolute rounded-full bg-white opacity-0",
            "shadow-[0_0_5px_2px_rgba(173,216,230,0.3)]", // Soft bluish glow
            "animate-twinkle"
          )}
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedStars;