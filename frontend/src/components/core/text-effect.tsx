import React from 'react';
import { motion, type Variants } from 'motion/react';

export type TextEffectPer = 'word' | 'char' | 'line';
export type TextEffectPreset = 'fade' | 'slide' | 'scale' | 'blur' | 'fade-in-blur';

export interface TextEffectProps {
  children: string;
  per?: TextEffectPer;
  as?: keyof React.JSX.IntrinsicElements;
  preset?: TextEffectPreset;
  delay?: number;
  speedReveal?: number;
  className?: string;
  style?: React.CSSProperties;
  onAnimationComplete?: () => void;
}

const defaultContainerVariants = (delay: number = 0, speedReveal: number = 0.15): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: speedReveal,
      delayChildren: delay,
    },
  },
});

const defaultItemVariants: Record<TextEffectPreset, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  },
  slide: {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
  },
  blur: {
    hidden: { opacity: 0, filter: 'blur(12px)' },
    visible: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
  },
  'fade-in-blur': {
    hidden: { opacity: 0, y: 18, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
    },
  },
};

export const TextEffect: React.FC<TextEffectProps> = ({
  children,
  per = 'word',
  as = 'div',
  preset = 'slide',
  delay = 0,
  speedReveal = 0.15,
  className,
  style,
  onAnimationComplete,
}) => {
  const containerVariants = defaultContainerVariants(delay, speedReveal);
  const itemVariants = defaultItemVariants[preset];

  const MotionComponent = motion.create(as);

  const splitText = () => {
    if (typeof children !== 'string') return [];
    if (per === 'char') {
      return children.split('');
    }
    if (per === 'word') {
      return children.split(/(\s+)/);
    }
    return children.split('\n');
  };

  const segments = splitText();

  return (
    <MotionComponent
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        whiteSpace: 'pre-wrap',
        overflow: 'visible',
        paddingBottom: '0.12em',
        ...style,
      }}
      onAnimationComplete={onAnimationComplete}
    >
      {segments.map((segment, index) => {
        if (/^\s+$/.test(segment)) {
          return <span key={index}>{segment}</span>;
        }

        return (
          <motion.span
            key={index}
            variants={itemVariants}
            style={{
              display: 'inline-block',
              overflow: 'visible',
              paddingBottom: '0.12em',
              willChange: 'transform, opacity, filter',
            }}
          >
            {segment}
          </motion.span>
        );
      })}
    </MotionComponent>
  );
};

export default TextEffect;
