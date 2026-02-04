import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, ArrowRight, Volume2, CheckCircle, AlertCircle, Loader, X, RefreshCw, AudioLines } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// ==================== IMPROVED AUDIO VISUALIZER ====================
const AudioVisualizer = ({ isListening }) => {
    return (
        <div className="flex items-center justify-center gap-1 h-12 transition-all duration-300">
            {isListening ? (
                // Active Waveform
                [...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-rose-500 rounded-full animate-[bounce_1s_infinite]"
                        style={{
                            animationDelay: `${i * 0.1}s`,
                            height: `${40 + Math.random() * 60}%`, // Dynamic height effect
                            opacity: 0.8
                        }}
                    ></div>
                ))
            ) : (
                // Idle State
                <div className="flex items-center gap-2 opacity-50">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                </div>
            )}
        </div>
    );
};

export default function VoiceInterview({ initialData, onBack, onComplete }) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [questions, setQuestions] = useState(initialData.questions || []);
    const [answers, setAnswers] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Split transcript for responsiveness
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    const currentQuestion = questions[currentQuestionIndex];

    // ==================== SPEECH LOGIC ====================
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let final = '';
                let interim = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript + ' ';
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }

                if (final) {
                    setTranscript(prev => prev + final);
                    setInterimTranscript(''); // Clear interim once finalized
                } else {
                    setInterimTranscript(interim);
                }
            };

            recognition.onerror = (event) => {
                // Ignore 'no-speech' errors as they are common when user pauses
                if (event.error === 'no-speech') return;

                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    setIsListening(false);
                    setError('Microphone access denied. Please allow mic access.');
                }
            };

            recognition.onend = () => {
                // Auto-restart if we think we are listening (for continuous effect)
                // Using a ref or checking state directly might be tricky due to closures,
                // but for simple cases, let's just stop UI listening state if it truly ends.
                // To make it truly continuous, we'd restart it here if `isListening` state was true,
                // but that requires state access. 
                // Better UX: Stop UI and let user toggle if it cuts off, OR just handle 'end' gracefully.
                // Here we simply sync UI state.
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setError('Browser not supported. Use Chrome for best experience.');
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (synthesisRef.current) synthesisRef.current.cancel();
        };
    }, []);

    // Helper to robustly start/stop
    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            try {
                // Reset interim on new start
                setInterimTranscript('');
                recognitionRef.current.start();
                setIsListening(true);
                // Silence AI if user interrupts
                if (synthesisRef.current) synthesisRef.current.cancel();
            } catch (err) {
                console.error("Mic start error:", err);
                // likely already started
            }
        }
    };

    // Auto-Speak Question logic
    useEffect(() => {
        if (currentQuestion) {
            const timer = setTimeout(() => speakText(currentQuestion.question), 600);
            return () => clearTimeout(timer);
        }
    }, [currentQuestionIndex]);

    const speakText = (text) => {
        if (!synthesisRef.current) return;
        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthesisRef.current.speak(utterance);
    };

    const handleNext = () => {
        // Combine final and any remaining interim text
        const fullAnswer = (transcript + ' ' + interimTranscript).trim();

        const newAnswer = {
            question: currentQuestion.question,
            answer: fullAnswer || "No answer provided",
            role: initialData.jobRole,
        };
        const updatedAnswers = [...answers, newAnswer];
        setAnswers(updatedAnswers);
        setTranscript('');
        setInterimTranscript('');

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishInterview(updatedAnswers);
        }
    };

    const finishInterview = async (finalAnswers) => {
        setProcessing(true);
        try {
            await new Promise(r => setTimeout(r, 1500));
            const response = await axios.post(`${API_URL}/submit-voice-batch`, {
                session_id: initialData.interviewId,
                job_role: initialData.jobRole,
                answers: finalAnswers
            });
            if (onComplete) onComplete(response.data);
        } catch (err) {
            setError('Failed to submit. ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const displayTranscript = transcript + interimTranscript;

    if (processing) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white relative">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900"></div>

                <div className="relative z-10 text-center">
                    <div className="relative inline-flex mb-6">
                        <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
                        <Loader size={56} className="text-white relative z-10 animate-spin" />
                    </div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-indigo-400 mb-2">Analyzing Performance</h2>
                    <p className="text-slate-400">Processing response batch...</p>
                </div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col relative overflow-hidden font-sans selection:bg-rose-500/30">

            {/* Ambient Lights */}
            <div className="absolute inset-0 pointer-events-none">
                {isListening && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[100px] animate-pulse"></div>}
            </div>

            {/* Header */}
            <div className="relative z-20 w-full px-8 py-6 flex justify-between items-center bg-white/5 backdrop-blur-sm border-b border-white/5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition text-sm font-medium"
                >
                    <X size={16} /> End Session
                </button>

                <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Progress</span>
                    <div className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                        <span className="text-rose-400 font-bold">{currentQuestionIndex + 1}</span>
                        <span className="text-slate-600">/</span>
                        <span>{questions.length}</span>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full px-6 py-8">

                {/* Question Card */}
                <div className="w-full text-center mb-12 relative group">
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
                    <h2
                        className="relative z-10 text-3xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg cursor-pointer hover:scale-[1.01] transition-transform duration-300"
                        onClick={() => speakText(currentQuestion.question)}
                    >
                        {currentQuestion.question}
                    </h2>

                    {/* Status Pill */}
                    <div className="flex justify-center h-8">
                        {isSpeaking ? (
                            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-wide animate-in fade-in zoom-in">
                                <Volume2 size={12} className="animate-pulse" /> AI SPEAKING
                            </div>
                        ) : isListening ? (
                            <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide animate-in fade-in zoom-in">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                LISTENING...
                            </div>
                        ) : (
                            <span className="text-slate-500 text-xs font-medium tracking-wide">Tap microphone to answer</span>
                        )}
                    </div>
                </div>

                {/* Transcript Area with Interim Results */}
                <div className={`w-full max-w-2xl min-h-[140px] mb-8 transition-all duration-500 ${displayTranscript ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {(displayTranscript || isListening) && (
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-indigo-500"></div>
                            <p className="text-lg text-slate-200 leading-relaxed font-light whitespace-pre-wrap">
                                {transcript}
                                <span className="text-slate-400 italic animate-pulse">{interimTranscript}</span>
                            </p>
                            {!displayTranscript && isListening && (
                                <p className="text-slate-500 text-sm italic">Listening for speech...</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="h-16 flex items-center justify-center w-full">
                    <AudioVisualizer isListening={isListening} />
                </div>

            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 w-full pb-12 px-8 flex justify-center items-center gap-8">

                <div className="flex-1 flex justify-end">
                    {displayTranscript && !isListening && (
                        <button
                            onClick={() => { setTranscript(''); setInterimTranscript(''); toggleListening(); }}
                            className="p-4 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-all shadow-lg backdrop-blur-sm"
                            title="Retry Answer"
                        >
                            <RefreshCw size={20} />
                        </button>
                    )}
                </div>

                <div className="relative group">
                    <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${isListening ? 'bg-rose-600/40 scale-125' : 'bg-transparent'}`}></div>
                    <button
                        onClick={toggleListening}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 shadow-2xl border-4 ${isListening
                                ? 'bg-rose-600 border-rose-500 hover:bg-rose-500 scale-110'
                                : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 hover:scale-105'
                            }`}
                    >
                        {isListening ? (
                            <Square size={28} fill="white" className="text-white" />
                        ) : (
                            <Mic size={36} className="text-white" />
                        )}
                    </button>
                </div>

                <div className="flex-1 flex justify-start">
                    <button
                        onClick={handleNext}
                        disabled={!displayTranscript.trim()}
                        className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white transition-all duration-300 shadow-lg ${displayTranscript.trim()
                                ? 'bg-slate-800 hover:bg-white hover:text-slate-900 border border-slate-700 hover:border-white translate-x-0 opacity-100'
                                : 'bg-slate-800/50 text-slate-600 border border-slate-800 cursor-not-allowed translate-x-4 opacity-0'
                            }`}
                    >
                        Next <ArrowRight size={20} />
                    </button>
                </div>

            </div>

            {error && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-3 rounded-full flex gap-2 backdrop-blur-md animate-in slide-in-from-top-4">
                    <AlertCircle size={20} /> {error}
                </div>
            )}
        </div>
    );
}
