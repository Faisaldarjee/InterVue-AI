import React from 'react';

export default function TemplateNoir({ data }) {
    const { personal, experiences, educations, skills, projects, jobRole } = data;
    const accent = '#c9a84c';
    return (
        <div style={{ display: 'flex', minHeight: '297mm', fontFamily: "'DM Sans', sans-serif", backgroundColor: '#0f0f0f', color: '#e5e5e5' }}>
            {/* Sidebar */}
            <div style={{ width: '35%', backgroundColor: '#141414', padding: '48px 32px', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                    <div style={{ width: 64, height: 4, backgroundColor: accent, marginBottom: 20, borderRadius: 2 }} />
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 6px', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{personal.name || 'Your Name'}</h1>
                    {jobRole && <p style={{ fontSize: 12, fontWeight: 600, color: accent, margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>{jobRole}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {personal.email && <ContactRow icon="✉" label={personal.email} accent={accent} />}
                    {personal.phone && <ContactRow icon="📞" label={personal.phone} accent={accent} />}
                    {personal.location && <ContactRow icon="📍" label={personal.location} accent={accent} />}
                    {personal.linkedin && <ContactRow icon="in" label={personal.linkedin} accent={accent} />}
                </div>

                {skills.length > 0 && (
                    <div>
                        <SidebarHeading label="Skills" accent={accent} />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {skills.map((s, i) => (
                                <span key={i} style={{ fontSize: 11, padding: '4px 10px', border: `1px solid ${accent}40`, color: accent, borderRadius: 4, fontWeight: 500 }}>{s}</span>
                            ))}
                        </div>
                    </div>
                )}

                {educations.filter(e => e.degree || e.university).length > 0 && (
                    <div>
                        <SidebarHeading label="Education" accent={accent} />
                        {educations.filter(e => e.degree || e.university).map((e, i) => (
                            <div key={i} style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginBottom: 2 }}>{e.degree}</div>
                                <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>{e.university}</div>
                                <div style={{ fontSize: 11, color: accent }}>{e.year}{e.gpa ? ` · GPA: ${e.gpa}` : ''}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main */}
            <div style={{ flex: 1, padding: '48px 40px', display: 'flex', flexDirection: 'column', gap: '36px' }}>
                {personal.summary && (
                    <div>
                        <MainHeading label="Profile" accent={accent} />
                        <p style={{ fontSize: 13, lineHeight: 1.8, color: '#aaa', margin: 0 }}>{personal.summary}</p>
                    </div>
                )}

                {experiences.filter(e => e.company || e.role).length > 0 && (
                    <div style={{ pageBreakInside: 'avoid' }}>
                        <MainHeading label="Experience" accent={accent} />
                        {experiences.filter(e => e.company || e.role).map((exp, i) => (
                            <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #1e1e1e', pageBreakInside: 'avoid' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{exp.role}</div>
                                        <div style={{ fontSize: 13, color: accent, fontWeight: 600 }}>{exp.company}</div>
                                    </div>
                                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600, backgroundColor: '#1e1e1e', padding: '4px 10px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                        {exp.startDate}{exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}{exp.current ? 'Present' : exp.endDate}
                                    </span>
                                </div>
                                <ul style={{ paddingLeft: 18, margin: '10px 0 0', color: '#999' }}>
                                    {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                        <li key={j} style={{ fontSize: 12.5, marginBottom: 6, lineHeight: 1.7 }}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {projects.filter(p => p.title).length > 0 && (
                    <div style={{ pageBreakInside: 'avoid' }}>
                        <MainHeading label="Projects" accent={accent} />
                        {projects.filter(p => p.title).map((p, i) => (
                            <div key={i} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.title}</span>
                                    {p.techStack && <span style={{ fontSize: 10, color: accent, border: `1px solid ${accent}40`, borderRadius: 3, padding: '2px 8px', fontWeight: 600 }}>{p.techStack}</span>}
                                </div>
                                <p style={{ margin: 0, fontSize: 12.5, color: '#888', lineHeight: 1.7 }}>{p.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ContactRow({ icon, label, accent }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#999' }}>
            <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#555' }}>{icon}</span>
            <span style={{ wordBreak: 'break-all' }}>{label}</span>
        </div>
    );
}

function SidebarHeading({ label, accent }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 16, height: 2, backgroundColor: accent }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#666' }}>{label}</span>
        </div>
    );
}

function MainHeading({ label, accent }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: accent }}>{label}</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#1e1e1e' }} />
        </div>
    );
}
