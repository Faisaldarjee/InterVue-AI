import { useState, useEffect } from 'react';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const EMPTY_EXP = () => ({ id: generateId(), company: '', role: '', startDate: '', endDate: '', current: false, bullets: [''] });
export const EMPTY_EDU = () => ({ id: generateId(), degree: '', university: '', year: '', gpa: '' });
export const EMPTY_PROJ = () => ({ id: generateId(), title: '', description: '', techStack: '', link: '' });

export function useResumeState() {
    const [personal, setPersonal] = useState({ name: '', email: '', phone: '', linkedin: '', location: '', summary: '' });
    const [jobRole, setJobRole] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [experiences, setExps] = useState([EMPTY_EXP()]);
    const [educations, setEdus] = useState([EMPTY_EDU()]);
    const [skills, setSkills] = useState([]);
    const [projects, setProjs] = useState([EMPTY_PROJ()]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const savedData = localStorage.getItem('resumeBuilderData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.personal) setPersonal(parsed.personal);
                if (parsed.jobRole) setJobRole(parsed.jobRole);
                if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
                if (parsed.experiences?.length) {
                    // Ensure legacy data gets IDs for dnd-kit
                    setExps(parsed.experiences.map(e => ({...e, id: e.id || generateId()})));
                }
                if (parsed.educations?.length) {
                    setEdus(parsed.educations.map(e => ({...e, id: e.id || generateId()})));
                }
                if (parsed.skills) setSkills(parsed.skills);
                if (parsed.projects?.length) {
                    setProjs(parsed.projects.map(p => ({...p, id: p.id || generateId()})));
                }
            } catch (e) {
                console.error("Failed to parse resume data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (!isLoaded) return;
        const dataToSave = {
            personal, jobRole, jobDescription, experiences, educations, skills, projects
        };
        localStorage.setItem('resumeBuilderData', JSON.stringify(dataToSave));
    }, [personal, jobRole, jobDescription, experiences, educations, skills, projects, isLoaded]);

    return {
        personal, setPersonal,
        jobRole, setJobRole,
        jobDescription, setJobDescription,
        experiences, setExps,
        educations, setEdus,
        skills, setSkills,
        projects, setProjs
    };
}
