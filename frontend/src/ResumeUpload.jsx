import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
            const response = await axios.post(`${API_URL}/analyze-resume`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.status === 'success') {
                onAnalysisComplete(response.data.analysis);
            }
        } catch (err) {
            console.error("Analysis Failed", err);
            setError("Failed to analyze resume. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-2xl mx-auto px-6">

            {/* Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-4">
                    AI Resume Scorer
                </h1>
                <p className="text-slate-400 text-lg">
                    Get an instant ATS score and magic rewrites for your resume.
                </p>
            </div>

            {/* Upload Zone */}
            <div
                className={`relative w-full h-64 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group
                ${dragActive
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                        : file
                            ? 'border-green-500/50 bg-green-500/5'
                            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30 bg-slate-800/20'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                {/* Hidden Input */}
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleChange}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center pointer-events-none transition-transform duration-300 group-hover:scale-105">
                    {loading ? (
                        <>
                            <Loader size={48} className="text-blue-400 animate-spin mb-4" />
                            <p className="text-blue-300 font-medium animate-pulse">Analyzing Resume...</p>
                        </>
                    ) : file ? (
                        <>
                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 text-green-400">
                                <FileText size={32} />
                            </div>
                            <p className="text-xl font-semibold text-white mb-1">{file.name}</p>
                            <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="mt-4 text-xs text-red-400 hover:text-red-300 hover:underline pointer-events-auto"
                            >
                                Remove File
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 group-hover:bg-slate-600 group-hover:text-white'}`}>
                                <Upload size={32} />
                            </div>
                            <p className="text-lg font-medium text-slate-200 mb-2">
                                {dragActive ? "Drop it here!" : "Click or Drag Resume Here"}
                            </p>
                            <p className="text-sm text-slate-500">Supports PDF & DOCX</p>
                        </>
                    )}
                </div>

                {/* Animated Background Gradient (Subtle) */}
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 transition-opacity duration-500 ${dragActive || file ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-4 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            {/* Action Button */}
            {file && !loading && (
                <button
                    onClick={handleAnalyze}
                    className="mt-8 group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 font-lg rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 overflow-hidden"
                >
                    <span className="relative flex items-center gap-2">
                        Analyze Score <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
            )}

        </div>
    );
}
