import React from 'react';

export default function TemplateAurora({ data }) {
    const { personal, experiences, educations, skills, projects, jobRole } = data;
    const teal = '#0891b2';
    return (
        <div style={{ backgroundColor: '#f0f9ff', fontFamily: "'DM Sans', sans-serif", minHeight: '297mm' }}>
            <div style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 40%, #7c3aed 100%)', padding: '52px 56px 60px', color: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: 42, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-1.5px' }}>{personal.name || 'Your Name'}</h1>
                        {jobRole && <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 20px', opacity: .75, letterSpacing: '.5px' }}>{jobRole}</p>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 12, opacity: .8, fontWeight: 500 }}>
                            {personal.email && <span>✉ {personal.email}</span>}
                            {personal.phone && <span>📞 {personal.phone}</span>}
                            {personal.location && <span>📍 {personal.location}</span>}
                        </div>
                    </div>
                    {personal.linkedin && (
                        <div style={{ textAlign: 'right', fontSize: 12, opacity: .75 }}>
                            🔗 {personal.linkedin}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '48px 56px', display: 'flex', gap: 44 }}>
                <div style={{ flex: 1 }}>
                    {personal.summary && (
                        <div style={{ marginBottom: 36, padding: '20px 24px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #bae6fd', boxShadow: '0 2px 12px rgba(8,145,178,.08)', pageBreakInside: 'avoid' }}>
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: teal, marginBottom: 10 }}>Profile</div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: '#334155' }}>{personal.summary}</p>
                        </div>
                    )}

                    {experiences.filter(e => e.company || e.role).length > 0 && (
                        <div style={{ marginBottom: 36 }}>
                            <AuroraHeading label="Experience" color={teal} />
                            {experiences.filter(e => e.company || e.role).map((exp, i) => (
                                <div key={i} style={{ marginBottom: 20, padding: '16px 20px', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e0f2fe', borderLeft: `4px solid ${teal}`, pageBreakInside: 'avoid' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{exp.role}</span>
                                        <span style={{ fontSize: 11, color: teal, fontWeight: 700, backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: 100 }}>
                                            {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}{exp.current ? 'Now' : exp.endDate}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: teal, fontWeight: 600, marginBottom: 10 }}>{exp.company}</div>
                                    <ul style={{ paddingLeft: 16, margin: 0, color: '#475569' }}>
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
                            <AuroraHeading label="Projects" color={teal} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                {projects.filter(p => p.title).map((p, i) => (
                                    <div key={i} style={{ padding: '14px 18px', backgroundColor: '#fff', borderRadius: 10, border: '1px solid #e0f2fe', pageBreakInside: 'avoid' }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{p.title}</div>
                                        {p.techStack && <div style={{ fontSize: 10.5, color: teal, fontWeight: 600, marginBottom: 6 }}>{p.techStack}</div>}
                                        <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{p.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ width: 200, flexShrink: 0 }}>
                    {skills.length > 0 && (
                        <div style={{ marginBottom: 28, padding: '18px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #bae6fd', pageBreakInside: 'avoid' }}>
                            <AuroraHeading label="Skills" color={teal} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {skills.map((s, i) => (
                                    <span key={i} style={{ fontSize: 11.5, padding: '5px 12px', backgroundColor: '#e0f2fe', color: teal, borderRadius: 100, fontWeight: 600 }}>{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {educations.filter(e => e.degree || e.university).length > 0 && (
                        <div style={{ padding: '18px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #bae6fd', pageBreakInside: 'avoid' }}>
                            <AuroraHeading label="Education" color={teal} />
                            {educations.filter(e => e.degree || e.university).map((edu, i) => (
                                <div key={i} style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{edu.degree}</div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{edu.university}</div>
                                    <div style={{ fontSize: 11, color: teal, fontWeight: 600 }}>{edu.year}{edu.gpa ? ` · ${edu.gpa}` : ''}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AuroraHeading({ label, color }) {
    return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color, marginBottom: 14 }}>{label}</div>;
}
