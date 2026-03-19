import React from 'react';

export default function TemplateSwiss({ data }) {
    const { personal, experiences, educations, skills, projects, jobRole } = data;
    const accent = '#e63946';
    const font = "'Space Grotesk', sans-serif";
    return (
        <div style={{ backgroundColor: '#fafafa', color: '#111', fontFamily: font, padding: '60px 64px', minHeight: '297mm' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, borderBottom: '3px solid #111', paddingBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 52, fontWeight: 700, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>{personal.name || 'Your Name'}</h1>
                    {jobRole && <div style={{ fontSize: 14, fontWeight: 600, color: accent, marginTop: 8, letterSpacing: '1px' }}>{jobRole}</div>}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#555' }}>
                    {personal.email && <span>{personal.email}</span>}
                    {personal.phone && <span>{personal.phone}</span>}
                    {personal.location && <span>{personal.location}</span>}
                    {personal.linkedin && <span>{personal.linkedin}</span>}
                </div>
            </div>

            {personal.summary && (
                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, marginBottom: 40, pageBreakInside: 'avoid' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', paddingTop: 4 }}>Profile</div>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.8, color: '#333' }}>{personal.summary}</p>
                </div>
            )}

            {experiences.filter(e => e.company || e.role).length > 0 && (
                <div style={{ marginBottom: 40 }}>
                    {experiences.filter(e => e.company || e.role).map((exp, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, marginBottom: 32, pageBreakInside: 'avoid' }}>
                            <div style={{ paddingTop: 4 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: 6 }}>
                                    {i === 0 ? 'Experience' : ''}
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>
                                    {exp.startDate}<br />{exp.startDate && (exp.endDate || exp.current) ? '↓' : ''}<br />{exp.current ? 'Present' : exp.endDate}
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                                    <span style={{ fontSize: 17, fontWeight: 700 }}>{exp.role}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{exp.company}</span>
                                </div>
                                <ul style={{ paddingLeft: 18, margin: '8px 0 0', color: '#444' }}>
                                    {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                        <li key={j} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.7 }}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
                <div>
                    {educations.filter(e => e.degree || e.university).length > 0 && (
                        <div style={{ marginBottom: 36, pageBreakInside: 'avoid' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: 16, borderTop: '1px solid #ddd', paddingTop: 16 }}>Education</div>
                            {educations.filter(e => e.degree || e.university).map((edu, i) => (
                                <div key={i} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{edu.degree}</div>
                                    <div style={{ fontSize: 12.5, color: '#444', marginBottom: 2 }}>{edu.university}</div>
                                    <div style={{ fontSize: 11.5, color: accent, fontWeight: 600 }}>{edu.year}{edu.gpa ? ` · ${edu.gpa}` : ''}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {skills.length > 0 && (
                        <div style={{ pageBreakInside: 'avoid' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: 14, borderTop: '1px solid #ddd', paddingTop: 16 }}>Skills</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {skills.map((s, i) => (
                                    <span key={i} style={{ fontSize: 12, padding: '5px 12px', border: '1.5px solid #111', borderRadius: 3, fontWeight: 600, color: '#111' }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div>
                    {projects.filter(p => p.title).length > 0 && (
                        <div>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: 16, borderTop: '1px solid #ddd', paddingTop: 16 }}>Projects</div>
                            {projects.filter(p => p.title).map((p, i) => (
                                <div key={i} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 14, fontWeight: 700 }}>{p.title}</span>
                                        {p.link && <span style={{ fontSize: 11, color: accent, fontWeight: 700 }}>↗</span>}
                                    </div>
                                    {p.techStack && <div style={{ fontSize: 11, color: '#888', fontWeight: 600, marginBottom: 4 }}>{p.techStack}</div>}
                                    <p style={{ margin: 0, fontSize: 12.5, color: '#444', lineHeight: 1.7 }}>{p.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
