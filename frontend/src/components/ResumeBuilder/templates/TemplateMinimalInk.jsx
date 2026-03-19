import React from 'react';

export default function TemplateMinimalInk({ data }) {
    const { personal, experiences, educations, skills, projects, jobRole } = data;
    return (
        <div style={{ backgroundColor: '#fff', fontFamily: "'Cabinet Grotesk', 'DM Sans', sans-serif", padding: '56px 64px', color: '#000', minHeight: '297mm' }}>
            <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', margin: '0 0 4px', lineHeight: 1 }}>{personal.name || 'YOUR NAME'}</h1>
            {jobRole && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '1px', color: '#555', marginBottom: 24 }}>{jobRole.toUpperCase()}</div>}

            <div style={{ display: 'flex', gap: 24, fontSize: 11.5, color: '#777', marginBottom: 40, fontWeight: 500, flexWrap: 'wrap' }}>
                {personal.email && <span>{personal.email}</span>}
                {personal.phone && <span>{personal.phone}</span>}
                {personal.location && <span>{personal.location}</span>}
                {personal.linkedin && <span>{personal.linkedin}</span>}
            </div>

            {personal.summary && (
                <div style={{ marginBottom: 44, borderTop: '2px solid #000', paddingTop: 20, pageBreakInside: 'avoid' }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: '#222', maxWidth: 600, fontWeight: 300 }}>{personal.summary}</p>
                </div>
            )}

            {experiences.filter(e => e.company || e.role).length > 0 && (
                <div style={{ marginBottom: 44, borderTop: '2px solid #000', paddingTop: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', marginBottom: 24, color: '#000' }}>EXPERIENCE</div>
                    {experiences.filter(e => e.company || e.role).map((exp, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 32, marginBottom: 28, pageBreakInside: 'avoid' }}>
                            <div>
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#000', marginBottom: 2 }}>{exp.startDate}</div>
                                {exp.startDate && (exp.endDate || exp.current) && <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>—</div>}
                                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#000' }}>{exp.current ? 'Present' : exp.endDate}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{exp.role}</div>
                                <div style={{ fontSize: 13, color: '#555', fontWeight: 600, marginBottom: 10 }}>{exp.company}</div>
                                <ul style={{ paddingLeft: 16, margin: 0, color: '#333' }}>
                                    {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                        <li key={j} style={{ fontSize: 12.5, marginBottom: 5, lineHeight: 1.7 }}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
                {educations.filter(e => e.degree || e.university).length > 0 && (
                    <div style={{ borderTop: '2px solid #000', paddingTop: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', marginBottom: 20 }}>EDUCATION</div>
                        {educations.filter(e => e.degree || e.university).map((edu, i) => (
                            <div key={i} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
                                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{edu.degree}</div>
                                <div style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>{edu.university}</div>
                                <div style={{ fontSize: 11, color: '#999' }}>{edu.year}{edu.gpa ? ` · ${edu.gpa}` : ''}</div>
                            </div>
                        ))}
                    </div>
                )}
                {skills.length > 0 && (
                    <div style={{ borderTop: '2px solid #000', paddingTop: 20, pageBreakInside: 'avoid' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', marginBottom: 20 }}>SKILLS</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {skills.map((s, i) => (
                                <span key={i} style={{ fontSize: 11.5, padding: '4px 10px', border: '1.5px solid #000', fontWeight: 600 }}>{s}</span>
                            ))}
                        </div>
                    </div>
                )}
                {projects.filter(p => p.title).length > 0 && (
                    <div style={{ borderTop: '2px solid #000', paddingTop: 20 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', marginBottom: 20 }}>PROJECTS</div>
                        {projects.filter(p => p.title).map((p, i) => (
                            <div key={i} style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 2 }}>{p.title}</div>
                                {p.techStack && <div style={{ fontSize: 11, color: '#666', fontWeight: 600, marginBottom: 4 }}>{p.techStack}</div>}
                                <p style={{ margin: 0, fontSize: 12, color: '#444', lineHeight: 1.6 }}>{p.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
