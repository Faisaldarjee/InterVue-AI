import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle, Loader, ArrowRight, Sparkles } from 'lucide-react';
import { analyzeResumeFile } from './utils/apiClient';

export default function ResumeUpload({ onAnalysisComplete }) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(selectedFile.type)) {
            setError("Please upload a PDF or DOCX file.");
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError("File size exceeds 5MB limit.");
            return;
        }
        setFile(selectedFile);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await analyzeResumeFile(formData);
            if (response.status === 'success') {
                onAnalysisComplete(response.analysis);
            }
        } catch (err) {
            console.error("Analysis Failed", err);
            setError(err.response?.data?.detail || "Failed to analyze resume. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto px-6">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-10"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-5">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-purple-300 text-xs font-medium">AI-Powered Analysis</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
                    Resume <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Scorer</span>
                </h1>
                <p className="text-slate-400 text-base">
                    Get your ATS score, missing keywords, and AI-powered rewrites instantly.
                </p>
            </motion.div>

            {/* Upload Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`relative w-full rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group py-14
                ${dragActive
                        ? 'border-blue-500 bg-blue-500/5 scale-[1.01]'
                        : file
                            ? 'border-emerald-500/30 bg-emerald-500/[0.03]'
                            : 'border-slate-700/50 hover:border-slate-600 bg-slate-900/30'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleChange}
                />

                <div className="relative z-10 flex flex-col items-center pointer-events-none transition-transform duration-300 group-hover:scale-[1.02]">
                    {loading ? (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                                <Loader size={28} className="text-blue-400 animate-spin" />
                            </div>
                            <p className="text-blue-300 font-medium animate-pulse text-sm">Analyzing your resume...</p>
                        </>
                    ) : file ? (
                        <>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                <FileText size={28} className="text-emerald-400" />
                            </div>
                            <p className="text-lg font-semibold text-white mb-0.5">{file.name}</p>
                            <p className="text-slate-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="mt-3 text-xs text-red-400 hover:text-red-300 hover:underline pointer-events-auto"
                            >
                                Remove
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-blue-500/20' : 'bg-white/[0.04] group-hover:bg-white/[0.06]'
                                }`}>
                                <Upload size={28} className={dragActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white transition'} />
                            </div>
                            <p className="text-base font-semibold text-white mb-1">
                                {dragActive ? "Drop it here!" : "Drop your resume here"}
                            </p>
                            <p className="text-xs text-slate-500">PDF or DOCX • Max 5MB</p>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/15 text-sm"
                >
                    <AlertCircle size={16} />
                    {error}
                </motion.div>
            )}

            {/* Analyze Button */}
            {file && !loading && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleAnalyze}
                    className="mt-8 flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all text-sm group"
                >
                    Analyze Score
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            )}
        </div>
    );
}
