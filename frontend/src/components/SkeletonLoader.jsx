import React from 'react';
import { motion } from 'framer-motion';

// ==================== SKELETON SHIMMER EFFECT ====================
const shimmer = {
    hidden: { x: '-100%' },
    visible: {
        x: '100%',
        transition: {
            repeat: Infinity,
            duration: 1.5,
            ease: 'easeInOut',
        },
    },
};

function SkeletonBlock({ width = '100%', height = '20px', rounded = '8px', className = '' }) {
    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={{
                width,
                height,
                borderRadius: rounded,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            }}
        >
            <motion.div
                variants={shimmer}
                initial="hidden"
                animate="visible"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                }}
            />
        </div>
    );
}

// ==================== INTERVIEW SKELETON ====================
export function InterviewSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
            <div className="max-w-4xl mx-auto pt-8">
                {/* Progress bar skeleton */}
                <div className="mb-8 space-y-3">
                    <SkeletonBlock width="120px" height="16px" />
                    <SkeletonBlock width="100%" height="8px" rounded="999px" />
                </div>

                {/* Question card skeleton */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(30,58,138,0.4))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '16px',
                    padding: '32px',
                    marginBottom: '24px',
                }}>
                    <SkeletonBlock width="100px" height="14px" className="mb-4" />
                    <SkeletonBlock width="90%" height="28px" className="mb-3" />
                    <SkeletonBlock width="70%" height="28px" className="mb-6" />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <SkeletonBlock width="80px" height="28px" rounded="999px" />
                        <SkeletonBlock width="80px" height="28px" rounded="999px" />
                    </div>
                </div>

                {/* Answer area skeleton */}
                <SkeletonBlock width="100%" height="180px" rounded="12px" className="mb-4" />
                <SkeletonBlock width="100%" height="56px" rounded="12px" />
            </div>
        </div>
    );
}

// ==================== RESULTS SKELETON ====================
export function ResultsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
            <div className="max-w-5xl mx-auto pt-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <SkeletonBlock width="180px" height="32px" rounded="999px" className="mx-auto mb-6" />
                    <SkeletonBlock width="400px" height="40px" className="mx-auto mb-3" />
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} style={{
                            background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(30,58,138,0.4))',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                        }}>
                            <SkeletonBlock width="40px" height="40px" rounded="50%" className="mx-auto mb-3" />
                            <SkeletonBlock width="80px" height="14px" className="mx-auto mb-2" />
                            <SkeletonBlock width="60px" height="32px" className="mx-auto" />
                        </div>
                    ))}
                </div>

                {/* Report skeleton */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(30,58,138,0.4))',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '16px',
                    padding: '32px',
                }}>
                    <SkeletonBlock width="200px" height="28px" className="mb-6" />
                    <SkeletonBlock width="100%" height="16px" className="mb-3" />
                    <SkeletonBlock width="90%" height="16px" className="mb-3" />
                    <SkeletonBlock width="95%" height="16px" className="mb-6" />
                    <SkeletonBlock width="100%" height="100px" rounded="12px" />
                </div>
            </div>
        </div>
    );
}

// ==================== RAPID FIRE SKELETON ====================
export function RapidFireSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
            <div className="max-w-2xl mx-auto pt-8">
                <SkeletonBlock width="200px" height="36px" className="mx-auto mb-8" />
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(30,58,138,0.4))',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '16px',
                    padding: '32px',
                }}>
                    <SkeletonBlock width="60px" height="60px" rounded="50%" className="mx-auto mb-4" />
                    <SkeletonBlock width="80%" height="24px" className="mx-auto mb-3" />
                    <SkeletonBlock width="60%" height="16px" className="mx-auto mb-6" />
                    <SkeletonBlock width="100%" height="120px" rounded="12px" className="mb-4" />
                    <SkeletonBlock width="100%" height="48px" rounded="12px" />
                </div>
            </div>
        </div>
    );
}

// ==================== RESUME ANALYSIS SKELETON ====================
export function ResumeAnalysisSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-6">
            <SkeletonBlock width="300px" height="40px" className="mb-4" />
            <SkeletonBlock width="250px" height="20px" className="mb-8" />
            <div style={{
                width: '100%',
                height: '256px',
                borderRadius: '24px',
                border: '2px dashed rgba(100,116,139,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
            }}>
                <SkeletonBlock width="64px" height="64px" rounded="50%" />
                <SkeletonBlock width="200px" height="20px" />
                <SkeletonBlock width="140px" height="14px" />
            </div>
        </div>
    );
}

export default SkeletonBlock;
