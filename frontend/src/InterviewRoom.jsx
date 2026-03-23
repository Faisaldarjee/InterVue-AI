import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Send, Loader, AlertCircle, ArrowRight, Mic, MicOff,
    Code, Clock, Video, VideoOff, ChevronRight, Check,
    X, Volume2, Sparkles, Timer, User, Brain, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ==================== INTERVIEW ROOM ====================
export default function InterviewRoom({
    sessionId, firstQuestion, totalQuestions, jobRole,
    interviewTips, onAnswer, onBack
}) {
    // Core State
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
    const [answersData, setAnswersData] = useState([]);
    const [progress, setProgress] = useState({ current: 1, total: totalQuestions });
    const [showTips, setShowTips] = useState(true);

    // Interview Room State
    const [elapsedTime, setElapsedTime] = useState(0);
    const [questionTime, setQuestionTime] = useState(0);
    const [webcamEnabled, setWebcamEnabled] = useState(false);
    const [webcamStream, setWebcamStream] = useState(null);
    const [aiState, setAiState] = useState('listening'); // listening | thinking | speaking
    const [showComplete, setShowComplete] = useState(false);

    // Voice Dictation
    const [isListening, setIsListening] = useState(false);
    const [micStatus, setMicStatus] = useState('Off');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef(null);
    const shouldListenRef = useRef(false);
    const videoRef = useRef(null);
    const answerRef = useRef(null);

    // ========== TIMERS ==========
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
            setQuestionTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Reset question timer on new question
    useEffect(() => {
        setQuestionTime(0);
    }, [currentQuestionIndex]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ========== WEBCAM ==========
    const toggleWebcam = useCallback(async () => {
        if (webcamEnabled) {
            webcamStream?.getTracks().forEach(t => t.stop());
            setWebcamStream(null);
            setWebcamEnabled(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setWebcamStream(stream);
                setWebcamEnabled(true);
            } catch {
                console.error('Webcam access denied');
            }
        }
    }, [webcamEnabled, webcamStream]);

    useEffect(() => {
        if (videoRef.current && webcamStream) {
            videoRef.current.srcObject = webcamStream;
        }
    }, [webcamStream]);

    useEffect(() => {
        return () => {
            webcamStream?.getTracks().forEach(t => t.stop());
        };
    }, [webcamStream]);

    // ========== SPEECH RECOGNITION ==========
    useEffect(() => {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;

            recognition.onstart = () => { setMicStatus('Listening...'); setInterimTranscript(''); };

            recognition.onresult = (event) => {
                let final = '', interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) final += event.results[i][0].transcript;
                    else interim += event.results[i][0].transcript;
                }
                if (final) setAnswer(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + final + ' ');
                setInterimTranscript(interim);
            };

            recognition.onerror = (event) => {
                if (event.error === 'not-allowed') {
                    setMicStatus('Permission Denied');
                    shouldListenRef.current = false;
                    setIsListening(false);
                }
            };

            recognition.onend = () => {
                setInterimTranscript('');
                if (shouldListenRef.current) {
                    try { recognition.start(); } catch { shouldListenRef.current = false; setIsListening(false); }
                } else { setIsListening(false); setMicStatus('Off'); }
            };

            recognitionRef.current = recognition;
        }
        return () => { if (recognitionRef.current) { shouldListenRef.current = false; recognitionRef.current.stop(); } };
    }, []);

    const toggleMic = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            shouldListenRef.current = false;
            recognitionRef.current.stop();
            setIsListening(false);
            setMicStatus('Off');
        } else {
            try { shouldListenRef.current = true; recognitionRef.current.start(); setIsListening(true); } catch { }
        }
    };

    // ========== SUBMIT ==========
    const handleSubmit = async () => {
        if (!answer.trim()) { setError('Please provide an answer'); return; }
        setLoading(true);
        setError(null);
        setAiState('thinking');

        try {
            const response = await axios.post(
                `${API_URL}/submit-answer/${sessionId}`,
                { answer: answer.trim() },
                { timeout: 60000 }
            );

            if (response.data.status === 'completed') {
                setAiState('speaking');
                setShowComplete(true);
                setTimeout(() => {
                    onAnswer({
                        isComplete: true,
                        finalReport: response.data.final_report,
                        learningReport: response.data.learning_report,
                        summary: response.data.interview_summary,
                        answers: [...answersData, { question: currentQuestion.question, evaluation: response.data.evaluation }]
                    });
                }, 3000);
            } else {
                setAiState('speaking');
                setAnswersData(prev => [...prev, { question: currentQuestion.question, evaluation: response.data.evaluation }]);
                setTimeout(() => {
                    setCurrentQuestion(response.data.next_question);
                    setCurrentQuestionIndex(prev => prev + 1);
                    setProgress(response.data.progress);
                    setAnswer('');
                    setAiState('listening');
                }, 1200);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit answer');
            setAiState('listening');
        } finally {
            setLoading(false);
        }
    };

    // ==================== INTERVIEW COMPLETE OVERLAY ====================
    if (showComplete) {
        return (
            <div className="fixed inset-0 z-50 bg-[#060918] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"
                    >
                        <Check size={48} className="text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-4xl md:text-5xl font-bold text-white mb-3"
                    >
                        Interview Complete!
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-slate-400 text-lg mb-2"
                    >
                        Great job! Preparing your detailed results...
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6"
                    >
                        <Loader size={24} className="text-emerald-400 animate-spin mx-auto" />
                    </motion.div>
                </motion.div>
                {/* Confetti particles */}
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            background: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i % 5],
                            left: `${Math.random() * 100}%`,
                            top: '-10px',
                        }}
                        animate={{
                            y: [0, window.innerHeight + 20],
                            x: [0, (Math.random() - 0.5) * 200],
                            rotate: [0, Math.random() * 720],
                            opacity: [1, 0],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 2,
                            delay: 0.3 + Math.random() * 0.5,
                            ease: 'easeIn',
                        }}
                    />
                ))}
            </div>
        );
    }

    // ==================== MAIN RENDER ====================
    return (
        <div className="h-screen bg-[#060918] flex flex-col overflow-hidden">
            {/* ===== TOP BAR ===== */}
            <div className="flex-shrink-0 bg-[#0c1425]/80 backdrop-blur-2xl border-b border-white/[0.05] px-4 py-2.5 flex items-center justify-between z-20" style={{ WebkitBackdropFilter: 'blur(24px)' }}>
                {/* Left — Room Info */}
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800">
                        <X size={18} />
                    </button>
                    <div className="h-5 w-px bg-slate-700" />
                    <div>
                        <h1 className="text-white text-sm font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            Live Interview
                        </h1>
                        <p className="text-slate-500 text-xs">{jobRole} • Standard Mode</p>
                    </div>
                </div>

                {/* Center — Time */}
                <div className="hidden sm:flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Clock size={13} />
                        <span className="font-mono">{formatTime(elapsedTime)}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-700" />
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                        <Timer size={13} />
                        <span className="font-mono">Q: {formatTime(questionTime)}</span>
                    </div>
                </div>

                {/* Right — Controls */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleWebcam}
                        className={`p-2 rounded-lg transition text-xs ${webcamEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                        title={webcamEnabled ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {webcamEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                    </button>
                    <button
                        onClick={toggleMic}
                        className={`p-2 rounded-lg transition text-xs ${isListening ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                    >
                        {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="flex-1 flex overflow-hidden">
                {/* ===== LEFT — AI INTERVIEWER PANEL ===== */}
                <div className="w-full lg:w-[45%] flex flex-col border-r border-white/[0.04] bg-gradient-to-b from-[#0c1425] to-[#060918]">
                    {/* Question Card — TOP (always visible) */}
                    <div className="flex-shrink-0 p-4 lg:p-5 border-b border-slate-800/30">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                                className="bg-[#0c1425]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 shadow-lg"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare size={14} className="text-blue-400" />
                                    <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Question {progress.current}</span>
                                    <div className="flex gap-1.5 ml-auto">
                                        {currentQuestion?.type && (
                                            <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded-full text-blue-300 text-[10px] font-semibold">
                                                {currentQuestion.type}
                                            </span>
                                        )}
                                        {currentQuestion?.difficulty && (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${currentQuestion.difficulty === 'Hard' ? 'bg-red-500/15 border border-red-500/30 text-red-300'
                                                : currentQuestion.difficulty === 'Easy' ? 'bg-green-500/15 border border-green-500/30 text-green-300'
                                                    : 'bg-purple-500/15 border border-purple-500/30 text-purple-300'
                                                }`}>
                                                {currentQuestion.difficulty}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-white font-semibold text-base lg:text-lg leading-relaxed">
                                    {currentQuestion?.question || 'Loading question...'}
                                </h3>
                                {currentQuestion?.why_asked && (
                                    <p className="text-slate-500 text-xs mt-3 italic border-l-2 border-slate-600 pl-3">
                                        💡 {currentQuestion.why_asked}
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Tips (first question only) */}
                        {interviewTips && showTips && currentQuestionIndex === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 relative"
                            >
                                <button onClick={() => setShowTips(false)} className="absolute top-2 right-2 text-slate-600 hover:text-slate-400">
                                    <X size={12} />
                                </button>
                                <p className="text-emerald-400 text-xs font-bold mb-1.5 flex items-center gap-1">
                                    <Sparkles size={12} /> Tips
                                </p>
                                <ul className="space-y-0.5">
                                    {interviewTips.slice(0, 3).map((tip, i) => (
                                        <li key={i} className="text-emerald-300/70 text-[11px]">• {tip}</li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </div>

                    {/* AI Avatar Section — compact, below question */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
                        {/* Animated ring */}
                        <motion.div
                            className="relative"
                            animate={aiState === 'speaking' ? { scale: [1, 1.05, 1] } : aiState === 'thinking' ? { scale: [1, 1.02, 1] } : {}}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {/* Glow ring */}
                            <div className={`absolute -inset-2 rounded-full transition-all duration-700 ${aiState === 'listening' ? 'bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
                                : aiState === 'thinking' ? 'bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                                    : 'bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                                }`} />

                            {/* Avatar — smaller */}
                            <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${aiState === 'listening' ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20'
                                : aiState === 'thinking' ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/20'
                                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20'
                                }`}>
                                <Brain size={32} className="text-white" />
                            </div>
                        </motion.div>

                        {/* AI Name & Status */}
                        <div className="mt-3 text-center">
                            <h2 className="text-white font-bold text-sm">InterVue AI</h2>
                            <motion.p
                                key={aiState + (isListening ? '-mic' : '')}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-xs font-medium mt-1 ${aiState === 'listening' ? 'text-blue-400' : aiState === 'thinking' ? 'text-amber-400' : 'text-emerald-400'
                                    }`}
                            >
                                {aiState === 'listening'
                                    ? (isListening ? '● Listening via mic...' : '● Waiting for your answer...')
                                    : aiState === 'thinking' ? '● Evaluating response...'
                                        : '● Moving to next question...'}
                            </motion.p>
                        </div>

                        {/* Sound wave animation — ONLY when mic is actually ON */}
                        {isListening && (
                            <div className="flex items-center gap-0.5 mt-3">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-cyan-500 rounded-full"
                                        animate={{ height: [6, 18 + Math.random() * 10, 6] }}
                                        transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.1 }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Thinking dots */}
                        {aiState === 'thinking' && (
                            <div className="flex gap-1.5 mt-3">
                                {[0, 1, 2].map(i => (
                                    <motion.div
                                        key={i}
                                        className="w-2 h-2 rounded-full bg-amber-400"
                                        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== RIGHT — ANSWER PANEL ===== */}
                <div className="hidden lg:flex w-[55%] flex-col bg-[#060918]">
                    {/* Progress Dots */}
                    <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.04] flex items-center gap-2">
                        {Array.from({ length: totalQuestions }, (_, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${i < currentQuestionIndex ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : i === currentQuestionIndex ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/20'
                                        : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {i < currentQuestionIndex ? <Check size={12} /> : i + 1}
                                </div>
                                {i < totalQuestions - 1 && (
                                    <div className={`w-6 h-0.5 rounded-full ${i < currentQuestionIndex ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                                )}
                            </div>
                        ))}
                        <div className="ml-auto text-slate-500 text-xs font-medium">
                            {progress.current}/{progress.total}
                        </div>
                    </div>

                    {/* Webcam (if enabled) */}
                    {webcamEnabled && (
                        <div className="flex-shrink-0 px-5 pt-3">
                            <div className="relative w-40 h-28 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-xl">
                                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-black/60 rounded text-[10px] text-white font-medium backdrop-blur-sm">
                                    You
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Answer Area */}
                    <div className="flex-1 flex flex-col p-5 overflow-hidden">
                        <div className="flex-1 flex flex-col min-h-0">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                                    {currentQuestion?.requires_code
                                        ? <><Code size={16} className="text-blue-400" /> Code Solution</>
                                        : 'Your Answer'
                                    }
                                </h3>
                                <div className="flex items-center gap-2">
                                    {isListening && (
                                        <span className="text-cyan-400 text-xs animate-pulse font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                            {micStatus}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Editor / Textarea */}
                            <div className="flex-1 min-h-0">
                                {currentQuestion?.requires_code ? (
                                    <div className="w-full h-full bg-[#1a1a2e] border border-slate-700/50 rounded-2xl overflow-auto focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10 transition">
                                        <Editor
                                            value={answer}
                                            onValueChange={code => setAnswer(code)}
                                            highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                                            padding={20}
                                            style={{
                                                fontFamily: '"Fira Code", "Fira Mono", monospace',
                                                fontSize: 14,
                                                color: '#e2e8f0',
                                                minHeight: '100%',
                                            }}
                                            placeholder="// Write your code here..."
                                        />
                                    </div>
                                ) : (
                                    <textarea
                                        ref={answerRef}
                                        value={answer + (interimTranscript ? (answer && !answer.endsWith(' ') ? ' ' : '') + interimTranscript : '')}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        readOnly={isListening}
                                        placeholder="Type your answer here... Be specific with examples and explain your thought process."
                                        className={`w-full h-full bg-slate-900/50 border resize-none rounded-2xl px-5 py-4 text-white text-sm placeholder-slate-600 focus:outline-none transition ${isListening
                                            ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.05)]'
                                            : 'border-slate-800 focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/10'
                                            }`}
                                        style={{ lineHeight: 1.7 }}
                                    />
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-600 text-xs">{answer.length} chars</span>
                                    {answer.length > 0 && (
                                        <span className={`text-xs ${answer.length < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {answer.length < 30 ? 'Add more detail' : '✓ Good length'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || !answer.trim()}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-[0_6px_24px_rgba(59,130,246,0.2)] disabled:shadow-none"
                                >
                                    {loading ? (
                                        <><Loader size={16} className="animate-spin" /> Evaluating...</>
                                    ) : (
                                        <><Send size={16} /> Submit Answer</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="mx-5 mb-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 text-sm"
                            >
                                <AlertCircle size={16} />
                                <span>{error}</span>
                                <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ===== MOBILE: Answer Panel (shown below question on small screens) ===== */}
                <div className="lg:hidden w-full flex flex-col">
                    <div className="flex-1 flex flex-col p-4 overflow-auto">
                        {/* Progress */}
                        <div className="flex items-center gap-1.5 mb-3">
                            {Array.from({ length: totalQuestions }, (_, i) => (
                                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < currentQuestionIndex ? 'bg-emerald-500' : i === currentQuestionIndex ? 'bg-blue-500' : 'bg-slate-800'
                                    }`} />
                            ))}
                        </div>

                        {/* Answer */}
                        <textarea
                            value={answer + (interimTranscript ? (answer && !answer.endsWith(' ') ? ' ' : '') + interimTranscript : '')}
                            onChange={(e) => setAnswer(e.target.value)}
                            readOnly={isListening}
                            placeholder="Type your answer here..."
                            rows={6}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition resize-none mb-3"
                        />

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !answer.trim()}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? <><Loader size={16} className="animate-spin" /> Evaluating...</> : <><Send size={16} /> Submit</>}
                        </button>

                        {error && (
                            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 text-sm">
                                <AlertCircle size={14} /><span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
