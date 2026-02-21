import React, { useState, useEffect, useRef } from 'react';
import {
  Upload, Send, Loader, CheckCircle, AlertCircle,
  Award, Clock, ArrowRight, Zap, Brain,
  BookOpen, Lightbulb, Target, BarChart3, Eye,
  Mic, MicOff, Code
} from 'lucide-react';
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
function LandingPage({ onStartInterview, onStartRapidFire, onStartResumeScorer }) {
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

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('job_role', jobRole);
      formData.append('job_description', jobDescription);

      log('Uploading resume', { file: resumeFile.name, jobRole, jobDescription: jobDescription.substring(0, 50) + '...' });

      const response = await axios.post(`${API_URL}/upload-resume`, formData, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center pt-16 pb-12">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full backdrop-blur">
            <span className="text-blue-300 text-sm font-semibold flex items-center gap-2">
              <Brain size={16} /> Smart Interview Prep
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 text-white leading-tight">
            InterVue AI
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Personalized interview prep with AI-generated questions, real-time feedback, and confidence-building insights
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto px-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Brain, label: 'Smart Questions', desc: '3-6 adaptive questions' },
              { icon: Lightbulb, label: 'Real Tips', desc: 'Actionable interview tips' },
              { icon: BookOpen, label: 'Learn', desc: 'Confidence building' },
              { icon: Target, label: 'Focused', desc: 'Job-specific prep' }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 rounded-lg transition-all"
              >
                <feature.icon size={28} className="text-blue-400 mb-3" />
                <h3 className="text-white font-semibold text-sm mb-1">{feature.label}</h3>
                <p className="text-slate-400 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Form Container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Info Side */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Why InterVue?</h2>
                <ul className="space-y-3">
                  {[
                    'Questions match your experience level',
                    'Learn what interviewers look for',
                    'Real interview tips & strategies',
                    'Confidence boost before applying',
                    'Detailed performance analysis'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle size={18} className="text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Form Side */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 space-y-6">
                <h2 className="text-2xl font-bold text-white">Choose Your Training Mode</h2>

                {/* THREE BUTTONS SECTION - RAPID FIRE + STANDARD + RESUME SCORER */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* RAPID FIRE BUTTON */}
                  <button
                    onClick={onStartRapidFire}
                    className="p-4 bg-gradient-to-br from-red-600/20 to-red-900/20 hover:from-red-600/30 hover:to-red-900/30 border-2 border-red-500/40 hover:border-red-500/60 rounded-xl transition-all group text-left"
                  >
                    <div className="text-xl mb-2">🔥</div>
                    <h3 className="text-white font-bold mb-1">Rapid Fire</h3>
                    <p className="text-red-300 text-[10px] sm:text-xs">Speed Mode • 60s/Q</p>
                  </button>

                  {/* RESUME SCORER BUTTON (NEW) */}
                  <button
                    onClick={onStartResumeScorer}
                    className="p-4 bg-gradient-to-br from-purple-600/20 to-purple-900/20 hover:from-purple-600/30 hover:to-purple-900/30 border-2 border-purple-500/40 hover:border-purple-500/60 rounded-xl transition-all group text-left"
                  >
                    <div className="text-xl mb-2">📄</div>
                    <h3 className="text-white font-bold mb-1">Resume AI</h3>
                    <p className="text-purple-300 text-[10px] sm:text-xs">Score + ATS Check</p>
                  </button>

                  {/* STANDARD BUTTON */}
                  <button
                    onClick={() => document.querySelector('[data-standard-scroll]')?.scrollIntoView({ behavior: 'smooth' })}
                    className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-900/20 hover:from-blue-600/30 hover:to-blue-900/30 border-2 border-blue-500/40 hover:border-blue-500/60 rounded-xl transition-all group text-left"
                  >
                    <div className="text-xl mb-2">📝</div>
                    <h3 className="text-white font-bold mb-1">Standard</h3>
                    <p className="text-blue-300 text-[10px] sm:text-xs">Deep Dive Interview</p>
                  </button>
                </div>

                {/* Standard Interview Form */}
                <div data-standard-scroll className="space-y-6 pt-6 border-t border-slate-600">
                  <h3 className="text-lg font-semibold text-white">📝 Standard Interview Setup</h3>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">
                      <Upload size={18} className="inline mr-2" />
                      Upload Resume
                    </label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-slate-600 hover:border-blue-500/60 bg-slate-800/50'
                        }`}
                    >
                      <Upload size={40} className="mx-auto mb-3 text-blue-400" />
                      <p className="text-white font-semibold">Drag resume here or</p>
                      <label className="inline-block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition font-semibold text-sm">
                        Browse Files
                        <input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.docx"
                          className="hidden"
                        />
                      </label>
                      <p className="text-slate-400 text-xs mt-2">PDF or DOCX • Max 200MB</p>
                    </div>
                    {resumeFile && (
                      <div className="mt-3 p-3 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-400" />
                        <span className="text-green-300 text-sm font-semibold">{resumeFile.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Job Role */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      💼 Job Role
                    </label>
                    <input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g., Senior Python Developer"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                    />
                  </div>

                  {/* Job Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      📋 Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste job description here..."
                      rows="4"
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
                    />
                  </div>

                  {/* Start Standard Button */}
                  <button
                    onClick={handleStartInterview}
                    disabled={loading || !resumeFile || !jobRole || !jobDescription}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        Analyzing & Generating Questions...
                      </>
                    ) : (
                      <>
                        Start Standard Interview
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full">
            <span className="text-blue-300 text-sm font-semibold">Interview Complete</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Your Results & Learning Report</h1>
        </div>

        {/* Stats */}
        {summary.average_score && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-xl p-6 text-center">
              <Award size={32} className="mx-auto mb-3 text-yellow-400" />
              <p className="text-slate-400 text-sm mb-2">Average Score</p>
              <p className="text-3xl font-bold text-white">{summary.average_score}/10</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-xl p-6 text-center">
              <BarChart3 size={32} className="mx-auto mb-3 text-blue-400" />
              <p className="text-slate-400 text-sm mb-2">Questions</p>
              <p className="text-3xl font-bold text-white">{summary.total_questions || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-xl p-6 text-center">
              <Clock size={32} className="mx-auto mb-3 text-purple-400" />
              <p className="text-slate-400 text-sm mb-2">Duration</p>
              <p className="text-2xl font-bold text-white">{summary.duration ? summary.duration.split('.')[0] : 'N/A'}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-xl p-6 text-center">
              <Zap size={32} className="mx-auto mb-3 text-green-400" />
              <p className="text-slate-400 text-sm mb-2">Readiness</p>
              <p className="text-lg font-bold text-green-400">{summary.estimated_readiness || 'See report'}</p>
            </div>
          </div>
        )}

        {/* Learning Report */}
        {learningReport.overall_assessment && (
          <div className="bg-gradient-to-br from-slate-800/40 to-blue-900/40 backdrop-blur border border-blue-500/30 rounded-2xl p-8 mb-8">
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
        <div className="text-center">
          <button
            onClick={onNewInterview}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-lg transition-all inline-flex items-center gap-2 group"
          >
            <Zap size={20} />
            Start Another Interview
            <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function App() {
  const [page, setPage] = useState('landing');
  const [interviewSession, setInterviewSession] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null); // New State for Resume Report

  const handleStartInterview = (data) => {
    log('handleStartInterview called', data);
    setInterviewSession(data);
    setPage('interview');
  };

  const handleAnswer = (response) => {
    log('handleAnswer called', response);

    if (response.isComplete) {
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

  // ADD THESE TWO FUNCTIONS:
  const handleStartRapidFire = () => {
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
    setPage('resume-scorer');
  };

  const handleResumeAnalysisComplete = (data) => {
    setResumeAnalysis(data);
    setPage('resume-report');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {page === 'landing' && (
        <LandingPage
          onStartInterview={handleStartInterview}
          onStartRapidFire={handleStartRapidFire}
          onStartResumeScorer={handleStartResumeScorer}
        />
      )}
      {/* RESUME SCORER PAGES */}
      {page === 'resume-scorer' && (
        <div className="min-h-screen bg-slate-950 relative">
          <button onClick={handleBackToHome} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 z-50">← Back</button>
          <ResumeUpload onAnalysisComplete={handleResumeAnalysisComplete} />
        </div>
      )}
      {page === 'resume-report' && (
        <div className="min-h-screen bg-slate-950">
          <ResumeReport analysis={resumeAnalysis} onReset={() => setPage('resume-scorer')} />
        </div>
      )}

      {page === 'interview' && interviewSession && (
        <InterviewPage
          sessionId={interviewSession.sessionId}
          firstQuestion={interviewSession.firstQuestion}
          totalQuestions={interviewSession.totalQuestions}
          jobRole={interviewSession.jobRole}
          interviewTips={interviewSession.interviewTips}
          onAnswer={handleAnswer}
          onBack={() => setPage('landing')}
        />
      )}
      {page === 'results' && interviewSession?.results && (
        <ResultsPage
          data={interviewSession.results}
          onNewInterview={handleNewInterview}
        />
      )}
      {/* ADD THIS: */}
      {page === 'rapid-fire' && (
        <RapidFire onBack={handleBackToHome} onStartVoice={handleStartVoiceMode} />
      )}
      {page === 'voice-mode' && interviewSession && (
        <VoiceInterview
          initialData={interviewSession}
          onBack={handleBackToHome}
          onComplete={(data) => {
            setInterviewSession({ ...interviewSession, results: data });
            setPage('results');
          }}
        />
      )}
    </div>
  );
}