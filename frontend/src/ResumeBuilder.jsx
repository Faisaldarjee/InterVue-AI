import React, { useState, useRef } from 'react';
import {
    ArrowLeft, ArrowRight, Plus, X, Sparkles, Download, Loader,
    User, Briefcase, GraduationCap, Code2, FolderOpen, Check,
    Mail, Phone, Linkedin, FileText, Calendar, MapPin, ExternalLink, Palette
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import apiClient from './utils/apiClient';

// ==================== TEMPLATES ====================
const TEMPLATES = {
    modern: {
        name: 'Modern',
        desc: 'Gradient header, clean & bold',
        color: '#3b82f6',
        headerBg: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        headerText: '#ffffff',
        accentColor: '#3b82f6',
        bodyBg: '#ffffff',
        textColor: '#1e293b',
        subtextColor: '#64748b',
        sectionBorder: '3px solid #3b82f6',
    },
    classic: {
        name: 'Classic',
        desc: 'Traditional & professional',
        color: '#059669',
        headerBg: '#ffffff',
        headerText: '#111827',
        accentColor: '#059669',
        bodyBg: '#ffffff',
        textColor: '#111827',
        subtextColor: '#6b7280',
        sectionBorder: '2px solid #d1d5db',
    },
    minimal: {
        name: 'Minimal',
        desc: 'Ultra-clean, whitespace',
        color: '#8b5cf6',
        headerBg: '#fafafa',
        headerText: '#18181b',
        accentColor: '#8b5cf6',
        bodyBg: '#ffffff',
        textColor: '#27272a',
        subtextColor: '#71717a',
        sectionBorder: '1px solid #e4e4e7',
    },
};

const STEPS = [
    { id: 1, label: 'Personal', icon: User },
    { id: 2, label: 'Experience', icon: Briefcase },
    { id: 3, label: 'Education', icon: GraduationCap },
    { id: 4, label: 'Skills', icon: Code2 },
    { id: 5, label: 'Projects', icon: FolderOpen },
];

const EMPTY_EXPERIENCE = { company: '', role: '', startDate: '', endDate: '', current: false, bullets: [''] };
const EMPTY_EDUCATION = { degree: '', university: '', year: '', gpa: '' };
const EMPTY_PROJECT = { title: '', description: '', techStack: '', link: '' };

// ==================== MAIN COMPONENT ====================
export default function ResumeBuilder({ onBack }) {
    const [step, setStep] = useState(1);
    const [template, setTemplate] = useState('modern');
    const [showPreview, setShowPreview] = useState(false);
    const previewRef = useRef(null);

    // Form Data
    const [personal, setPersonal] = useState({
        name: '', email: '', phone: '', linkedin: '', location: '', summary: ''
    });
    const [experiences, setExperiences] = useState([{ ...EMPTY_EXPERIENCE }]);
    const [educations, setEducations] = useState([{ ...EMPTY_EDUCATION }]);
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [projects, setProjects] = useState([{ ...EMPTY_PROJECT }]);
    const [jobRole, setJobRole] = useState('');

    // AI State
    const [enhancingIdx, setEnhancingIdx] = useState(null); // { expIdx, bulletIdx }
    const [downloading, setDownloading] = useState(false);

    const t = TEMPLATES[template];

    // ========== HANDLERS ==========
    const updatePersonal = (field, value) => setPersonal(p => ({ ...p, [field]: value }));

    const updateExperience = (idx, field, value) => {
        const copy = [...experiences];
        copy[idx] = { ...copy[idx], [field]: value };
        setExperiences(copy);
    };
    const addExperience = () => setExperiences(prev => [...prev, { ...EMPTY_EXPERIENCE }]);
    const removeExperience = (idx) => setExperiences(prev => prev.filter((_, i) => i !== idx));

    const updateBullet = (expIdx, bulletIdx, value) => {
        const copy = [...experiences];
        copy[expIdx].bullets[bulletIdx] = value;
        setExperiences(copy);
    };
    const addBullet = (expIdx) => {
        const copy = [...experiences];
        copy[expIdx].bullets.push('');
        setExperiences(copy);
    };
    const removeBullet = (expIdx, bulletIdx) => {
        const copy = [...experiences];
        copy[expIdx].bullets = copy[expIdx].bullets.filter((_, i) => i !== bulletIdx);
        setExperiences(copy);
    };

    const enhanceBullet = async (expIdx, bulletIdx) => {
        const bullet = experiences[expIdx].bullets[bulletIdx];
        if (!bullet || bullet.trim().length < 5) return;
        setEnhancingIdx({ expIdx, bulletIdx });
        try {
            const { data } = await apiClient.post('/api/enhance-bullet', {
                bullet: bullet.trim(),
                job_role: jobRole || experiences[expIdx].role || ''
            });
            if (data.enhanced) {
                updateBullet(expIdx, bulletIdx, data.enhanced);
            }
        } catch (err) {
            console.error('Enhance failed', err);
        } finally {
            setEnhancingIdx(null);
        }
    };

    const updateEducation = (idx, field, value) => {
        const copy = [...educations];
        copy[idx] = { ...copy[idx], [field]: value };
        setEducations(copy);
    };
    const addEducation = () => setEducations(prev => [...prev, { ...EMPTY_EDUCATION }]);
    const removeEducation = (idx) => setEducations(prev => prev.filter((_, i) => i !== idx));

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !skills.includes(s)) {
            setSkills(prev => [...prev, s]);
            setSkillInput('');
        }
    };
    const removeSkill = (idx) => setSkills(prev => prev.filter((_, i) => i !== idx));

    const updateProject = (idx, field, value) => {
        const copy = [...projects];
        copy[idx] = { ...copy[idx], [field]: value };
        setProjects(copy);
    };
    const addProject = () => setProjects(prev => [...prev, { ...EMPTY_PROJECT }]);
    const removeProject = (idx) => setProjects(prev => prev.filter((_, i) => i !== idx));

    const downloadPDF = async () => {
        if (!previewRef.current) return;
        setDownloading(true);
        try {
            const opt = {
                margin: 0,
                filename: `${personal.name || 'Resume'}_Resume.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            await html2pdf().set(opt).from(previewRef.current).save();
        } catch (err) {
            console.error('PDF download failed', err);
        } finally {
            setDownloading(false);
        }
    };

    // ========== STEP CONTENT ==========
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-5 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <User size={20} className="text-blue-400" />
                            </div>
                            Personal Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField icon={<User size={16} />} label="Full Name" value={personal.name} onChange={v => updatePersonal('name', v)} placeholder="Faisal Darjee" />
                            <InputField icon={<Mail size={16} />} label="Email" value={personal.email} onChange={v => updatePersonal('email', v)} placeholder="faisal@example.com" type="email" />
                            <InputField icon={<Phone size={16} />} label="Phone" value={personal.phone} onChange={v => updatePersonal('phone', v)} placeholder="+91 9876543210" />
                            <InputField icon={<Linkedin size={16} />} label="LinkedIn URL" value={personal.linkedin} onChange={v => updatePersonal('linkedin', v)} placeholder="linkedin.com/in/faisal" />
                            <InputField icon={<MapPin size={16} />} label="Location" value={personal.location} onChange={v => updatePersonal('location', v)} placeholder="Mumbai, India" />
                            <InputField icon={<Briefcase size={16} />} label="Target Job Role" value={jobRole} onChange={v => setJobRole(v)} placeholder="Full Stack Developer" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Professional Summary</label>
                            <textarea
                                value={personal.summary}
                                onChange={e => updatePersonal('summary', e.target.value)}
                                placeholder="Brief 2-3 line summary of your experience and goals..."
                                rows={3}
                                className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none text-sm"
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-5 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <Briefcase size={20} className="text-purple-400" />
                            </div>
                            Work Experience
                        </h2>
                        {experiences.map((exp, expIdx) => (
                            <div key={expIdx} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4 relative group">
                                {experiences.length > 1 && (
                                    <button onClick={() => removeExperience(expIdx)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100">
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Company" value={exp.company} onChange={v => updateExperience(expIdx, 'company', v)} placeholder="Google" />
                                    <InputField label="Job Title" value={exp.role} onChange={v => updateExperience(expIdx, 'role', v)} placeholder="Software Engineer" />
                                    <InputField label="Start Date" value={exp.startDate} onChange={v => updateExperience(expIdx, 'startDate', v)} placeholder="Jan 2023" />
                                    <InputField label="End Date" value={exp.endDate} onChange={v => updateExperience(expIdx, 'endDate', v)} placeholder="Present" disabled={exp.current} />
                                </div>
                                {/* Bullets */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Responsibilities & Achievements</label>
                                    {exp.bullets.map((bullet, bIdx) => (
                                        <div key={bIdx} className="flex items-start gap-2">
                                            <span className="text-slate-500 mt-3 text-xs">•</span>
                                            <textarea
                                                value={bullet}
                                                onChange={e => updateBullet(expIdx, bIdx, e.target.value)}
                                                placeholder="Describe what you did..."
                                                rows={2}
                                                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm transition resize-none"
                                            />
                                            <button
                                                onClick={() => enhanceBullet(expIdx, bIdx)}
                                                disabled={enhancingIdx?.expIdx === expIdx && enhancingIdx?.bulletIdx === bIdx}
                                                className="mt-1 p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50 flex-shrink-0"
                                                title="AI Enhance"
                                            >
                                                {enhancingIdx?.expIdx === expIdx && enhancingIdx?.bulletIdx === bIdx
                                                    ? <Loader size={14} className="animate-spin" />
                                                    : <Sparkles size={14} />}
                                            </button>
                                            {exp.bullets.length > 1 && (
                                                <button onClick={() => removeBullet(expIdx, bIdx)} className="mt-1 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex-shrink-0">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button onClick={() => addBullet(expIdx)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1 transition">
                                        <Plus size={12} /> Add Bullet
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button onClick={addExperience} className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-blue-500/50 rounded-xl text-slate-400 hover:text-blue-400 transition flex items-center justify-center gap-2 text-sm font-medium">
                            <Plus size={16} /> Add Another Experience
                        </button>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-5 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <GraduationCap size={20} className="text-green-400" />
                            </div>
                            Education
                        </h2>
                        {educations.map((edu, idx) => (
                            <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4 relative group">
                                {educations.length > 1 && (
                                    <button onClick={() => removeEducation(idx)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100">
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Degree" value={edu.degree} onChange={v => updateEducation(idx, 'degree', v)} placeholder="B.Tech Computer Science" />
                                    <InputField label="University / School" value={edu.university} onChange={v => updateEducation(idx, 'university', v)} placeholder="IIT Bombay" />
                                    <InputField label="Year" value={edu.year} onChange={v => updateEducation(idx, 'year', v)} placeholder="2024" />
                                    <InputField label="GPA (optional)" value={edu.gpa} onChange={v => updateEducation(idx, 'gpa', v)} placeholder="9.1 / 10" />
                                </div>
                            </div>
                        ))}
                        <button onClick={addEducation} className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-green-500/50 rounded-xl text-slate-400 hover:text-green-400 transition flex items-center justify-center gap-2 text-sm font-medium">
                            <Plus size={16} /> Add Another Education
                        </button>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-5 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <Code2 size={20} className="text-cyan-400" />
                            </div>
                            Skills
                        </h2>
                        <div className="flex gap-2">
                            <input
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Type a skill and press Enter..."
                                className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition text-sm"
                            />
                            <button onClick={addSkill} className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition text-sm">
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 min-h-[60px]">
                            {skills.length === 0 && <p className="text-slate-500 text-sm italic">No skills added yet. Start typing above!</p>}
                            {skills.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/30 rounded-full text-cyan-300 text-sm font-medium group hover:border-cyan-400/50 transition"
                                >
                                    {skill}
                                    <button onClick={() => removeSkill(idx)} className="p-0.5 rounded-full hover:bg-red-500/20 hover:text-red-400 transition opacity-0 group-hover:opacity-100">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-5 animate-fadeIn">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <FolderOpen size={20} className="text-amber-400" />
                            </div>
                            Projects
                        </h2>
                        {projects.map((proj, idx) => (
                            <div key={idx} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 space-y-4 relative group">
                                {projects.length > 1 && (
                                    <button onClick={() => removeProject(idx)} className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100">
                                        <X size={14} />
                                    </button>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Project Title" value={proj.title} onChange={v => updateProject(idx, 'title', v)} placeholder="InterVue AI" />
                                    <InputField label="Tech Stack" value={proj.techStack} onChange={v => updateProject(idx, 'techStack', v)} placeholder="React, Python, Gemini AI" />
                                    <InputField label="Live Link (optional)" value={proj.link} onChange={v => updateProject(idx, 'link', v)} placeholder="https://github.com/..." className="md:col-span-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                                    <textarea
                                        value={proj.description}
                                        onChange={e => updateProject(idx, 'description', e.target.value)}
                                        placeholder="What does this project do? Key features..."
                                        rows={2}
                                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm transition resize-none"
                                    />
                                </div>
                            </div>
                        ))}
                        <button onClick={addProject} className="w-full py-3 border-2 border-dashed border-slate-600 hover:border-amber-500/50 rounded-xl text-slate-400 hover:text-amber-400 transition flex items-center justify-center gap-2 text-sm font-medium">
                            <Plus size={16} /> Add Another Project
                        </button>
                    </div>
                );

            default: return null;
        }
    };

    // ========== LIVE PREVIEW ==========
    const renderPreview = () => {
        const hasSummary = personal.summary?.trim();
        const hasExperiences = experiences.some(e => e.company || e.role);
        const hasEducations = educations.some(e => e.degree || e.university);
        const hasSkills = skills.length > 0;
        const hasProjects = projects.some(p => p.title);

        return (
            <div
                ref={previewRef}
                style={{
                    background: t.bodyBg,
                    color: t.textColor,
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    fontSize: '11px',
                    lineHeight: '1.5',
                    width: '100%',
                    maxWidth: '210mm',
                    minHeight: '297mm',
                }}
            >
                {/* Header */}
                <div style={{
                    background: t.headerBg,
                    color: t.headerText,
                    padding: template === 'modern' ? '28px 32px' : '20px 32px',
                    ...(template === 'classic' ? { borderBottom: `3px solid ${t.accentColor}` } : {}),
                }}>
                    <h1 style={{
                        fontSize: template === 'modern' ? '26px' : '24px',
                        fontWeight: 800,
                        margin: 0,
                        letterSpacing: '-0.5px',
                        color: t.headerText,
                    }}>
                        {personal.name || 'Your Name'}
                    </h1>
                    {jobRole && (
                        <p style={{
                            fontSize: '13px',
                            color: template === 'modern' ? 'rgba(255,255,255,0.8)' : t.accentColor,
                            marginTop: '2px',
                            fontWeight: 500,
                        }}>
                            {jobRole}
                        </p>
                    )}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '14px',
                        marginTop: '10px',
                        fontSize: '10.5px',
                        color: template === 'modern' ? 'rgba(255,255,255,0.7)' : t.subtextColor,
                    }}>
                        {personal.email && <span>✉ {personal.email}</span>}
                        {personal.phone && <span>☎ {personal.phone}</span>}
                        {personal.location && <span>📍 {personal.location}</span>}
                        {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 32px' }}>
                    {/* Summary */}
                    {hasSummary && (
                        <div style={{ marginBottom: '18px' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: 700, color: t.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: t.sectionBorder, paddingBottom: '4px', marginBottom: '8px' }}>
                                Professional Summary
                            </h2>
                            <p style={{ fontSize: '11px', color: t.subtextColor, lineHeight: '1.6' }}>{personal.summary}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {hasExperiences && (
                        <div style={{ marginBottom: '18px' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: 700, color: t.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: t.sectionBorder, paddingBottom: '4px', marginBottom: '8px' }}>
                                Experience
                            </h2>
                            {experiences.filter(e => e.company || e.role).map((exp, i) => (
                                <div key={i} style={{ marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <strong style={{ fontSize: '12px', color: t.textColor }}>{exp.role || 'Role'}</strong>
                                        <span style={{ fontSize: '10px', color: t.subtextColor }}>{exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}{exp.current ? 'Present' : exp.endDate}</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: t.accentColor, fontWeight: 500 }}>{exp.company}</p>
                                    <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                                        {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                            <li key={j} style={{ fontSize: '10.5px', color: t.subtextColor, marginBottom: '2px' }}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Education */}
                    {hasEducations && (
                        <div style={{ marginBottom: '18px' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: 700, color: t.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: t.sectionBorder, paddingBottom: '4px', marginBottom: '8px' }}>
                                Education
                            </h2>
                            {educations.filter(e => e.degree || e.university).map((edu, i) => (
                                <div key={i} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <div>
                                        <strong style={{ fontSize: '12px', color: t.textColor }}>{edu.degree}</strong>
                                        <p style={{ fontSize: '11px', color: t.accentColor, fontWeight: 500 }}>{edu.university}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {edu.year && <span style={{ fontSize: '10px', color: t.subtextColor }}>{edu.year}</span>}
                                        {edu.gpa && <p style={{ fontSize: '10px', color: t.subtextColor }}>GPA: {edu.gpa}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Skills */}
                    {hasSkills && (
                        <div style={{ marginBottom: '18px' }}>
                            <h2 style={{ fontSize: '13px', fontWeight: 700, color: t.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: t.sectionBorder, paddingBottom: '4px', marginBottom: '8px' }}>
                                Skills
                            </h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {skills.map((s, i) => (
                                    <span key={i} style={{
                                        fontSize: '10px',
                                        padding: '3px 10px',
                                        borderRadius: '12px',
                                        background: template === 'modern' ? `${t.accentColor}15` : '#f3f4f6',
                                        color: t.accentColor,
                                        border: `1px solid ${t.accentColor}30`,
                                        fontWeight: 500,
                                    }}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects */}
                    {hasProjects && (
                        <div>
                            <h2 style={{ fontSize: '13px', fontWeight: 700, color: t.accentColor, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: t.sectionBorder, paddingBottom: '4px', marginBottom: '8px' }}>
                                Projects
                            </h2>
                            {projects.filter(p => p.title).map((proj, i) => (
                                <div key={i} style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                        <strong style={{ fontSize: '12px', color: t.textColor }}>{proj.title}</strong>
                                        {proj.link && <a href={proj.link} style={{ fontSize: '10px', color: t.accentColor }}>🔗 Link</a>}
                                    </div>
                                    {proj.techStack && <p style={{ fontSize: '10px', color: t.accentColor, fontWeight: 500 }}>{proj.techStack}</p>}
                                    {proj.description && <p style={{ fontSize: '10.5px', color: t.subtextColor, marginTop: '2px' }}>{proj.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-900">
            {/* Top Bar */}
            <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition flex items-center gap-2 text-sm font-medium">
                        <ArrowLeft size={18} /> Back Home
                    </button>
                    <h1 className="text-white font-bold flex items-center gap-2">
                        <FileText size={18} className="text-blue-400" />
                        Resume Builder
                    </h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition lg:hidden ${showPreview ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                            {showPreview ? 'Edit' : 'Preview'}
                        </button>
                        <button
                            onClick={downloadPDF}
                            disabled={downloading || !personal.name}
                            className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-lg text-sm font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
                            {downloading ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Step Indicators */}
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                    {STEPS.map((s, idx) => {
                        const StepIcon = s.icon;
                        const isActive = step === s.id;
                        const isDone = step > s.id;
                        return (
                            <React.Fragment key={s.id}>
                                {idx > 0 && <div className={`h-0.5 w-6 sm:w-10 rounded-full transition-colors ${isDone ? 'bg-blue-500' : 'bg-slate-700'}`} />}
                                <button
                                    onClick={() => setStep(s.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10'
                                            : isDone ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                                : 'bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                                        }`}
                                >
                                    {isDone ? <Check size={14} /> : <StepIcon size={14} />}
                                    <span className="hidden sm:inline">{s.label}</span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Side */}
                    <div className={`${showPreview ? 'hidden lg:block' : ''}`}>
                        <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6">
                            {renderStep()}

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-800/50">
                                <button
                                    onClick={() => setStep(Math.max(1, step - 1))}
                                    disabled={step === 1}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <ArrowLeft size={16} /> Previous
                                </button>
                                <span className="text-slate-500 text-xs font-medium">Step {step} of 5</span>
                                <button
                                    onClick={() => setStep(Math.min(5, step + 1))}
                                    disabled={step === 5}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Next <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Template Selector */}
                        <div className="mt-4 bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-5">
                            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                <Palette size={16} className="text-purple-400" /> Choose Template
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                                    <button
                                        key={key}
                                        onClick={() => setTemplate(key)}
                                        className={`p-3 rounded-xl border-2 transition-all text-left ${template === key
                                                ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                                : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="w-full h-2 rounded-full mb-2" style={{ background: tmpl.color }} />
                                        <p className="text-white text-xs font-bold">{tmpl.name}</p>
                                        <p className="text-slate-500 text-[10px]">{tmpl.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview Side */}
                    <div className={`${showPreview ? '' : 'hidden lg:block'}`}>
                        <div className="sticky top-20">
                            <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-4 overflow-hidden">
                                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-green-400" /> Live Preview
                                </h3>
                                <div className="bg-white rounded-xl overflow-hidden shadow-2xl" style={{ transform: 'scale(0.72)', transformOrigin: 'top left', width: '138.9%', maxHeight: '80vh' }}>
                                    {renderPreview()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
        </div>
    );
}

// ==================== INPUT FIELD COMPONENT ====================
function InputField({ label, value, onChange, placeholder, icon, type = 'text', disabled = false, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full bg-slate-800/50 border border-slate-600/50 rounded-xl ${icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm disabled:opacity-50`}
                />
            </div>
        </div>
    );
}
