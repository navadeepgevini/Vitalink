import { useState, useEffect, useRef, useCallback } from 'react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

export function useAntiGravity() {
  const [isActive, setIsActive] = useState(false);
  const sequenceBuffer = useRef<string[]>([]);
  const clickTimestamps = useRef<number[]>([]);

  const activate = useCallback(() => {
    if (isActive) return;
    setIsActive(true);
    const event = new CustomEvent('vitalink:antigravity', { detail: { active: true } });
    window.dispatchEvent(event);
  }, [isActive]);

  const deactivate = useCallback(() => {
    if (!isActive) return;
    setIsActive(false);
    const event = new CustomEvent('vitalink:antigravity', { detail: { active: false } });
    window.dispatchEvent(event);
  }, [isActive]);

  const toggle = useCallback(() => {
    if (isActive) deactivate();
    else activate();
  }, [isActive, activate, deactivate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && isActive) {
        deactivate();
        return;
      }

      sequenceBuffer.current.push(e.code);
      if (sequenceBuffer.current.length > 10) {
        sequenceBuffer.current.shift();
      }

      if (sequenceBuffer.current.length === 10) {
        const matches = sequenceBuffer.current.every((code, i) => code === KONAMI_CODE[i]);
        if (matches) {
          toggle();
          sequenceBuffer.current = [];
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, toggle, deactivate]);

  const onLogoClick = useCallback(() => {
    const now = Date.now();
    clickTimestamps.current.push(now);
    
    // Filter clicks older than 3000ms
    clickTimestamps.current = clickTimestamps.current.filter(time => now - time <= 3000);
    
    if (clickTimestamps.current.length === 5) {
      toggle();
      clickTimestamps.current = [];
    }
  }, [toggle]);

  return { isActive, activate, deactivate, toggle, onLogoClick };
}
