import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader, AlertCircle, CheckCircle, BarChart3, Clock, Zap, Eye, Flame, Target, Award } from 'lucide-react';
import { saveInterview } from './utils/historyManager';
import { saveInterviewToDB, startRapidFireSession, submitRapidFireBatch } from './utils/apiClient';
import { buildInterviewRecord } from './utils/interviewData';


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

// ==================== RAPID FIRE START SCREEN ====================
function RapidFireStart({ onStart, onBack, onStartVoice }) {
  const [jobRole, setJobRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questionCount, setQuestionCount] = useState(10);

  const handleStart = async (mode = 'text') => {
    if (!jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // We use the SAME endpoint to get questions, just route differently after
      const response = await startRapidFireSession({
        job_role: jobRole,
        difficulty: "medium",
        num_questions: questionCount
      });

      const sessionData = {
        interviewId: response.interview_id,
        jobRole: jobRole,
        config: response.config,
        firstQuestion: response.first_question,
        questions: response.questions_list || [],
        totalQuestions: response.total_questions || questionCount
      };

      if (mode === 'voice') {
        if (onStartVoice) onStartVoice(sessionData);
      } else {
        onStart(sessionData);
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start rapid fire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Back Button */}
        <div className="pt-2 px-6">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-white transition flex items-center gap-2 mb-8"
          >
            ← Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center pt-8 pb-12">
          <div className="inline-block mb-6 px-4 py-2 bg-rose-500/20 border border-rose-500/40 rounded-full backdrop-blur">
            <span className="text-rose-300 text-sm font-semibold flex items-center gap-2">
              <Flame size={16} className="animate-bounce" /> Rapid Fire Challenge
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-4 text-white leading-tight">
            🔥 Rapid Fire
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {questionCount} adaptive questions • 60 seconds each • Real interview simulation • Live scoring
          </p>
        </div>

        {/* Main Container */}
        <div className="max-w-2xl mx-auto px-4 mb-16">
          <div className="bg-gradient-to-br from-slate-800/50 to-rose-900/30 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 space-y-8">
            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-xs font-semibold text-rose-300">{questionCount} Questions</div>
              </div>
              <div className="text-center p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="text-xs font-semibold text-orange-300">60 Sec Each</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-xs font-semibold text-red-300">Adaptive</div>
              </div>
            </div>

            {/* Question Count Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                🎯 How many questions?
              </label>
              <div className="flex gap-2">
                {[5, 7, 10, 15].map(count => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all border ${questionCount === count
                      ? 'bg-gradient-to-r from-rose-600 to-orange-500 text-white border-rose-400 shadow-lg shadow-rose-900/30 scale-105'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:border-rose-500/50 hover:text-white'
                      }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="text-slate-500 text-xs mt-2 text-center">
                {questionCount <= 5 ? '⚡ Quick practice' : questionCount <= 7 ? '🎯 Balanced round' : questionCount <= 10 ? '🔥 Full challenge' : '💪 Extended marathon'}
              </p>
            </div>

            {/* Job Role Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                💼 Job Role / Position
              </label>
              <input
                type="text"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                placeholder="e.g., Senior Python Developer, Data Analyst, Product Manager"
                className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition text-lg"
              />
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-r from-rose-500/10 to-orange-500/10 border border-rose-500/30 rounded-xl p-4 space-y-2">
              <p className="text-rose-300 text-sm font-semibold">✨ What's Included:</p>
              <ul className="space-y-1 text-rose-300 text-xs">
                <li>✓ Questions adapt to your performance</li>
                <li>✓ Difficulty increases as you improve</li>
                <li>✓ Real-time feedback after each answer</li>
                <li>✓ Detailed performance analytics</li>
              </ul>
            </div>

            {/* Start Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => handleStart('text')}
                disabled={loading || !jobRole.trim()}
                className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-lg shadow-lg shadow-rose-900/20"
              >
                {loading ? (
                  <>
                    <Loader size={24} className="animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    🔥 Start Rapid Fire (Text)
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>

              <button
                onClick={() => handleStart('voice')}
                disabled={loading || !jobRole.trim()}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
              >
                <div className="p-1 bg-red-500 rounded-full animate-pulse mr-2"></div>
                🎙️ Start Voice Mode (Beta)
              </button>
            </div>

            <p className="text-center text-slate-400 text-xs">
              💡 Tip: Be specific with examples • Stay confident • Good luck!
            </p>
          </div>
        </div>
      </div>

      {error && <Notification message={error} type="error" onClose={() => setError(null)} />}
    </div>
  );
}

// ==================== RAPID FIRE INTERVIEW SCREEN ====================
function RapidFireInterview({ interviewData, onAnswer, onBack }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(interviewData.firstQuestion);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [allAnswers, setAllAnswers] = useState([]);
  const [currentDifficulty, setCurrentDifficulty] = useState('Medium');

  const progress = ((currentQuestionIndex + 1) / interviewData.totalQuestions) * 100;
  const currentScore = allAnswers.length > 0 ? Math.round(allAnswers.reduce((a, b) => a + b.score, 0) / allAnswers.length) : 0;

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, answer]);

  // Calculate adaptive difficulty
  useEffect(() => {
    if (allAnswers.length > 0) {
      const avgScore = allAnswers.reduce((a, b) => a + b.score, 0) / allAnswers.length;
      if (avgScore >= 8) {
        setCurrentDifficulty('Hard');
      } else if (avgScore >= 6) {
        setCurrentDifficulty('Medium');
      } else {
        setCurrentDifficulty('Easy');
      }
    }
  }, [allAnswers]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError('Please write an answer');
      return;
    }

    const currentAnswerData = {
      question: currentQuestion.question,
      answer: answer.trim()
    };

    const updatedAnswers = [...allAnswers, currentAnswerData];
    setAllAnswers(updatedAnswers);

    // Check if this was the last question
    if (currentQuestionIndex + 1 >= interviewData.totalQuestions) {
      setLoading(true);
      setError(null);
      try {
        const response = await submitRapidFireBatch({
          items: updatedAnswers,
          job_role: interviewData.jobRole,
          session_id: interviewData.interviewId
        });

        onAnswer({
          isComplete: true,
          results: response.results,
          allAnswers: updatedAnswers
        });
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to generate final report. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // Not the last question -> Just move to next immediately (Zero Latency)
      setFeedback({
        score: 0,
        feedback: "Answer Saved! Next..."
      });
      
      setTimeout(() => {
        // Move to next question from the pre-loaded questions_list
        const nextIdx = currentQuestionIndex + 1;
        if (interviewData.questions && interviewData.questions[nextIdx]) {
          setCurrentQuestion(interviewData.questions[nextIdx]);
        }
        
        setCurrentQuestionIndex(nextIdx);
        setAnswer('');
        setTimeLeft(60);
        setFeedback(null);
      }, 400); // Very brief feedback transition
    }
  };

  const getTimerColor = () => {
    if (timeLeft <= 10) return 'text-red-500';
    if (timeLeft <= 20) return 'text-orange-500';
    return 'text-white';
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-white transition flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-orange-500" />
                <span className="text-slate-300">Streak: {allAnswers.length}/10</span>
              </div>
              <div className={`flex items-center gap-2 font-bold ${currentScore > 0 ? getScoreColor(currentScore) : 'text-slate-400'}`}>
                <Target size={16} />
                <span>Score: {currentScore > 0 ? currentScore : '--'}/10</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                Question {currentQuestionIndex + 1}/{interviewData.totalQuestions}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">{Math.round(progress)}%</span>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${currentDifficulty === 'Hard' ? 'bg-red-500/20 text-red-300' :
                  currentDifficulty === 'Medium' ? 'bg-orange-500/20 text-orange-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                  {currentDifficulty}
                </div>
              </div>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-600 to-orange-500 h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Timer - Circular Ring */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={2 * Math.PI * 52 * (1 - timeLeft / 60)}
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold font-mono ${getTimerColor()} transition-colors ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                {String(timeLeft).padStart(2, '0')}
              </span>
              <span className="text-slate-500 text-[10px] font-medium">{timeLeft <= 10 ? 'HURRY!' : 'SEC LEFT'}</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-rose-900/30 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-rose-400 text-sm font-semibold mb-2">Question {currentQuestionIndex + 1}</p>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {currentQuestion.question}
              </h2>
            </div>
            <Eye size={28} className="text-rose-400 flex-shrink-0" />
          </div>

          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-rose-300 text-xs font-semibold">
              {currentQuestion.type}
            </span>
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 text-xs font-semibold">
              Type: Interview
            </span>
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mb-6 p-6 rounded-xl border-l-4 animate-in ${feedback.score >= 8
            ? 'bg-green-500/10 border-l-green-500 text-green-300'
            : feedback.score >= 6
              ? 'bg-yellow-500/10 border-l-yellow-500 text-yellow-300'
              : 'bg-orange-500/10 border-l-orange-500 text-orange-300'
            }`}>
            {feedback.score > 0 && (
              <p className="text-3xl font-bold mb-2 flex items-center gap-2">
                {feedback.score >= 8 ? '✅' : feedback.score >= 6 ? '👍' : '💪'} {feedback.score}/10
              </p>
            )}
            <p className="text-sm font-semibold">{feedback.feedback}</p>
          </div>
        )}

        {/* Answer Input */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <label className="text-slate-300 font-semibold">Your Answer:</label>
            <div className="text-xs text-slate-400">
              {answer.length < 50 ? (
                <span className="text-slate-500">Add more detail...</span>
              ) : answer.length < 100 ? (
                <span className="text-yellow-400">✓ Good length</span>
              ) : (
                <span className="text-green-400">✓ Excellent</span>
              )}
            </div>
          </div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here... Be specific and confident!"
            rows="6"
            disabled={feedback !== null || loading}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition resize-none disabled:opacity-50"
          />
          <div className="flex justify-between text-xs mt-2">
            <p className="text-slate-400">{answer.length} characters</p>
            <p className="text-slate-400">Min 50 chars recommended</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !answer.trim() || feedback !== null}
          className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {loading ? (
            <>
              <Loader size={24} className="animate-spin" />
              Evaluating...
            </>
          ) : (
            <>
              ✓ Submit Answer
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

// ==================== RAPID FIRE RESULTS SCREEN ====================
function RapidFireResults({ results, allAnswers, onNewInterview, onBack }) {
  const avgScore = results.average_score;
  const getResultsEmoji = () => {
    if (avgScore >= 8) return '🎉';
    if (avgScore >= 7) return '✅';
    if (avgScore >= 6) return '👍';
    return '💪';
  };

  const getResultsTitle = () => {
    if (avgScore >= 8) return 'Excellent Performance!';
    if (avgScore >= 7) return 'Good Job!';
    if (avgScore >= 6) return 'Great Effort!';
    return 'Keep Practicing!';
  };

  const getResultsMessage = () => {
    if (avgScore >= 8) return 'You\'re interview-ready! Outstanding performance across all questions.';
    if (avgScore >= 7) return 'Strong performance! A few more practice sessions and you\'re golden.';
    if (avgScore >= 6) return 'Good foundation! Focus on the lower-scoring areas for improvement.';
    return 'Keep grinding! Every practice session makes you stronger.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header + Score Circle */}
        <div className="text-center mb-12 pt-8">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
            {getResultsEmoji()} {getResultsTitle()}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-slate-400 mb-6">{getResultsMessage()}</motion.p>

          {/* Animated Score Circle */}
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="flex justify-center">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(244,63,94,0.1)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={avgScore >= 7 ? '#10b981' : avgScore >= 5 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - avgScore / 10) }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-4xl font-extrabold text-white">{avgScore}</motion.span>
                <span className="text-slate-500 text-xs font-medium">out of 10</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Award, label: 'Best', value: `${results.best_score}/10`, color: 'text-yellow-400' },
            { icon: BarChart3, label: 'Worst', value: `${results.worst_score}/10`, color: 'text-orange-400' },
            { icon: Clock, label: 'Time', value: `${Math.round(results.total_time_seconds / 60)}m`, color: 'text-blue-400' },
            { icon: Zap, label: 'Questions', value: results.total_questions, color: 'text-emerald-400' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="bg-slate-900/60 backdrop-blur border border-slate-800/50 rounded-2xl p-4 text-center"
            >
              <stat.icon size={22} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Score Breakdown */}
        <div className="bg-gradient-to-br from-slate-800/50 to-rose-900/30 backdrop-blur border border-rose-500/30 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Your Scores</h2>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {results.scores.map((score, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-center font-bold transition-transform hover:scale-110 ${score >= 8
                  ? 'bg-green-500/20 border border-green-500/40 text-green-300'
                  : score >= 6
                    ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'
                    : 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                  }`}
              >
                <div className="text-xs mb-1">Q{i + 1}</div>
                <div className="text-lg">{score}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-gradient-to-br from-slate-800/50 to-rose-900/30 backdrop-blur border border-rose-500/30 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">📈 Next Steps</h2>
          <div className="space-y-3">
            {avgScore >= 8 ? (
              <>
                <p className="text-slate-300">✅ You're ready for interviews! Focus on maintaining consistency.</p>
                <p className="text-slate-300">✅ Try different job roles for variety.</p>
                <p className="text-slate-300">✅ Practice behavioral questions for common scenarios.</p>
              </>
            ) : avgScore >= 6 ? (
              <>
                <p className="text-slate-300">💡 Focus on your lower-scoring questions.</p>
                <p className="text-slate-300">💡 Practice articulation and provide more specific examples.</p>
                <p className="text-slate-300">💡 Do one more rapid fire session this week.</p>
              </>
            ) : (
              <>
                <p className="text-slate-300">💪 Keep practicing! Every attempt makes you better.</p>
                <p className="text-slate-300">💪 Take notes on what questions are hardest.</p>
                <p className="text-slate-300">💪 Do 3-4 more sessions for major improvement.</p>
              </>
            )}
          </div>
        </div>

        {/* Buttons */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex gap-3 justify-center">
          <button
            onClick={onNewInterview}
            className="px-7 py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white font-bold rounded-xl transition-all inline-flex items-center gap-2 text-sm shadow-lg shadow-rose-500/10"
          >
            🔄 Try Again
          </button>
          <button
            onClick={onBack}
            className="px-7 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition-all text-sm"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== MAIN RAPID FIRE COMPONENT ====================
export default function RapidFire({ onBack, onStartVoice }) {
  const [stage, setStage] = useState('start'); // start, interview, results
  const [interviewData, setInterviewData] = useState(null);
  const [results, setResults] = useState(null);
  const [allAnswers, setAllAnswers] = useState([]);

  const handleStart = (data) => {
    setInterviewData(data);
    setStage('interview');
  };

  const handleAnswer = (response) => {
    if (response.isComplete) {
      setResults(response.results);
      setAllAnswers(response.allAnswers);
      setStage('results');

      // Save to local history
      const record = buildInterviewRecord({
        mode: 'rapid_fire',
        jobRole: interviewData?.jobRole || 'Unknown',
        result: response,
        answers: response.allAnswers || [],
        durationSeconds: Math.round(response.results?.total_time_seconds || 0),
      });
      saveInterview(record);

      // Save to Supabase DB
      saveInterviewToDB({
        ...record,
        job_role: record.jobRole,
      });
    }
  };

  const handleNewInterview = () => {
    setStage('start');
    setInterviewData(null);
    setResults(null);
    setAllAnswers([]);
  };

  return (
    <>
      {stage === 'start' && <RapidFireStart onStart={handleStart} onBack={onBack} onStartVoice={onStartVoice} />}
      {stage === 'interview' && interviewData && (
        <RapidFireInterview interviewData={interviewData} onAnswer={handleAnswer} onBack={() => setStage('start')} />
      )}
      {stage === 'results' && results && (
        <RapidFireResults results={results} allAnswers={allAnswers} onNewInterview={handleNewInterview} onBack={onBack} />
      )}
    </>
  );
}
