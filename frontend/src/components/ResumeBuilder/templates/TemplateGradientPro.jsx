import React from 'react';

export default function TemplateGradientPro({ data }) {
    const { personal, experiences, educations, skills, projects, jobRole } = data;
    const font = "'Syne', sans-serif";
    return (
        <div style={{ backgroundColor: '#ffffff', fontFamily: font, minHeight: '297mm' }}>
            {/* Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)', padding: '52px 56px 48px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
                <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
                <h1 style={{ fontSize: 44, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-1.5px', position: 'relative' }}>{personal.name || 'Your Name'}</h1>
                {jobRole && <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 24px', opacity: .8, letterSpacing: '1px', textTransform: 'uppercase', position: 'relative' }}>{jobRole}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 12.5, fontWeight: 500, opacity: .85, position: 'relative' }}>
                    {personal.email && <span>✉ {personal.email}</span>}
                    {personal.phone && <span>📞 {personal.phone}</span>}
                    {personal.location && <span>📍 {personal.location}</span>}
                    {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
                </div>
            </div>

            <div style={{ padding: '48px 56px', display: 'flex', gap: 48 }}>
                {/* Left */}
                <div style={{ width: '34%', flexShrink: 0 }}>
                    {personal.summary && (
                        <div style={{ marginBottom: 36 }}>
                            <SectionTitle label="About Me" color="#7c3aed" />
                            <p style={{ fontSize: 13, lineHeight: 1.8, color: '#555', margin: 0 }}>{personal.summary}</p>
                        </div>
                    )}
                    {skills.length > 0 && (
                        <div style={{ marginBottom: 36 }}>
                            <SectionTitle label="Skills" color="#7c3aed" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {skills.map((s, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7c3aed', flexShrink: 0 }} />
                                        <span style={{ fontSize: 12.5, color: '#333', fontWeight: 500 }}>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {educations.filter(e => e.degree || e.university).length > 0 && (
                        <div>
                            <SectionTitle label="Education" color="#7c3aed" />
                            {educations.filter(e => e.degree || e.university).map((edu, i) => (
                                <div key={i} style={{ marginBottom: 18, padding: '12px 16px', backgroundColor: '#f5f3ff', borderRadius: 8, borderLeft: '3px solid #7c3aed', pageBreakInside: 'avoid' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 2 }}>{edu.degree}</div>
                                    <div style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, marginBottom: 2 }}>{edu.university}</div>
                                    <div style={{ fontSize: 11, color: '#8b5cf6' }}>{edu.year}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right */}
                <div style={{ flex: 1 }}>
                    {experiences.filter(e => e.company || e.role).length > 0 && (
                        <div style={{ marginBottom: 36 }}>
                            <SectionTitle label="Experience" color="#7c3aed" />
                            {experiences.filter(e => e.company || e.role).map((exp, i) => (
                                <div key={i} style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 10, border: '1px solid #ede9fe', position: 'relative', pageBreakInside: 'avoid' }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: '#7c3aed', borderRadius: '8px 0 0 8px' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b' }}>{exp.role}</span>
                                        <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, backgroundColor: '#f5f3ff', padding: '3px 10px', borderRadius: 100 }}>
                                            {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}{exp.current ? 'Now' : exp.endDate}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, marginBottom: 10 }}>{exp.company}</div>
                                    <ul style={{ paddingLeft: 16, margin: 0, color: '#555' }}>
                                        {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                            <li key={j} style={{ fontSize: 12.5, marginBottom: 5, lineHeight: 1.7 }}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {projects.filter(p => p.title).length > 0 && (
                        <div>
                            <SectionTitle label="Projects" color="#7c3aed" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {projects.filter(p => p.title).map((p, i) => (
                                    <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 4 }}>{p.title}</div>
                                        {p.techStack && <div style={{ fontSize: 10.5, color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>{p.techStack}</div>}
                                        <p style={{ margin: 0, fontSize: 12, color: '#555', lineHeight: 1.6 }}>{p.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ label, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color }}>{label}</span>
            <div style={{ flex: 1, height: 1.5, background: `linear-gradient(to right, ${color}40, transparent)` }} />
        </div>
    );
}
