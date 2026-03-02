import React from 'react';
import { motion } from 'framer-motion';

// ==================== GLASSMORPHISM CARD ====================
export default function GlassCard({
    children,
    className = '',
    hoverEffect = true,
    glowColor = 'blue',
    borderAnimation = true,
    onClick,
    style = {},
}) {
    const glowColors = {
        blue: { border: 'rgba(59,130,246,0.3)', glow: 'rgba(59,130,246,0.15)', hoverBorder: 'rgba(59,130,246,0.6)' },
        purple: { border: 'rgba(168,85,247,0.3)', glow: 'rgba(168,85,247,0.15)', hoverBorder: 'rgba(168,85,247,0.6)' },
        red: { border: 'rgba(239,68,68,0.3)', glow: 'rgba(239,68,68,0.15)', hoverBorder: 'rgba(239,68,68,0.6)' },
        green: { border: 'rgba(34,197,94,0.3)', glow: 'rgba(34,197,94,0.15)', hoverBorder: 'rgba(34,197,94,0.6)' },
        cyan: { border: 'rgba(6,182,212,0.3)', glow: 'rgba(6,182,212,0.15)', hoverBorder: 'rgba(6,182,212,0.6)' },
        amber: { border: 'rgba(245,158,11,0.3)', glow: 'rgba(245,158,11,0.15)', hoverBorder: 'rgba(245,158,11,0.6)' },
    };

    const colors = glowColors[glowColor] || glowColors.blue;

    return (
        <motion.div
            className={`glass-card-premium ${className}`}
            onClick={onClick}
            whileHover={hoverEffect ? {
                y: -4,
                scale: 1.02,
                boxShadow: `0 20px 60px ${colors.glow}, 0 0 40px ${colors.glow}`,
                borderColor: colors.hoverBorder,
            } : {}}
            whileTap={onClick ? { scale: 0.98 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(30,58,138,0.3) 50%, rgba(15,23,42,0.6) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: onClick ? 'pointer' : 'default',
                ...style,
            }}
        >
            {/* Animated gradient border overlay */}
            {borderAnimation && (
                <motion.div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '16px',
                        padding: '1px',
                        background: `linear-gradient(135deg, ${colors.border}, transparent, ${colors.border})`,
                        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                        WebkitMaskComposite: 'xor',
                        maskComposite: 'exclude',
                        pointerEvents: 'none',
                        opacity: 0.5,
                    }}
                    animate={{
                        background: [
                            `linear-gradient(0deg, ${colors.border}, transparent, ${colors.border})`,
                            `linear-gradient(90deg, ${colors.border}, transparent, ${colors.border})`,
                            `linear-gradient(180deg, ${colors.border}, transparent, ${colors.border})`,
                            `linear-gradient(270deg, ${colors.border}, transparent, ${colors.border})`,
                            `linear-gradient(360deg, ${colors.border}, transparent, ${colors.border})`,
                        ],
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                />
            )}

            {/* Inner glow */}
            <div
                style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: `radial-gradient(circle at 30% 30%, ${colors.glow}, transparent 60%)`,
                    pointerEvents: 'none',
                    opacity: 0.3,
                }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </motion.div>
    );
}

// ==================== GLASS STAT CARD ====================
export function GlassStatCard({ icon: Icon, label, value, color = 'blue', delay = 0 }) {
    const colorMap = {
        blue: 'text-blue-400',
        yellow: 'text-yellow-400',
        purple: 'text-purple-400',
        green: 'text-green-400',
        red: 'text-red-400',
        cyan: 'text-cyan-400',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1, duration: 0.5, type: 'spring' }}
        >
            <GlassCard glowColor={color} className="text-center">
                {Icon && <Icon size={32} className={`mx-auto mb-3 ${colorMap[color] || 'text-blue-400'}`} />}
                <p className="text-slate-400 text-sm mb-2">{label}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </GlassCard>
        </motion.div>
    );
}
