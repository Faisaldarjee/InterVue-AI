import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Send, Loader, CheckCircle, AlertCircle,
  Award, Clock, ArrowRight, Zap, Brain,
  BookOpen, Lightbulb, Target, BarChart3, Eye,
  Mic, MicOff, Code, History, LogOut, User, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import RapidFire from './RapidFire';
import VoiceInterview from './VoiceInterview';
import ResumeUpload from './ResumeUpload';
import ResumeReport from './ResumeReport';
import ResumeBuilder from './ResumeBuilder';
import InterviewRoom from './InterviewRoom';
import GlassCard from './components/GlassCard';
import { InterviewSkeleton, ResultsSkeleton } from './components/SkeletonLoader';
import HistoryDashboard from './components/HistoryDashboard';
import AuthModal from './components/AuthModal';
import { staggerContainer, staggerItem } from './components/PageTransition';
import { saveInterview, getStats, setCurrentUser } from './utils/historyManager';
import { supabase, signOut, getAccessToken, onAuthStateChange } from './utils/supabaseClient';
import apiClient, { saveInterviewToDB } from './utils/apiClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Debug logging
const log = (label, data) => {
  console.log(`[${label}]`, data);
};

// ==================== NOTIFICATION ====================
function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500/20 border-red-500/40' : 'bg-green-500/20 border-green-500/40';
  const textColor = type === 'error' ? 'text-red-300' : 'text-green-300';
  const Icon = type === 'error' ? AlertCircle : CheckCircle;

  return (
    <div className={`fixed top-4 right-4 max-w-sm ${bgColor} border ${textColor} p-4 rounded-lg flex gap-3 z-50 animate-fade-in`}>
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

// ==================== LANDING PAGE ====================
function LandingPage({ isAuthenticated, userName, onStartInterview, onStartRapidFire, onStartResumeScorer, onStartResumeBuilder, onStartHistory }) {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.docx')) {
        setResumeFile(file);
        setSuccess('Resume selected!');
      } else {
        setError('Please upload PDF or DOCX');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setResumeFile(e.target.files[0]);
      setSuccess('Resume selected!');
    }
  };

  const handleStartInterview = async () => {
    if (!resumeFile || !jobRole || !jobDescription) {
      setError('Please fill all fields');
      return;
    }

    if (!isAuthenticated) {
      const onAuthSuccess = () => {
        window.removeEventListener('auth-success', onAuthSuccess);
        handleStartInterview();
      };
      window.addEventListener('auth-success', onAuthSuccess);
      window.dispatchEvent(new CustomEvent('require-auth', { 
        detail: { message: 'Create a free account to generate your personalized AI interview.' } 
      }));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('job_role', jobRole);
      formData.append('job_description', jobDescription);

      log('Uploading resume', { file: resumeFile.name, jobRole, jobDescription: jobDescription.substring(0, 50) + '...' });

      const response = await apiClient.post('/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });

      log('Upload response', response.data);

      if (!response.data.session_id) {
        throw new Error('No session ID in response');
      }

      if (!response.data.first_question) {
        throw new Error('No first question in response');
      }

      log('Starting interview with session', response.data.session_id);

      onStartInterview({
        sessionId: response.data.session_id,
        analysis: response.data.analysis,
        firstQuestion: response.data.first_question,
        totalQuestions: response.data.total_questions || 4,
        jobRole: jobRole,
        difficulty: response.data.difficulty,
        learningFocus: response.data.learning_focus,
        keyTopics: response.data.key_topics || [],
        interviewTips: response.data.interview_tips || []
      });
    } catch (err) {
      log('Upload error', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to start interview';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const historyStats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600 rounded-full mix-blend-multiply filter blur-[150px] opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* ==================== HERO SECTION ==================== */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="pt-8 pb-20 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-sm mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-blue-300 text-sm font-medium">AI-Powered Interview Platform</span>
            </motion.div>

            {/* Main Title */}
            {isAuthenticated ? (
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight"
              >
                <span className="text-white">Welcome back, {userName || 'Ready'}!</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Let's Land That Job.
                </span>
              </motion.h1>
            ) : (
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight"
              >
                <span className="text-white">Ace Your Next</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Interview with AI
                </span>
              </motion.h1>
            )}

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Practice with personalized questions, get real-time AI feedback, build your resume, and walk in with confidence.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <button
                onClick={() => document.querySelector('[data-setup-section]')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 group text-sm"
              >
                Start Interview
                <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
              </button>
              <button
                onClick={onStartHistory}
                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium rounded-xl transition-all text-sm backdrop-blur-sm"
              >
                View History
              </button>
            </motion.div>

            {/* Stats Banner */}
            {isAuthenticated && historyStats.totalInterviews > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 inline-flex items-center gap-5 px-6 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-sm"
              >
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{historyStats.totalInterviews}</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Interviews</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <p className="text-yellow-400 font-bold text-lg">{historyStats.averageScore}/10</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Avg Score</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <p className="text-orange-400 font-bold text-lg">{historyStats.streakDays || 1}d</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Streak</p>
                </div>
              </motion.div>
            ) : !isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-10 inline-flex items-center gap-5 px-6 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl backdrop-blur-sm"
              >
                <div className="text-center">
                  <p className="text-white font-bold text-lg">50k+</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Active Users</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <p className="text-emerald-400 font-bold text-lg">92%</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Success Rate</p>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-center">
                  <p className="text-purple-400 font-bold text-lg">2M+</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-wider">Interviews</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* ==================== FEATURE CARDS ==================== */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-white mb-3">Everything You Need to Succeed</h2>
              <p className="text-slate-400 max-w-xl mx-auto">Four powerful tools to prepare you for any interview scenario</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  emoji: '🎥', title: 'Standard Interview', desc: 'Upload your resume, get personalized questions, and practice in a real video-call-style interview room with AI evaluation.',
                  color: 'blue', border: 'border-blue-500/20 hover:border-blue-500/40',
                  bg: 'from-blue-500/5 to-blue-900/5 hover:from-blue-500/10 hover:to-blue-900/10',
                  tag: 'Most Popular', tagColor: 'bg-blue-500/20 text-blue-300',
                  action: () => document.querySelector('[data-setup-section]')?.scrollIntoView({ behavior: 'smooth' })
                },
                {
                  emoji: '🔥', title: 'Rapid Fire Mode', desc: 'Test your speed with quick-fire questions. 60 seconds per question — think fast, answer faster. Great for warm-up.',
                  color: 'red', border: 'border-red-500/20 hover:border-red-500/40',
                  bg: 'from-red-500/5 to-red-900/5 hover:from-red-500/10 hover:to-red-900/10',
                  tag: 'Speed Mode', tagColor: 'bg-red-500/20 text-red-300',
                  action: onStartRapidFire
                },
                {
                  emoji: '📊', title: 'Resume Scorer', desc: 'Get your ATS compatibility score, detailed section analysis, and AI-powered suggestions to strengthen your resume.',
                  color: 'purple', border: 'border-purple-500/20 hover:border-purple-500/40',
                  bg: 'from-purple-500/5 to-purple-900/5 hover:from-purple-500/10 hover:to-purple-900/10',
                  tag: 'ATS Check', tagColor: 'bg-purple-500/20 text-purple-300',
                  action: onStartResumeScorer
                },
                {
                  emoji: '✨', title: 'Resume Builder', desc: 'Build a professional resume with 3 templates, AI-enhanced bullet points, and one-click PDF download.',
                  color: 'emerald', border: 'border-emerald-500/20 hover:border-emerald-500/40',
                  bg: 'from-emerald-500/5 to-emerald-900/5 hover:from-emerald-500/10 hover:to-emerald-900/10',
                  tag: 'New', tagColor: 'bg-emerald-500/20 text-emerald-300',
                  action: onStartResumeBuilder
                }
              ].map((card, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={card.action}
                  className={`p-6 bg-gradient-to-br ${card.bg} border ${card.border} rounded-2xl transition-all text-left group hover:shadow-xl hover:-translate-y-1 duration-300`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
                      {card.emoji}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{card.desc}</p>
                  <div className="mt-4 flex items-center gap-1.5 text-blue-400 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                    Get Started <ArrowRight size={14} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SOCIAL PROOF ==================== */}
        <section className="py-12 px-4 border-y border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '10,000+', label: 'Interviews Practiced', icon: '🎯' },
                { value: '4.8/5', label: 'User Satisfaction', icon: '⭐' },
                { value: '95%', label: 'Feel More Prepared', icon: '💪' },
                { value: '3 Min', label: 'Avg Setup Time', icon: '⚡' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-white font-bold text-xl">{stat.value}</p>
                  <p className="text-slate-500 text-xs">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== INTERVIEW SETUP FORM ==================== */}
        <section data-setup-section className="py-20 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-3xl font-bold text-white mb-3">Start Your Interview</h2>
              <p className="text-slate-400">Upload your resume, specify the role, and let AI create personalized questions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 space-y-6"
            >
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Upload size={16} className="text-blue-400" />
                  Upload Resume
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragActive
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-slate-700/50 hover:border-blue-500/30 bg-slate-800/20'
                    }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                    <Upload size={24} className="text-blue-400" />
                  </div>
                  <p className="text-white font-semibold mb-1">Drop your resume here</p>
                  <p className="text-slate-500 text-xs mb-4">or click to browse</p>
                  <label className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition font-semibold text-sm">
                    Choose File
                    <input type="file" onChange={handleFileChange} accept=".pdf,.docx" className="hidden" />
                  </label>
                  <p className="text-slate-600 text-xs mt-3">PDF or DOCX • Max 200MB</p>
                </div>
                {resumeFile && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="text-emerald-300 text-sm font-medium">{resumeFile.name}</span>
                  </div>
                )}
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Briefcase size={14} className="text-purple-400" /> Job Role
                  </label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g., Senior Python Developer"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition text-sm"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Target size={14} className="text-amber-400" /> Experience Level
                  </label>
                  <select className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-400 focus:border-blue-500/50 focus:outline-none transition text-sm appearance-none">
                    <option>Entry Level</option>
                    <option>Mid Level</option>
                    <option>Senior</option>
                    <option>Lead / Principal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                  <BookOpen size={14} className="text-cyan-400" /> Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for more targeted questions..."
                  rows="4"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition resize-none text-sm"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleStartInterview}
                disabled={loading || !resumeFile || !jobRole || !jobDescription}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 group text-sm shadow-lg shadow-blue-500/10 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Analyzing Resume & Generating Questions...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Start Standard Interview
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>
            </motion.div>
          </div>
        </section>

      </div>

      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
      {success && <Notification message={success} type="success" onClose={() => setSuccess(null)} />}
    </div>
  );
}

// ==================== INTERVIEW PAGE ====================
function InterviewPage({ sessionId, firstQuestion, totalQuestions, jobRole, interviewTips, onAnswer, onBack }) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion);
  const [answersData, setAnswersData] = useState([]);
  const [progress, setProgress] = useState({ current: 1, total: totalQuestions });

  // Voice Dictation States
  const [isListening, setIsListening] = useState(false);
  const [micStatus, setMicStatus] = useState('Off');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Use a ref to track if we should deliberately be listening
  const shouldListenRef = useRef(false);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setMicStatus('Listening...');
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let final = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (final) {
          setAnswer(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + final + ' ');
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
          setMicStatus('Permission Denied');
          shouldListenRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setInterimTranscript('');
        // Auto-restart if it was prematurely cut off by the browser (common issue on localhost)
        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart mic", e);
            shouldListenRef.current = false;
            setIsListening(false);
            setMicStatus('Error');
          }
        } else {
          setIsListening(false);
          setMicStatus('Off');
        }
      };

      recognitionRef.current = recognition;
    } else {
      setMicStatus('Not Supported');
    }

    return () => {
      if (recognitionRef.current) {
        shouldListenRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Microphone dictation is not supported in this browser.");
      return;
    }

    if (isListening) {
      shouldListenRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setMicStatus('Off');
    } else {
      try {
        shouldListenRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Start error:", e);
      }
    }
  };

  log('Interview page initialized', { sessionId, firstQuestion, totalQuestions });

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError('Please provide an answer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      log('Submitting answer', { sessionId, answer: answer.substring(0, 50) + '...' });

      const response = await axios.post(
        `${API_URL}/submit-answer/${sessionId}`,
        { answer: answer.trim() },
        { timeout: 60000 }
      );

      log('Answer response', response.data);

      if (response.data.status === 'completed') {
        log('Interview completed');
        onAnswer({
          isComplete: true,
          finalReport: response.data.final_report,
          learningReport: response.data.learning_report,
          summary: response.data.interview_summary,
          answers: [...answersData, {
            question: currentQuestion.question,
            evaluation: response.data.evaluation
          }]
        });
      } else {
        log('Next question', response.data.next_question);
        setAnswersData(prev => [...prev, {
          question: currentQuestion.question,
          evaluation: response.data.evaluation
        }]);
        setCurrentQuestion(response.data.next_question);
        setCurrentQuestionIndex(prev => prev + 1);
        setProgress(response.data.progress);
        setAnswer('');
      }
    } catch (err) {
      log('Answer error', err);
      setError(err.response?.data?.detail || 'Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader size={48} className="text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-white text-lg">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back & Progress */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition flex items-center gap-2 mb-6"
          >
            ← Back Home
          </button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                Q{progress.current} of {progress.total}
              </h2>
              <span className="text-slate-400 text-sm">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
                style={{
                  width: `${(progress.current / progress.total) * 100}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-400 text-sm font-semibold mb-2">Question {progress.current}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {currentQuestion?.question || 'Loading question...'}
              </h2>
            </div>
            <Eye size={24} className="text-blue-400 flex-shrink-0" />
          </div>

          {/* Question Tags */}
          {currentQuestion && (
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-300 text-xs font-semibold">
                {currentQuestion.type || 'General'}
              </span>
              <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 text-xs font-semibold">
                {currentQuestion.difficulty || 'Medium'}
              </span>
            </div>
          )}

          {/* Why Asked */}
          {currentQuestion?.why_asked && (
            <p className="text-slate-400 text-sm mt-4 italic border-l-2 border-blue-500 pl-4">
              💡 Why: {currentQuestion.why_asked}
            </p>
          )}
        </div>

        {/* Tips Box */}
        {interviewTips && currentQuestionIndex === 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
            <p className="text-green-300 text-sm font-semibold mb-2">✨ Interview Tips:</p>
            <ul className="space-y-1 text-green-300 text-xs">
              {interviewTips.map((tip, i) => (
                <li key={i}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Answer Input */}
        <div className="space-y-4 mb-6 relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-semibold flex items-center gap-2">
              {currentQuestion?.requires_code ? <><Code size={18} className="text-blue-400" /> Code Solution</> : 'Your Answer'}
            </h3>
            {!currentQuestion?.requires_code && (
              <div className="flex items-center gap-3">
                {isListening && <span className="text-cyan-400 text-xs animate-pulse font-medium">{micStatus}</span>}
                <button
                  onClick={toggleMic}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition ${isListening ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] animate-pulse' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                  {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                  {isListening ? 'Stop' : 'Dictate Answer'}
                </button>
              </div>
            )}
          </div>

          {currentQuestion?.requires_code ? (
            <div className="w-full bg-[#1e1e1e] border border-slate-600 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition">
              <Editor
                value={answer}
                onValueChange={code => setAnswer(code)}
                highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                padding={16}
                style={{
                  fontFamily: '"Fira Code", "Fira Mono", monospace',
                  fontSize: 15,
                  color: '#fff',
                  minHeight: '200px'
                }}
                className="focus:outline-none placeholder-slate-500"
                placeholder="// Write your code/logic here..."
              />
            </div>
          ) : (
            <textarea
              value={answer + (interimTranscript ? (answer && !answer.endsWith(' ') ? ' ' : '') + interimTranscript : '')}
              onChange={(e) => setAnswer(e.target.value)}
              readOnly={isListening}
              placeholder="Type or dictate your answer here... Be specific with examples"
              rows="7"
              className={`w-full bg-slate-700/50 border ${isListening ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-slate-600 focus:border-blue-500'} rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none`}
            />
          )}

          <div className="flex justify-between items-center text-sm mt-2">
            <p className="text-slate-400">{answer.length} characters</p>
            <p className={answer.length < 30 ? 'text-slate-500' : 'text-green-400'}>
              {answer.length < 30 ? 'Add more detail' : '✓ Good length'}
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !answer.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Answer
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/40 text-red-300 rounded-lg flex gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== RESULTS PAGE ====================
function ResultsPage({ data, onNewInterview }) {
  const summary = data?.summary || {};
  const learningReport = data?.learningReport || {};
  const finalReport = data?.finalReport || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Hero + Score */}
        <div className="text-center mb-12 pt-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-block mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 text-sm font-medium">Interview Complete</span>
            </div>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Your Results
          </motion.h1>

          {/* Animated Score Circle */}
          {summary.average_score && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mt-8 mb-10 flex justify-center">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="8" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={summary.average_score >= 7 ? '#10b981' : summary.average_score >= 5 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - summary.average_score / 10) }}
                    transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-4xl font-extrabold text-white">{summary.average_score}</motion.p>
                  <p className="text-slate-500 text-xs font-medium">out of 10</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        {summary.average_score && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              { icon: BarChart3, label: 'Questions', value: summary.total_questions || 0, color: 'blue' },
              { icon: Clock, label: 'Duration', value: summary.duration ? summary.duration.split('.')[0] : 'N/A', color: 'purple' },
              { icon: Zap, label: 'Readiness', value: summary.estimated_readiness || 'See report', color: 'green' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl p-5 text-center"
              >
                <stat.icon size={24} className={`mx-auto mb-2 ${stat.color === 'blue' ? 'text-blue-400' : stat.color === 'purple' ? 'text-purple-400' : 'text-emerald-400'
                  }`} />
                <p className="text-slate-500 text-xs mb-1">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Learning Report */}
        {learningReport.overall_assessment && (
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={24} className="text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Learning Report</h2>
            </div>

            <div className={`inline-block px-6 py-3 rounded-full font-bold mb-6 ${learningReport.confidence_level >= 8 ? 'bg-green-500/20 border border-green-500/40 text-green-300' :
              learningReport.confidence_level >= 5 ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300' :
                'bg-orange-500/20 border border-orange-500/40 text-orange-300'
              }`}>
              Confidence: {learningReport.confidence_level || 5}/10
            </div>

            <p className="text-white mb-6">{learningReport.overall_assessment}</p>

            {learningReport.strengths_demonstrated && (
              <div className="mb-6">
                <h3 className="text-green-400 font-semibold mb-3">✅ Strengths Demonstrated</h3>
                <ul className="space-y-2">
                  {learningReport.strengths_demonstrated.map((s, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {learningReport.areas_for_improvement && (
              <div className="mb-6">
                <h3 className="text-orange-400 font-semibold mb-3">📈 Areas to Improve</h3>
                <ul className="space-y-2">
                  {learningReport.areas_for_improvement.map((a, i) => (
                    <li key={i} className="text-slate-300 flex items-start gap-2">
                      <Lightbulb size={16} className="text-orange-400 mt-1 flex-shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {learningReport.next_steps && learningReport.next_steps.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-blue-400 font-semibold mb-3">🎯 Next Steps</h3>
                <ol className="space-y-2 text-blue-300 text-sm">
                  {learningReport.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {learningReport.motivational_message && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 italic">💪 {learningReport.motivational_message}</p>
              </div>
            )}
          </div>
        )}

        {/* Final Recommendation */}
        {finalReport.recommendation && (
          <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Interview Readiness</h2>

            <div className={`inline-block px-6 py-3 rounded-full font-bold mb-6 text-lg ${finalReport.recommendation === 'Strong Hire' ? 'bg-green-500/20 border border-green-500/40 text-green-300' :
              finalReport.recommendation === 'Good Fit' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' :
                'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'
              }`}>
              {finalReport.recommendation}
            </div>

            {finalReport.overall_summary && (
              <p className="text-white mb-4">{finalReport.overall_summary}</p>
            )}

            {finalReport.estimated_interview_success_rate && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300">Estimated Success Rate</span>
                  <span className="text-white font-bold">{finalReport.estimated_interview_success_rate}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full"
                    style={{ width: finalReport.estimated_interview_success_rate }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* New Interview Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center mt-10 pb-8">
          <button
            onClick={onNewInterview}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2.5 group shadow-lg shadow-blue-500/10 text-sm"
          >
            <Zap size={18} />
            Start Another Interview
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== PAGE TRANSITION WRAPPER ====================
const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.25, ease: 'easeInOut' } },
};

// ==================== USER NAVBAR ====================
function UserNavbar({ user, onLogout, onHome, currentPage, onOpenAuth }) {
  const [showMenu, setShowMenu] = useState(false);
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left — Logo */}
        <div className="flex items-center">
          <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Brain size={16} className="text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight hidden sm:block">InterVue AI</span>
          </button>
        </div>

        {/* Right — Profile */}
        <div className="relative">
          {user ? (
            <>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2.5 px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
                    <User size={14} className="text-blue-300" />
                  </div>
                )}
                <span className="text-white text-sm font-medium max-w-[120px] truncate hidden sm:block">{displayName}</span>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-12 w-52 py-1.5 rounded-xl border border-white/10 shadow-2xl z-50"
                    style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)' }}
                  >
                    <div className="px-4 py-2.5 border-b border-white/[0.06]">
                      <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-slate-500 text-xs truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => { setShowMenu(false); onLogout(); }}
                        className="w-full px-3 py-2 text-left text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-2 text-sm"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </>
          ) : (
            <button
               onClick={onOpenAuth}
               className="px-5 py-2 min-w-[120px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-500/20"
            >
               Log in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [page, setPage] = useState('landing');
  const [interviewSession, setInterviewSession] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  // ===== AUTH STATE =====
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) setCurrentUser(session.user.id);
      setAuthLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      log('Auth event', event);
      setSession(session);
      if (session?.user?.id) setCurrentUser(session.user.id);
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setPage('landing');
        setInterviewSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (session) => {
    setSession(session);
    setShowAuthModal(false);
  };

  const requireAuth = (message) => {
    if (!session) {
      setAuthMessage(message);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const handleRequireAuth = (e) => {
      const { message } = e.detail;
      if (!session) {
        setAuthMessage(message || 'Please log in to continue.');
        setShowAuthModal(true);
      } else {
        // If they are already logged in, dispatch success immediately
        window.dispatchEvent(new CustomEvent('auth-success'));
      }
    };
    window.addEventListener('require-auth', handleRequireAuth);
    return () => window.removeEventListener('require-auth', handleRequireAuth);
  }, [session]);

  const handleLogout = async () => {
    await signOut();
    setSession(null);
    setPage('landing');
    setInterviewSession(null);
  };

  // ===== PAGE HANDLERS =====
  const handleStartInterview = (data) => {
    if (!requireAuth("Sign up to save interview results and get detailed feedback.")) return;
    log('handleStartInterview called', data);
    setInterviewSession(data);
    setPage('interview');
  };

  const handleAnswer = (response) => {
    log('handleAnswer called', response);

    if (response.isComplete) {
      // Save to local history
      const avgScore = response.summary?.average_score || 0;
      const parsedScore = typeof avgScore === 'string' ? parseFloat(avgScore) : avgScore;
      saveInterview({
        mode: 'standard',
        jobRole: interviewSession?.jobRole || 'Unknown',
        score: parsedScore,
        questionsCount: response.summary?.total_questions || 0,
        readiness: response.summary?.estimated_readiness || '',
      });

      // Save to Supabase DB
      saveInterviewToDB({
        mode: 'standard',
        job_role: interviewSession?.jobRole || 'Unknown',
        job_description: interviewSession?.jobDescription || '',
        score: parsedScore,
        final_report: response.finalReport || {},
        learning_report: response.learningReport || {},
        questions: [],
        answers: [],
        duration_seconds: 0,
      });

      setPage('results');
      setInterviewSession({
        ...interviewSession,
        results: response
      });
    }
  };

  const handleNewInterview = () => {
    setPage('landing');
    setInterviewSession(null);
  };

  const handleStartRapidFire = () => {
    if (!requireAuth("Sign up to save your Rapid Fire performance and unlock personalized AI insights.")) return;
    setPage('rapid-fire');
  };

  const handleBackToHome = () => {
    setPage('landing');
  };

  const handleStartVoiceMode = (data) => {
    setInterviewSession(data);
    setPage('voice-mode');
  };

  const handleStartResumeScorer = () => {
    if (!requireAuth("Sign up to unlock advanced AI ATS checking and resume optimization.")) return;
    setPage('resume-scorer');
  };

  const handleStartResumeBuilder = () => {
    if (!requireAuth("Sign up to save your resumes and access premium AI-enhanced templates.")) return;
    setPage('resume-builder');
  };

  const handleResumeAnalysisComplete = (data) => {
    setResumeAnalysis(data);
    setPage('resume-report');
  };

  const handleStartHistory = () => {
    setPage('history');
  };

  // ===== AUTH LOADING =====
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader size={40} className="text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading InterVue AI...</p>
        </motion.div>
      </div>
    );
  }

  // ===== MAIN APP =====
  return (
    <div className="min-h-screen bg-slate-950 relative">
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess} 
        message={authMessage} 
      />
      {/* User Navbar */}
      <UserNavbar user={session?.user} onLogout={handleLogout} onHome={() => setPage('landing')} currentPage={page} onOpenAuth={() => { setAuthMessage('Welcome to InterVue AI'); setShowAuthModal(true); }} />

      <div className="pt-14">
        <AnimatePresence mode="wait">
          {page === 'landing' && (
            <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <LandingPage
                isAuthenticated={!!session}
                userName={session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0]}
                onStartInterview={handleStartInterview}
                onStartRapidFire={handleStartRapidFire}
                onStartResumeScorer={handleStartResumeScorer}
                onStartResumeBuilder={handleStartResumeBuilder}
                onStartHistory={handleStartHistory}
              />
            </motion.div>
          )}

          {page === 'history' && (
            <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HistoryDashboard onBack={handleBackToHome} onStartRapidFire={handleStartRapidFire} />
            </motion.div>
          )}

          {/* RESUME SCORER PAGES */}
          {page === 'resume-scorer' && (
            <motion.div key="resume-scorer" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="min-h-screen bg-slate-950 relative">
                <button onClick={handleBackToHome} className="absolute top-20 left-6 text-slate-400 hover:text-white flex items-center gap-2 z-40">← Back</button>
                <ResumeUpload onAnalysisComplete={handleResumeAnalysisComplete} />
              </div>
            </motion.div>
          )}
          {page === 'resume-report' && (
            <motion.div key="resume-report" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="min-h-screen bg-slate-950">
                <ResumeReport analysis={resumeAnalysis} onReset={() => setPage('resume-scorer')} />
              </div>
            </motion.div>
          )}

          {page === 'resume-builder' && (
            <motion.div key="resume-builder" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ResumeBuilder onBack={handleBackToHome} />
            </motion.div>
          )}

          {page === 'interview' && interviewSession && (
            <motion.div key="interview" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <InterviewRoom
                sessionId={interviewSession.sessionId}
                firstQuestion={interviewSession.firstQuestion}
                totalQuestions={interviewSession.totalQuestions}
                jobRole={interviewSession.jobRole}
                interviewTips={interviewSession.interviewTips}
                onAnswer={handleAnswer}
                onBack={() => setPage('landing')}
              />
            </motion.div>
          )}
          {page === 'results' && interviewSession?.results && (
            <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ResultsPage
                data={interviewSession.results}
                onNewInterview={handleNewInterview}
              />
            </motion.div>
          )}

          {page === 'rapid-fire' && (
            <motion.div key="rapid-fire" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <RapidFire onBack={handleBackToHome} onStartVoice={handleStartVoiceMode} />
            </motion.div>
          )}
          {page === 'voice-mode' && interviewSession && (
            <motion.div key="voice-mode" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <VoiceInterview
                initialData={interviewSession}
                onBack={handleBackToHome}
                onComplete={(data) => {
                  const voiceScore = data?.summary?.average_score || 0;
                  // Save voice interview to local history
                  saveInterview({
                    mode: 'voice',
                    jobRole: interviewSession?.jobRole || 'Unknown',
                    score: voiceScore,
                    questionsCount: data?.summary?.total_questions || 0,
                  });
                  // Save to Supabase DB
                  saveInterviewToDB({
                    mode: 'voice',
                    job_role: interviewSession?.jobRole || 'Unknown',
                    score: voiceScore,
                    final_report: data?.finalReport || {},
                    learning_report: data?.learningReport || {},
                    questions: [],
                    answers: [],
                    duration_seconds: 0,
                  });
                  setInterviewSession({ ...interviewSession, results: data });
                  setPage('results');
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}