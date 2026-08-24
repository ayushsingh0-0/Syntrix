import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

/**
 * @author: @dorianbaffier (adapted for Syntrix design system)
 * @description: KokonutUI Smooth Tab with physics-driven sliding highlight pill & waveform transitions
 * @version: 1.0.0
 * @website: https://kokonutui.com
 */

export interface SmoothTabItem {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon | React.ReactNode;
  content?: React.ReactNode;
  cardContent?: React.ReactNode;
  color?: string;
}

const WaveformPath = () => (
  <motion.path
    animate={{
      x: [0, 10, 0],
      transition: {
        duration: 5,
        ease: 'linear',
        repeat: Number.POSITIVE_INFINITY,
      },
    }}
    d="M0 50 
       C 20 40, 40 30, 60 50
       C 80 70, 100 60, 120 50
       C 140 40, 160 30, 180 50
       C 200 70, 220 60, 240 50
       C 260 40, 280 30, 300 50
       C 320 70, 340 60, 360 50
       C 380 40, 400 30, 420 50
       L 420 100 L 0 100 Z"
    initial={false}
  />
);

export function TabCardContent({
  title,
  description,
  accentColor = '#F5AE4D',
}: {
  title: string;
  description: string;
  accentColor?: string;
}) {
  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden', padding: '24px' }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', bottom: 0, width: '100%', height: '128px', opacity: 0.15 }}
          preserveAspectRatio="none"
          viewBox="0 0 420 100"
        >
          <motion.g
            animate={{ opacity: 0.18 }}
            style={{ fill: accentColor, stroke: accentColor, strokeWidth: 1 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WaveformPath />
          </motion.g>
          <motion.g
            animate={{ opacity: 0.12 }}
            style={{ fill: accentColor, stroke: accentColor, strokeWidth: 1, transform: 'translateY(10px)' }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <WaveformPath />
          </motion.g>
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '1.35rem', fontWeight: 750, color: 'var(--foreground, #20201D)', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--foreground-secondary, #77756D)', lineHeight: 1.6, maxWidth: '90%' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

export interface SmoothTabsProps {
  tabs: SmoothTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  showCards?: boolean;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '60px' : '-60px',
    opacity: 0,
    filter: 'blur(4px)',
    position: 'absolute' as const,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    position: 'relative' as const,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '60px' : '-60px',
    opacity: 0,
    filter: 'blur(4px)',
    position: 'absolute' as const,
  }),
};

export const SmoothTabs: React.FC<SmoothTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  showCards = false,
}) => {
  const [direction, setDirection] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  const updateIndicator = () => {
    const activeEl = tabRefs.current[activeIndex];
    const containerEl = containerRef.current;
    if (activeEl && containerEl) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, tabs]);

  const handleTabClick = (tabId: string, index: number) => {
    if (tabId === activeTab) return;
    setDirection(index > activeIndex ? 1 : -1);
    onChange(tabId);
  };

  const selectedItem = tabs[activeIndex] || tabs[0];

  return (
    <div className={`syntrix-smooth-tabs-container ${className}`} style={{ width: '100%' }}>
      {/* Tab Navigation Pill Bar */}
      <div
        ref={containerRef}
        role="tablist"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px',
          background: 'var(--surface-secondary, #EEEADF)',
          borderRadius: '12px',
          border: '1px solid var(--border, #DDD9CC)',
          userSelect: 'none',
          marginBottom: showCards ? '16px' : '0',
        }}
      >
        {/* Animated Sliding Highlight Pill */}
        <motion.div
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity,
          }}
          transition={{
            type: 'spring',
            stiffness: 480,
            damping: 34,
          }}
          style={{
            position: 'absolute',
            top: '4px',
            bottom: '4px',
            borderRadius: '9px',
            background: selectedItem?.color || 'var(--primary, #F5AE4D)',
            boxShadow: '0 2px 8px rgba(245, 174, 77, 0.28), 0 1px 2px rgba(35, 31, 20, 0.08)',
            zIndex: 1,
          }}
        />

        {/* Tab Buttons */}
        {tabs.map((tab, idx) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              role="tab"
              type="button"
              aria-selected={isSelected}
              onClick={() => handleTabClick(tab.id, idx)}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: isSelected ? 750 : 600,
                color: isSelected ? '#20201D' : 'var(--foreground-secondary, #77756D)',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap',
                outline: 'none',
              }}
            >
              {typeof tab.icon === 'function' ? React.createElement(tab.icon, { size: 15 }) : tab.icon}
              <span>{tab.title}</span>
            </button>
          );
        })}
      </div>

      {/* Optional Card Showcase View */}
      {showCards && (
        <div
          style={{
            position: 'relative',
            height: '190px',
            width: '100%',
            borderRadius: '16px',
            background: 'var(--surface, #FFFDF8)',
            border: '1px solid var(--border, #DDD9CC)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(35, 31, 20, 0.04))',
            marginTop: '16px',
          }}
        >
          <AnimatePresence custom={direction} initial={false} mode="popLayout">
            <motion.div
              key={`card-${activeTab}`}
              custom={direction}
              variants={slideVariants as any}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: 0,
                height: '100%',
                width: '100%',
                background: 'var(--surface, #FFFDF8)',
              }}
            >
              {selectedItem?.cardContent ?? (
                <TabCardContent
                  title={selectedItem.title}
                  description={selectedItem.description ?? ''}
                  accentColor={selectedItem.color || '#F5AE4D'}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SmoothTabs;
