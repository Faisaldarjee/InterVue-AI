import React, { useState } from 'react';
import { Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RapidFire from './RapidFire';
import VoiceInterview from './VoiceInterview';
import ResumeUpload from './ResumeUpload';
import ResumeReport from './ResumeReport';
import ResumeBuilder from './ResumeBuilder';
import InterviewRoom from './InterviewRoom';
import HistoryDashboard from './components/HistoryDashboard';
import AuthModal from './components/AuthModal';
import SharedResultsPage from './components/ResultsPage';
import SharedUserNavbar from './components/UserNavbar';
import SharedLandingPage from './components/LandingPage';
import { saveInterview } from './utils/historyManager';
import { saveInterviewToDB } from './utils/apiClient';
import { buildInterviewRecord, normalizeInterviewResult } from './utils/interviewData';
import useIntervueAuth from './hooks/useIntervueAuth';

const pageVariants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.25, ease: 'easeInOut' } },
};

export default function App() {
  const [page, setPage] = useState('landing');
  const [interviewSession, setInterviewSession] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const {
    session,
    authLoading,
    showAuthModal,
    authMessage,
    requireAuth,
    openAuthModal,
    closeAuthModal,
    handleAuthSuccess,
    handleLogout,
  } = useIntervueAuth({
    onSignedOut: () => {
      setPage('landing');
      setInterviewSession(null);
    },
  });

  const persistCompletedSession = ({ mode, payload, jobRole, jobDescription = '' }) => {
    const normalizedResponse = normalizeInterviewResult(payload);
    const record = buildInterviewRecord({
      mode,
      jobRole: jobRole || 'Unknown',
      jobDescription,
      result: normalizedResponse,
    });

    saveInterview(record);
    saveInterviewToDB({
      ...record,
      job_role: record.jobRole,
      job_description: record.jobDescription,
    });

    return normalizedResponse;
  };

  const handleStartInterview = (data) => {
    if (!requireAuth('Sign up to save interview results and get detailed feedback.')) return;
    setInterviewSession(data);
    setPage('interview');
  };

  const handleInterviewComplete = (response) => {
    if (!response?.isComplete) return;

    const normalizedResponse = persistCompletedSession({
      mode: 'standard',
      payload: response,
      jobRole: interviewSession?.jobRole || 'Unknown',
      jobDescription: interviewSession?.jobDescription || '',
    });

    setInterviewSession((current) => ({
      ...current,
      results: {
        ...response,
        ...normalizedResponse,
      },
    }));
    setPage('results');
  };

  const handleNewInterview = () => {
    setPage('landing');
    setInterviewSession(null);
  };

  const handleStartRapidFire = () => {
    if (!requireAuth('Sign up to save your Rapid Fire performance and unlock personalized AI insights.')) return;
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
    if (!requireAuth('Sign up to unlock advanced AI ATS checking and resume optimization.')) return;
    setPage('resume-scorer');
  };

  const handleStartResumeBuilder = () => {
    if (!requireAuth('Sign up to save your resumes and access premium AI-enhanced templates.')) return;
    setPage('resume-builder');
  };

  const handleResumeAnalysisComplete = (data) => {
    setResumeAnalysis(data);
    setPage('resume-report');
  };

  const handleStartHistory = () => {
    setPage('history');
  };

  const handleVoiceComplete = (data) => {
    const normalizedResponse = persistCompletedSession({
      mode: 'voice',
      payload: data,
      jobRole: interviewSession?.jobRole || 'Unknown',
    });

    setInterviewSession((current) => ({
      ...current,
      results: {
        ...data,
        ...normalizedResponse,
      },
    }));
    setPage('results');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader size={40} className="text-blue-400 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading InterVue AI...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      <AuthModal
        isOpen={showAuthModal}
        onClose={closeAuthModal}
        onAuthSuccess={handleAuthSuccess}
        message={authMessage}
      />

      <SharedUserNavbar
        user={session?.user}
        onLogout={handleLogout}
        onHome={() => setPage('landing')}
        onOpenHistory={handleStartHistory}
        onOpenAuth={() => openAuthModal('Welcome to InterVue AI')}
      />

      <div className="pt-24">
        <AnimatePresence mode="wait">
          {page === 'landing' && (
            <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <SharedLandingPage
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

          {page === 'resume-scorer' && (
            <motion.div key="resume-scorer" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <div className="min-h-screen bg-slate-950 relative">
                <button onClick={handleBackToHome} className="absolute left-6 top-28 z-40 flex items-center gap-2 text-slate-400 hover:text-white">Back</button>
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
                questions={interviewSession.questions}
                totalQuestions={interviewSession.totalQuestions}
                jobRole={interviewSession.jobRole}
                interviewTips={interviewSession.interviewTips}
                onAnswer={handleInterviewComplete}
                onBack={() => setPage('landing')}
              />
            </motion.div>
          )}

          {page === 'results' && interviewSession?.results && (
            <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <SharedResultsPage
                data={interviewSession.results}
                onNewInterview={handleNewInterview}
                onGoDashboard={handleStartHistory}
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
                onComplete={handleVoiceComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
