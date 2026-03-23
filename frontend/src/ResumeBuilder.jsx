import React, { useState, useRef, useEffect } from 'react';
import {
    ArrowLeft, ArrowRight, Plus, X, Sparkles, Download, Loader,
    User, Briefcase, GraduationCap, Code2, FolderOpen, Check,
    Mail, Phone, Linkedin, FileText, MapPin, Eye, EyeOff, Layout, Globe, GripVertical
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useResumeState, EMPTY_EXP, EMPTY_EDU, EMPTY_PROJ } from './components/ResumeBuilder/hooks/useResumeState';
import { Field, TextArea, StepHeader, MiniBtn, AddBtn } from './components/ResumeBuilder/components/FormInputs';
import ResumePreview from './components/ResumeBuilder/templates/ResumePreview';

const FontLoader = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;600;700&family=Syne:wght@400;600;700;800&family=Fraunces:wght@300;400;700;900&family=Cabinet+Grotesk:wght@400;500;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    
    @media (max-width: 1024px) {
        .responsive-grid {
            grid-template-columns: 1fr !important;
        }
        .main-container {
            padding: 10px !important;
        }
        .hide-mobile {
            display: none !important;
        }
    }

    @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .slide-up { animation: slideUp .4s cubic-bezier(.16,1,.3,1) both; }
    .glow-btn { position: relative; overflow: hidden; transition: all .2s; }
    .glow-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.15) 0%, transparent 60%); opacity: 0; transition: opacity .2s; }
    .glow-btn:hover::before { opacity: 1; }
    .glow-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,.4); }
    .preview-shadow { box-shadow: 0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.05); }
    .input-field { transition: all .2s; background: rgba(255,255,255,.04); border: 1.5px solid rgba(255,255,255,.08); color: #f1f5f9; }
    .input-field:focus { outline: none; border-color: #6366f1; background: rgba(99,102,241,.08); box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
    .input-field::placeholder { color: rgba(148,163,184,.4); }
    
    /* PDF print overrides */
    @media print {
        body { background: white !important; }
        .no-print { display: none !important; }
    }
  `}</style>
);

const TEMPLATES = {
    noir_executive: { name: 'Noir Executive', desc: 'Dark luxury sidebar', preview: ['#0f0f0f', '#1a1a1a', '#c9a84c'] },
    swiss_modern: { name: 'Swiss Grid', desc: 'Crisp typographic grid', preview: ['#fafafa', '#111', '#e63946'] },
    gradient_pro: { name: 'Gradient Pro', desc: 'Bold color header', preview: ['#7c3aed', '#6366f1', '#f8f9ff'] },
    editorial: { name: 'Editorial', desc: 'Magazine-style serif', preview: ['#fffef9', '#0a2463', '#d4a853'] },
    minimal_ink: { name: 'Minimal Ink', desc: 'Pure black & white', preview: ['#ffffff', '#000000', '#666666'] },
    aurora: { name: 'Aurora', desc: 'Soft gradient elegance', preview: ['#f0f9ff', '#0891b2', '#7c3aed'] }
};

const STEPS = [
    { id: 1, label: 'Profile', icon: User, color: '#6366f1' },
    { id: 2, label: 'Experience', icon: Briefcase, color: '#8b5cf6' },
    { id: 3, label: 'Education', icon: GraduationCap, color: '#06b6d4' },
    { id: 4, label: 'Skills', icon: Code2, color: '#10b981' },
    { id: 5, label: 'Projects', icon: FolderOpen, color: '#f59e0b' }
];

async function aiEnhanceBullet(bullet, role, jobDescription) {
    try {
        const res = await fetch('http://localhost:8000/api/enhance-bullet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bullet, job_role: role || 'Professional', job_description: jobDescription || '' })
        });
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        return data.enhanced || bullet;
    } catch {
        return bullet;
    }
}

function SortableItemWrapper({ id, onRemove, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, zIndex: isDragging ? 2 : 1, position: 'relative' };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 14, padding: '20px', position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                    <div {...listeners} {...attributes} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', padding: '5px', color: 'rgba(255,255,255,0.4)' }}>
                        <GripVertical size={14} />
                    </div>
                    {onRemove && <MiniBtn onClick={onRemove} danger title="Remove"><X size={12} /></MiniBtn>}
                </div>
                {children}
            </div>
        </div>
    );
}

export default function ResumeBuilder({ onBack, onHome, initialData }) {
    const onBackHandler = onHome || onBack;
    const [step, setStep] = useState(1);
    const [template, setTemplate] = useState('noir_executive');
    const [showPreview, setShowPreview] = useState(false);
    const [enhancingIdx, setEnhancingIdx] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const previewRef = useRef(null);

    const { personal, setPersonal, jobRole, setJobRole, jobDescription, setJobDescription, experiences, setExps, educations, setEdus, skills, setSkills, projects, setProjs } = useResumeState();

    useEffect(() => {
        if (initialData) {
            if (initialData.fullName || initialData.email || initialData.phone || initialData.location || initialData.summary) {
                setPersonal(prev => ({
                    ...prev,
                    fullName: initialData.fullName || prev.fullName,
                    email: initialData.email || prev.email,
                    phone: initialData.phone || prev.phone,
                    location: initialData.location || prev.location,
                    summary: initialData.summary || prev.summary
                }));
            }
            if (initialData.experience && Array.isArray(initialData.experience)) {
                setExps(initialData.experience.map((exp, i) => {
                    const bulletsStr = Array.isArray(exp.description) ? exp.description.join('\n') : (exp.description || '');
                    return {
                        id: Date.now() + i,
                        company: exp.company || '',
                        role: exp.role || '',
                        duration: exp.duration || '',
                        bullets: bulletsStr.split('\n').map(b => b.replace(/^•\s*/, '').trim()).filter(Boolean)
                    };
                }));
            }
            if (initialData.education && Array.isArray(initialData.education)) {
                setEdus(initialData.education.map((edu, i) => ({
                    id: Date.now() + i + 100,
                    school: edu.school || '',
                    degree: edu.degree || '',
                    duration: edu.year || ''
                })));
            }
            if (initialData.skills && Array.isArray(initialData.skills)) {
                setSkills(initialData.skills);
            }
            
            // Auto open preview if initial data is loaded
            setShowPreview(true);
        }
    }, [initialData, setPersonal, setExps, setEdus, setSkills]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event, items, setItems) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));
        }
    };

    const upPersonal = (f, v) => setPersonal(p => ({ ...p, [f]: v }));
    const upExp = (id, f, v) => setExps(prev => prev.map(e => e.id === id ? { ...e, [f]: v } : e));
    const upBullet = (id, bi, v) => setExps(prev => prev.map(e => {
        if (e.id === id) { const nb = [...e.bullets]; nb[bi] = v; return { ...e, bullets: nb }; }
        return e;
    }));
    const addBullet = (id) => setExps(prev => prev.map(e => e.id === id ? { ...e, bullets: [...e.bullets, ''] } : e));
    const remBullet = (id, bi) => setExps(prev => prev.map(e => {
        if (e.id === id) { const nb = e.bullets.filter((_, i) => i !== bi); return { ...e, bullets: nb }; }
        return e;
    }));

    const enhanceBullet = async (id, bi) => {
        const exp = experiences.find(e => e.id === id);
        const b = exp.bullets[bi];
        if (!b || b.trim().length < 5) return;
        setEnhancingIdx({ id, bi });
        const enhanced = await aiEnhanceBullet(b, jobRole || exp.role, jobDescription);
        upBullet(id, bi, enhanced);
        setEnhancingIdx(null);
    };

    const upEdu = (id, f, v) => setEdus(prev => prev.map(e => e.id === id ? { ...e, [f]: v } : e));
    const addSkill = () => { const s = skillInput.trim(); if (s && !skills.includes(s)) { setSkills(p => [...p, s]); setSkillInput(''); } };
    const upProj = (id, f, v) => setProjs(prev => prev.map(p => p.id === id ? { ...p, [f]: v } : p));

    const downloadPDF = async () => {
        if (!previewRef.current || !personal.name) return;

        const onAuthSuccess = async () => {
            window.removeEventListener('auth-success', onAuthSuccess);
            setDownloading(true);
            try {
                const { default: html2pdf } = await import('html2pdf.js');
                await html2pdf().set({
                    margin: 0, filename: `${personal.name.replace(/\s+/g, '_')}_Resume.pdf`,
                    image: { type: 'jpeg', quality: .98 },
                    html2canvas: { scale: 2, useCORS: true, windowWidth: 794 }, // A4 width at 96dpi approx
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                }).from(previewRef.current).save();
            } catch (e) { console.error(e); }
            setDownloading(false);
        };

        window.addEventListener('auth-success', onAuthSuccess);
        window.dispatchEvent(new CustomEvent('require-auth', { 
            detail: { message: 'Create a free account to download your premium resume PDF.' } 
        }));
    };

    const renderStep = () => {
        switch (step) {
            case 1: return (
                <div className="slide-up">
                    <StepHeader icon={<User size={18} />} title="Personal Info" subtitle="Let's start with the basics" color="#6366f1" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
                        <Field label="Full Name" value={personal.name} onChange={v => upPersonal('name', v)} placeholder="Aryan Sharma" icon={<User size={14} />} />
                        <Field label="Target Role" value={jobRole} onChange={setJobRole} placeholder="Full Stack Developer" icon={<Briefcase size={14} />} />
                        <Field label="Email" value={personal.email} onChange={v => upPersonal('email', v)} placeholder="aryan@email.com" type="email" icon={<Mail size={14} />} />
                        <Field label="Phone" value={personal.phone} onChange={v => upPersonal('phone', v)} placeholder="+91 98765 43210" icon={<Phone size={14} />} />
                        <Field label="Location" value={personal.location} onChange={v => upPersonal('location', v)} placeholder="Mumbai, India" icon={<MapPin size={14} />} />
                        <Field label="LinkedIn" value={personal.linkedin} onChange={v => upPersonal('linkedin', v)} placeholder="linkedin.com/..." icon={<Linkedin size={14} />} />
                    </div>
                    <TextArea label="Target Job Description (For AI Auto-Tailoring)" value={jobDescription} onChange={setJobDescription} placeholder="Paste the job description you are aiming for. AI will use this to automatically tailor your bullet points..." rows={3} />
                    <div style={{height: 14}}/>
                    <TextArea label="Professional Summary" value={personal.summary} onChange={v => upPersonal('summary', v)} placeholder="2–3 lines about who you are and what makes you stand out..." rows={3} />
                </div>
            );
            case 2: return (
                <div className="slide-up">
                    <StepHeader icon={<Briefcase size={18} />} title="Work Experience" subtitle="Drag to reorder" color="#8b5cf6" />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, experiences, setExps)}>
                        <SortableContext items={experiences.map(e => e.id)} strategy={verticalListSortingStrategy}>
                            {experiences.map(exp => (
                                <SortableItemWrapper key={exp.id} id={exp.id} onRemove={experiences.length > 1 ? () => setExps(p => p.filter(x => x.id !== exp.id)) : null}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
                                        <Field label="Company" value={exp.company} onChange={v => upExp(exp.id, 'company', v)} placeholder="Google" />
                                        <Field label="Job Title" value={exp.role} onChange={v => upExp(exp.id, 'role', v)} placeholder="Software Engineer" />
                                        <Field label="Start Date" value={exp.startDate} onChange={v => upExp(exp.id, 'startDate', v)} placeholder="Jan 2023" />
                                        <Field label="End Date" value={exp.endDate} onChange={v => upExp(exp.id, 'endDate', v)} placeholder="Present" />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,163,184,.6)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Achievements</label>
                                        {exp.bullets.map((bullet, bi) => (
                                            <div key={bi} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                                                <span style={{ color: 'rgba(99,102,241,.6)', marginTop: 10, fontSize: 16 }}>›</span>
                                                <TextArea value={bullet} onChange={v => upBullet(exp.id, bi, v)} placeholder="Action + Impact (e.g. Increased speed by 20%)" rows={2} />
                                                <button onClick={() => enhanceBullet(exp.id, bi)} disabled={enhancingIdx?.id === exp.id && enhancingIdx?.bi === bi} title="AI Enhance"
                                                    style={{ marginTop: 4, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(245,158,11,.3)', background: 'rgba(245,158,11,.08)', color: '#f59e0b', cursor: 'pointer', display: 'flex' }}>
                                                    {enhancingIdx?.id === exp.id && enhancingIdx?.bi === bi ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={13} />}
                                                </button>
                                                {exp.bullets.length > 1 && <button onClick={() => remBullet(exp.id, bi)} style={{ marginTop: 4, padding: '7px', borderRadius: 8, border: '1px solid rgba(239,68,68,.2)', background: 'rgba(239,68,68,.06)', color: 'rgba(239,68,68,.7)', cursor: 'pointer' }}><X size={12} /></button>}
                                            </div>
                                        ))}
                                        <button onClick={() => addBullet(exp.id)} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}><Plus size={12}/> Add bullet</button>
                                    </div>
                                </SortableItemWrapper>
                            ))}
                        </SortableContext>
                    </DndContext>
                    <AddBtn onClick={() => setExps(p => [...p, EMPTY_EXP()])} label="Add Experience" color="#8b5cf6" />
                </div>
            );
            case 3: return (
                <div className="slide-up">
                    <StepHeader icon={<GraduationCap size={18} />} title="Education" subtitle="Drag to reorder" color="#06b6d4" />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, educations, setEdus)}>
                        <SortableContext items={educations.map(e => e.id)} strategy={verticalListSortingStrategy}>
                            {educations.map((edu) => (
                                <SortableItemWrapper key={edu.id} id={edu.id} onRemove={educations.length > 1 ? () => setEdus(p => p.filter(x => x.id !== edu.id)) : null}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                                        <Field label="Degree / Course" value={edu.degree} onChange={v => upEdu(edu.id, 'degree', v)} placeholder="B.Tech CS" />
                                        <Field label="University / School" value={edu.university} onChange={v => upEdu(edu.id, 'university', v)} placeholder="IIT Bombay" />
                                        <Field label="Graduation Year" value={edu.year} onChange={v => upEdu(edu.id, 'year', v)} placeholder="2024" />
                                        <Field label="GPA" value={edu.gpa} onChange={v => upEdu(edu.id, 'gpa', v)} placeholder="9.2 / 10" />
                                    </div>
                                </SortableItemWrapper>
                            ))}
                        </SortableContext>
                    </DndContext>
                    <AddBtn onClick={() => setEdus(p => [...p, EMPTY_EDU()])} label="Add Education" color="#06b6d4" />
                </div>
            );
            case 4: return (
                <div className="slide-up">
                    <StepHeader icon={<Code2 size={18} />} title="Skills" subtitle="Tech & tools" color="#10b981" />
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Type skill + Enter" className="input-field" style={{ flex: 1, padding: '11px 16px', borderRadius: 10, fontSize: 13.5 }} />
                        <button onClick={addSkill} className="glow-btn" style={{ padding: '11px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Add</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
                        {skills.map((s, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 100, background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.25)', color: '#34d399', fontSize: 13, fontWeight: 600 }}>
                                {s} <button onClick={() => setSkills(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(52,211,153,.6)', padding: 0 }}><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                </div>
            );
            case 5: return (
                <div className="slide-up">
                    <StepHeader icon={<FolderOpen size={18} />} title="Projects" subtitle="Drag to reorder" color="#f59e0b" />
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, projects, setProjs)}>
                        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
                            {projects.map((proj) => (
                                <SortableItemWrapper key={proj.id} id={proj.id} onRemove={projects.length > 1 ? () => setProjs(p => p.filter(x => x.id !== proj.id)) : null}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                        <Field label="Project Name" value={proj.title} onChange={v => upProj(proj.id, 'title', v)} placeholder="InterVue AI" />
                                        <Field label="Tech Stack" value={proj.techStack} onChange={v => upProj(proj.id, 'techStack', v)} placeholder="React, Node.js" />
                                    </div>
                                    <Field label="Live Link" value={proj.link} onChange={v => upProj(proj.id, 'link', v)} placeholder="https://..." icon={<Globe size={13} />} />
                                    <div style={{ marginTop: 12 }}>
                                        <TextArea label="Description" value={proj.description} onChange={v => upProj(proj.id, 'description', v)} rows={2} />
                                    </div>
                                </SortableItemWrapper>
                            ))}
                        </SortableContext>
                    </DndContext>
                    <AddBtn onClick={() => setProjs(p => [...p, EMPTY_PROJ()])} label="Add Project" color="#f59e0b" />
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="no-print" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #09090b 0%, #0f0f23 50%, #09090b 100%)', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
            <FontLoader />
            <div style={{ position: 'fixed', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div style={{ position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(24px)', background: 'rgba(9,9,11,.85)', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <button onClick={onBackHandler} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: 'white', cursor: 'pointer', padding: 8, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} color="#fff" /></div>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>ResumeFlow</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setShowPreview(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#cbd5e1', cursor: 'pointer', fontSize: 12.5 }}>
                            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span className="hide-mobile">{showPreview ? 'Edit' : 'Preview'}</span>
                        </button>
                        <button onClick={downloadPDF} disabled={downloading || !personal.name} className="glow-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 8, background: downloading ? 'rgba(16,185,129,.3)' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, opacity: !personal.name ? .4 : 1 }}>
                            {downloading ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={13} />}
                            <span className="hide-mobile">{downloading ? 'Generating…' : 'Download PDF'}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, overflowX: 'auto', paddingBottom: 10 }}>
                    {STEPS.map((s, idx) => {
                        const isActive = step === s.id;
                        const isDone = step > s.id;
                        return (
                            <React.Fragment key={s.id}>
                                {idx > 0 && <div style={{ width: 20, height: 2, background: isDone ? s.color : 'rgba(255,255,255,.08)' }} />}
                                <button onClick={() => setStep(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 100, border: isActive ? `1.5px solid ${s.color}60` : '1.5px solid rgba(255,255,255,.07)', background: isActive ? `${s.color}18` : isDone ? `${s.color}10` : 'rgba(255,255,255,.03)', color: isActive ? '#fff' : isDone ? s.color : 'rgba(148,163,184,.5)', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, transition: 'all .25s' }}>
                                    {isDone ? <Check size={13} color={s.color} /> : <s.icon size={13} color={isActive ? s.color : 'currentColor'} />}
                                    <span style={{ fontSize: 12 }}>{s.label}</span>
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="main-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px 48px' }}>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr' : '1fr 1fr', gap: 20, alignItems: 'start' }}>
                    {!showPreview && (
                        <div>
                            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '28px', backdropFilter: 'blur(20px)' }}>
                                {renderStep()}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                                    <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', color: step === 1 ? 'rgba(255,255,255,.2)' : '#cbd5e1', cursor: step === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Back</button>
                                    <span style={{ fontSize: 11.5, color: 'rgba(148,163,184,.4)' }}>Step {step} / 5</span>
                                    <button onClick={() => setStep(Math.min(5, step + 1))} disabled={step === 5} className="glow-btn" style={{ padding: '10px 24px', borderRadius: 10, background: step === 5 ? 'rgba(99,102,241,.2)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', cursor: step === 5 ? 'not-allowed' : 'pointer', fontWeight: 700 }}>Next</button>
                                </div>
                            </div>
                            <div style={{ marginTop: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '22px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Layout size={15} color="#8b5cf6" /><span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>Choose Template</span></div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                                    {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                                        <button key={key} onClick={() => setTemplate(key)} style={{ padding: 0, border: template === key ? `2px solid #6366f1` : '2px solid rgba(255,255,255,.07)', borderRadius: 12, cursor: 'pointer', background: 'none', textAlign: 'left', overflow: 'hidden' }}>
                                            <div style={{ height: 56, background: `linear-gradient(135deg, ${tmpl.preview[0]} 0%, ${tmpl.preview[1]} 100%)`, position: 'relative' }}>
                                                {template === key && <div style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={10} color="#fff" /></div>}
                                            </div>
                                            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,.04)' }}><div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0' }}>{tmpl.name}</div><div style={{ fontSize: 10.5, color: 'rgba(148,163,184,.5)' }}>{tmpl.desc}</div></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{ position: showPreview ? 'relative' : 'sticky', top: 76 }}>
                        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 18, padding: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}><Eye size={14} color="#10b981" style={{ verticalAlign: 'middle', marginRight: 6 }}/>Live Preview</span><span style={{ fontSize: 11, color: 'rgba(148,163,184,.4)' }}>{TEMPLATES[template]?.name}</span></div>
                            <div style={{ borderRadius: 10, overflow: 'auto', maxHeight: showPreview ? 'none' : 'calc(100vh - 180px)', background: '#e5e7eb' }} className="preview-shadow">
                                <div style={{ transform: showPreview ? 'none' : 'scale(0.68)', transformOrigin: 'top left', width: showPreview ? '100%' : '147%', pointerEvents: 'none' }}>
                                    <ResumePreview templateKey={template} data={{ personal, jobRole, experiences, educations, skills, projects }} previewRef={previewRef} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}