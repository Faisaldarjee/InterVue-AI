import React from 'react';

export function Field({ label, value, onChange, placeholder, type = 'text', disabled = false, icon }) {
    return (
        <div>
            {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,.9)', marginBottom: 6, letterSpacing: '.3px' }}>{label}</label>}
            <div style={{ position: 'relative' }}>
                {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(148,163,184,.5)', pointerEvents: 'none', display: 'flex' }}>{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="input-field"
                    style={{
                        width: '100%',
                        padding: icon ? '10px 14px 10px 38px' : '10px 14px',
                        borderRadius: 10,
                        fontSize: 13.5,
                        fontFamily: 'inherit',
                    }}
                />
            </div>
        </div>
    );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
    return (
        <div>
            {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,.9)', marginBottom: 6 }}>{label}</label>}
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className="input-field"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }}
            />
        </div>
    );
}

export function StepHeader({ icon, title, subtitle, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-.3px' }}>{title}</h2>
                <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(148,163,184,.5)' }}>{subtitle}</p>
            </div>
        </div>
    );
}

export function MiniBtn({ onClick, children, danger, title, ...props }) {
    return (
        <button onClick={onClick} title={title} style={{
            padding: '5px 6px', borderRadius: 7, border: danger ? '1px solid rgba(239,68,68,.2)' : '1px solid rgba(99,102,241,.2)',
            background: danger ? 'rgba(239,68,68,.07)' : 'rgba(99,102,241,.07)',
            color: danger ? 'rgba(239,68,68,.7)' : 'rgba(99,102,241,.8)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s'
        }} {...props}>
            {children}
        </button>
    );
}

export function AddBtn({ onClick, label, color }) {
    return (
        <button onClick={onClick} style={{
            width: '100%', padding: '12px', borderRadius: 12,
            border: `2px dashed ${color}30`, background: `${color}05`,
            color: `${color}90`, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, transition: 'all .2s',
        }}
            onMouseEnter={e => { e.target.style.borderColor = `${color}60`; e.target.style.color = color; }}
            onMouseLeave={e => { e.target.style.borderColor = `${color}30`; e.target.style.color = `${color}90`; }}
        >
            {/* The Plus icon can be passed securely from parent or imported. Assuming parent passes it inside label if needed, or we just render text for now and parent passes <Plus/> inside label. But the original used <Plus size={15} />. For simplicity, we expect the parent to include the icon in the label, or we depend on lucide-react. */}
            {label}
        </button>
    );
}
