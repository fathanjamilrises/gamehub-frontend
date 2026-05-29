'use client'

import { ReactNode } from 'react'
import { motion, Variants } from 'framer-motion'

// ── Reusable animation variants ──

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
}

// ── Stagger container variant ──
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
}

// ── Section wrapper with scroll-trigger ──

interface MotionSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  variants?: Variants
}

export function MotionSection({ children, className = '', delay = 0, variants = fadeInUp }: MotionSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── Stagger item (child of stagger container) ──

interface MotionItemProps {
  children: ReactNode
  className?: string
  variants?: Variants
}

export function MotionItem({ children, className = '', variants = fadeInUp }: MotionItemProps) {
  return (
    <motion.div
      variants={variants}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
