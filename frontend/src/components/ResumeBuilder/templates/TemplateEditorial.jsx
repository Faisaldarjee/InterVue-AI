import React from 'react';

export default function TemplateEditorial({ data }) {
    const { personal, experiences, educations, skills, projects, jobRole } = data;
    const accent = '#0a2463';
    const gold = '#c9a84c';
    return (
        <div style={{ backgroundColor: '#fffef9', fontFamily: "'Fraunces', serif", minHeight: '297mm', padding: '64px 72px', color: '#1a1a1a' }}>
            {/* Masthead */}
            <div style={{ textAlign: 'center', borderBottom: '1px solid #e5e0d0', paddingBottom: 32, marginBottom: 40 }}>
                <div style={{ fontSize: 10, letterSpacing: '4px', fontWeight: 400, color: '#999', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>Curriculum Vitae</div>
                <h1 style={{ fontSize: 56, fontWeight: 300, margin: '0 0 10px', letterSpacing: '-1px', color: accent, lineHeight: 1 }}>{personal.name || 'Your Name'}</h1>
                {jobRole && <div style={{ fontSize: 14, color: gold, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: '2px', textTransform: 'uppercase', marginTop: 10 }}>{jobRole}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 20, fontSize: 12, color: '#777', fontFamily: "'DM Sans', sans-serif" }}>
                    {personal.email && <span>{personal.email}</span>}
                    {personal.phone && <span>·</span>}
                    {personal.phone && <span>{personal.phone}</span>}
                    {personal.location && <span>·</span>}
                    {personal.location && <span>{personal.location}</span>}
                </div>
            </div>

            {personal.summary && (
                <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 48px', color: '#555', fontSize: 14, lineHeight: 1.9, fontStyle: 'italic', pageBreakInside: 'avoid' }}>
                    "{personal.summary}"
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 56 }}>
                <div>
                    {experiences.filter(e => e.company || e.role).length > 0 && (
                        <div style={{ marginBottom: 44 }}>
                            <EdHeading label="Experience" gold={gold} accent={accent} />
                            {experiences.filter(e => e.company || e.role).map((exp, i) => (
                                <div key={i} style={{ marginBottom: 30, paddingBottom: 30, borderBottom: '1px solid #e5e0d0', pageBreakInside: 'avoid' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <div>
                                            <div style={{ fontSize: 19, fontWeight: 700, color: accent, marginBottom: 3 }}>{exp.role}</div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: gold, fontFamily: "'DM Sans', sans-serif" }}>{exp.company}</div>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#999', fontFamily: "'DM Sans', sans-serif", textAlign: 'right' }}>
                                            {exp.startDate}<br />
                                            <span style={{ color: gold }}>{exp.current ? 'Present' : exp.endDate}</span>
                                        </div>
                                    </div>
                                    <ul style={{ paddingLeft: 20, margin: '12px 0 0', color: '#444', fontFamily: "'DM Sans', sans-serif" }}>
                                        {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                            <li key={j} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.8 }}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {projects.filter(p => p.title).length > 0 && (
                        <div>
                            <EdHeading label="Projects" gold={gold} accent={accent} />
                            {projects.filter(p => p.title).map((p, i) => (
                                <div key={i} style={{ marginBottom: 24, pageBreakInside: 'avoid' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: accent }}>{p.title}</span>
                                        {p.techStack && <span style={{ fontSize: 11, color: gold, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{p.techStack}</span>}
                                    </div>
                                    <p style={{ margin: 0, fontSize: 12.5, color: '#555', lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif" }}>{p.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    {educations.filter(e => e.degree || e.university).length > 0 && (
                        <div style={{ marginBottom: 32 }}>
                            <EdHeading label="Education" gold={gold} accent={accent} small />
                            {educations.filter(e => e.degree || e.university).map((edu, i) => (
                                <div key={i} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginBottom: 2 }}>{edu.degree}</div>
                                    <div style={{ fontSize: 12, color: '#666', fontFamily: "'DM Sans', sans-serif", marginBottom: 2 }}>{edu.university}</div>
                                    <div style={{ fontSize: 11.5, color: gold, fontFamily: "'DM Sans', sans-serif" }}>{edu.year}{edu.gpa ? ` · ${edu.gpa}` : ''}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {skills.length > 0 && (
                        <div style={{ pageBreakInside: 'avoid' }}>
                            <EdHeading label="Skills" gold={gold} accent={accent} small />
                            {skills.map((s, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: gold }} />
                                    <span style={{ fontSize: 12.5, color: '#444', fontFamily: "'DM Sans', sans-serif" }}>{s}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function EdHeading({ label, gold, accent, small }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e5e0d0' }} />
                <span style={{ fontSize: small ? 9 : 10, fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', color: gold, fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
                <div style={{ flex: 1, height: 1, backgroundColor: '#e5e0d0' }} />
            </div>
        </div>
    );
}
