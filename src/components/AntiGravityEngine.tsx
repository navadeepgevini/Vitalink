"use client";

import { useEffect, useRef, useState } from 'react';
import '../styles/antigravity.css';

interface FloatyElement {
  element: HTMLElement;
  originalStyle: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  mass: number;
}

export default function AntiGravityEngine() {
  const [showToast, setShowToast] = useState(false);
  const elementsRef = useRef<FloatyElement[]>([]);
  const requestRef = useRef<number>();

  useEffect(() => {
    const handleToggle = (e: CustomEvent) => {
      if (e.detail.active) {
        startEffect();
      } else {
        stopEffect();
      }
    };

    window.addEventListener('vitalink:antigravity', handleToggle as EventListener);
    return () => window.removeEventListener('vitalink:antigravity', handleToggle as EventListener);
  }, []);

  const startEffect = () => {
    // Collect elements
    const selectors = '.card, .stat-widget, .navbar, .sidebar, .btn, .badge, .avatar, .panel, .modal-card, [data-floatable]';
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors));
    
    // Sort by area (largest first) and take up to 40
    nodes.sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return (rectB.width * rectB.height) - (rectA.width * rectA.height);
    });
    
    const targetNodes = nodes.slice(0, 40);

    const newElements: FloatyElement[] = [];

    targetNodes.forEach(el => {
      const rect = el.getBoundingClientRect();
      const originalStyle = el.getAttribute('style') || '';
      
      // Generate physics properties
      const vx = (Math.random() - 0.5) * 12; // -6 to 6
      const vy = -4 - Math.random() * 4; // -8 to -4
      const angularVelocity = (Math.random() - 0.5) * 6; // -3 to 3
      const mass = 0.8 + Math.random() * 0.6; // 0.8 to 1.4

      newElements.push({
        element: el,
        originalStyle,
        x: rect.left,
        y: rect.top,
        vx,
        vy,
        rotation: 0,
        angularVelocity,
        mass,
      });

      // Detach from layout
      el.style.position = 'fixed';
      el.style.left = '0px';
      el.style.top = '0px';
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      el.style.margin = '0px';
      el.style.zIndex = '9999';
      el.style.transition = 'none';
      el.style.willChange = 'transform';
      el.style.pointerEvents = 'none';
      el.style.transform = `translate(${rect.left}px, ${rect.top}px) rotate(0deg)`;
    });

    elementsRef.current = newElements;
    document.body.classList.add('antigravity-active');
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);

    requestRef.current = requestAnimationFrame(physicsLoop);
  };

  const physicsLoop = () => {
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    elementsRef.current.forEach(item => {
      const rect = item.element.getBoundingClientRect();

      // Gravity
      item.vy += 0.12 * item.mass;
      
      // Air resistance
      item.vx *= 0.995;
      item.vy *= 0.995;

      item.x += item.vx;
      item.y += item.vy;
      item.rotation += item.angularVelocity;

      // Bounce
      if (item.x + rect.width > ww) {
        item.x = ww - rect.width;
        item.vx *= -1;
      } else if (item.x < 0) {
        item.x = 0;
        item.vx *= -1;
      }

      if (item.y + rect.height > wh) {
        item.y = wh - rect.height;
        item.vy *= -1;
      } else if (item.y < 0) {
        item.y = 0;
        item.vy *= -1;
      }

      item.element.style.transform = `translate(${item.x}px, ${item.y}px) rotate(${item.rotation}deg)`;
    });

    requestRef.current = requestAnimationFrame(physicsLoop);
  };

  const stopEffect = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    document.body.classList.remove('antigravity-active');

    elementsRef.current.forEach(item => {
      const el = item.element;
      el.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      // Try to figure out original bounds or just restore style
      // We will clear inline styles after transition to restore cascade
    });

    setTimeout(() => {
      elementsRef.current.forEach(item => {
        if (item.originalStyle) {
          item.element.setAttribute('style', item.originalStyle);
        } else {
          item.element.removeAttribute('style');
        }
      });
      elementsRef.current = [];
    }, 800);
  };

  if (!showToast) return null;

  return (
    <div className="antigravity-toast">
      🌌 ANTI-GRAVITY MODE
      <button onClick={() => {
        setShowToast(false);
        const event = new CustomEvent('vitalink:antigravity', { detail: { active: false } });
        window.dispatchEvent(event);
      }} className="ml-2 bg-white/20 hover:bg-white/30 rounded-full w-5 h-5 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer">
        ×
      </button>
    </div>
  );
}
