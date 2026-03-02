import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== PAGE TRANSITION WRAPPER ====================
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
    exit: {
        opacity: 0,
        y: -15,
        scale: 0.98,
        transition: {
            duration: 0.25,
            ease: 'easeInOut',
        },
    },
};

export function PageTransition({ children, pageKey }) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pageKey}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{ minHeight: '100vh' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

// ==================== STAGGERED CHILDREN ANIMATION ====================
export const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

export const staggerItem = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24,
        },
    },
};

// ==================== FADE IN FROM BOTTOM ====================
export const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    },
};

// ==================== SCALE IN ====================  
export const scaleIn = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.4, type: 'spring', stiffness: 200 },
    },
};

export default PageTransition;
