import React, { useState, useEffect } from 'react';
import { 
  Upload, Send, Loader, CheckCircle, AlertCircle,
  Award, Clock, ArrowRight, Zap, Brain,
  BookOpen, Lightbulb, Target, BarChart3, Eye
} from 'lucide-react';
import axios from 'axios';
import RapidFire from './RapidFire'; // ADD THIS LINE

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
function LandingPage({ onStartInterview, onStartRapidFire }) {
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
                <h2 className="text-2xl font-bold text-white">Choose Your Interview Style</h2>

                {/* TWO BUTTONS SECTION - RAPID FIRE + STANDARD */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* RAPID FIRE BUTTON */}
                  <button
                    onClick={onStartRapidFire}
                    className="p-6 bg-gradient-to-br from-red-600/20 to-red-900/20 hover:from-red-600/30 hover:to-red-900/30 border-2 border-red-500/40 hover:border-red-500/60 rounded-xl transition-all group"
                  >
                    <div className="text-2xl mb-2">🔥</div>
                    <h3 className="text-white font-bold mb-1">Rapid Fire</h3>
                    <p className="text-red-300 text-xs">8-10 questions • 60 sec each</p>
                    <p className="text-red-300 text-xs mt-2">Speed challenge mode</p>
                  </button>

                  {/* STANDARD BUTTON */}
                  <button
                    onClick={() => document.querySelector('[data-standard-scroll]')?.scrollIntoView({ behavior: 'smooth' })}
                    className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-900/20 hover:from-blue-600/30 hover:to-blue-900/30 border-2 border-blue-500/40 hover:border-blue-500/60 rounded-xl transition-all group"
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <h3 className="text-white font-bold mb-1">Standard</h3>
                    <p className="text-blue-300 text-xs">3-6 questions • Detailed prep</p>
                    <p className="text-blue-300 text-xs mt-2">Upload resume mode</p>
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
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        dragActive
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
        <div className="space-y-4 mb-6">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Be specific with examples"
            rows="7"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
          />
          <div className="flex justify-between items-center text-sm">
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

            <div className={`inline-block px-6 py-3 rounded-full font-bold mb-6 ${
              learningReport.confidence_level >= 8 ? 'bg-green-500/20 border border-green-500/40 text-green-300' :
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
            
            <div className={`inline-block px-6 py-3 rounded-full font-bold mb-6 text-lg ${
              finalReport.recommendation === 'Strong Hire' ? 'bg-green-500/20 border border-green-500/40 text-green-300' :
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

  return (
    <div className="min-h-screen bg-slate-950">
      {page === 'landing' && (
        <LandingPage 
          onStartInterview={handleStartInterview}
          onStartRapidFire={handleStartRapidFire}
        />
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
        <RapidFire onBack={handleBackToHome} />
      )}
    </div>
  );
}