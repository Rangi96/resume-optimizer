import React, { useState, useRef } from 'react';
import { FileText, Download, Palette, Type, Layout, Printer, Code, Copy, Check, Wand2, Upload, Sparkles, ArrowRight } from 'lucide-react';

// ============================================================================
// TEMPLATE OPTIONS
// ============================================================================

const templates = [
  { id: 'classic', name: 'Classic', desc: 'Traditional, serif fonts', icon: '📄' },
  { id: 'modern', name: 'Modern', desc: 'Clean, minimal design', icon: '✨' },
  { id: 'ats', name: 'ATS-Friendly', desc: 'Optimized for parsers', icon: '🤖' },
  { id: 'executive', name: 'Executive', desc: 'Bold, professional', icon: '👔' },
  { id: 'creative', name: 'Creative', desc: 'Colorful, unique', icon: '🎨' }
];

const fontOptions = [
  { id: 'inter', name: 'Inter', family: 'Inter, system-ui, sans-serif' },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif' },
  { id: 'times', name: 'Times', family: 'Times New Roman, serif' },
  { id: 'arial', name: 'Arial', family: 'Arial, sans-serif' },
  { id: 'roboto', name: 'Roboto', family: 'Roboto, sans-serif' }
];

const colorSchemes = [
  { id: 'black', name: 'Classic Black', primary: '#000000', accent: '#333333' },
  { id: 'navy', name: 'Navy Blue', primary: '#1e3a5f', accent: '#2563eb' },
  { id: 'forest', name: 'Forest Green', primary: '#14532d', accent: '#16a34a' },
  { id: 'burgundy', name: 'Burgundy', primary: '#7f1d1d', accent: '#dc2626' },
  { id: 'purple', name: 'Royal Purple', primary: '#4c1d95', accent: '#7c3aed' }
];

// ============================================================================
// TEMPLATE COMPONENTS
// ============================================================================

const ClassicTemplate = ({ data, style }) => (
  <div style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight, color: '#000' }}>
    <div style={{ textAlign: 'center', borderBottom: `2px solid ${style.primary}`, paddingBottom: '12px', marginBottom: '16px' }}>
      <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', color: style.primary, margin: 0 }}>{data.contact?.name}</h1>
      <p style={{ fontSize: '0.9em', color: '#444', marginTop: '6px' }}>
        {[data.contact?.email, data.contact?.phone, data.contact?.linkedin].filter(Boolean).join(' | ')}
      </p>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>Professional Summary</h2>
        <p style={{ textAlign: 'justify', fontSize: '0.9em' }}>{data.professionalSummary}</p>
      </div>
    )}
    {data.experience?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>Professional Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: '1em' }}>{exp.title}</strong>
              <span style={{ fontSize: '0.85em', color: '#555' }}>{exp.startDate} - {exp.endDate}</span>
            </div>
            <div style={{ fontSize: '0.9em', color: '#444', fontStyle: 'italic' }}>{exp.company}, {exp.location}</div>
            <ul style={{ margin: '6px 0', paddingLeft: '18px', fontSize: '0.88em' }}>
              {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '3px' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
    {data.education?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <div><strong>{edu.degree}</strong> — {edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
            <span style={{ fontSize: '0.85em', color: '#555' }}>{edu.date}</span>
          </div>
        ))}
      </div>
    )}
    {data.certifications?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>Certifications</h2>
        {data.certifications.map((cert, i) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '0.9em' }}>
            <strong>{cert.name}</strong> — {cert.issuer} ({cert.date})
          </div>
        ))}
      </div>
    )}
    {data.skills?.length > 0 && (
      <div>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>Skills</h2>
        {data.skills.map((skill, i) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '0.9em' }}>
            <strong>{skill.category}:</strong> {skill.items?.join(', ')}
          </div>
        ))}
      </div>
    )}
  </div>
);

const ModernTemplate = ({ data, style }) => (
  <div style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight }}>
    <div style={{ background: `linear-gradient(135deg, ${style.primary}, ${style.accent})`, color: 'white', padding: '20px', margin: '-20px -20px 20px -20px' }}>
      <h1 style={{ fontSize: '1.8em', fontWeight: '700', margin: 0 }}>{data.contact?.name}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', fontSize: '0.85em', opacity: 0.95 }}>
        {data.contact?.email && <span>📧 {data.contact.email}</span>}
        {data.contact?.phone && <span>📱 {data.contact.phone}</span>}
        {data.contact?.linkedin && <span>💼 {data.contact.linkedin}</span>}
      </div>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '18px', padding: '12px', background: '#f8f9fa', borderLeft: `3px solid ${style.accent}`, borderRadius: '0 4px 4px 0' }}>
        <p style={{ margin: 0, fontSize: '0.9em', color: '#444' }}>{data.professionalSummary}</p>
      </div>
    )}
    {data.experience?.length > 0 && (
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: '600', color: style.primary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ width: '24px', height: '2px', background: style.accent }}></span>Experience
        </h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <strong style={{ color: style.primary }}>{exp.title}</strong>
              <span style={{ fontSize: '0.8em', color: style.accent, fontWeight: '500' }}>{exp.startDate} - {exp.endDate}</span>
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>{exp.company} • {exp.location}</div>
            <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '0.85em', color: '#444' }}>
              {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '4px' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {data.education?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1em', fontWeight: '600', color: style.primary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: '24px', height: '2px', background: style.accent }}></span>Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
              <strong>{edu.degree}</strong><br/>
              <span style={{ color: '#666' }}>{edu.institution} • {edu.date}</span>
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.1em', fontWeight: '600', color: style.primary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: '24px', height: '2px', background: style.accent }}></span>Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: '6px', fontSize: '0.85em' }}>
              <strong>{cert.name}</strong><br/>
              <span style={{ color: '#666' }}>{cert.issuer} • {cert.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    {data.skills?.length > 0 && (
      <div style={{ marginTop: '18px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: '600', color: style.primary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ width: '24px', height: '2px', background: style.accent }}></span>Skills
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {data.skills.flatMap(s => s.items || []).map((item, i) => (
            <span key={i} style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.8em', color: style.primary }}>{item}</span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ATSTemplate = ({ data, style }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: style.fontSize, lineHeight: '1.5', color: '#000' }}>
    <div style={{ marginBottom: '12px' }}>
      <h1 style={{ fontSize: '1.6em', fontWeight: 'bold', margin: '0 0 4px 0' }}>{data.contact?.name}</h1>
      <p style={{ margin: 0, fontSize: '0.9em' }}>
        {[data.contact?.email, data.contact?.phone, data.contact?.address, data.contact?.linkedin].filter(Boolean).join(' • ')}
      </p>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Summary</h2>
        <p style={{ margin: 0, fontSize: '0.9em' }}>{data.professionalSummary}</p>
      </div>
    )}
    {data.experience?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Professional Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{exp.title}</p>
            <p style={{ margin: '2px 0', fontSize: '0.9em' }}>{exp.company}, {exp.location} | {exp.startDate} - {exp.endDate}</p>
            <ul style={{ margin: '6px 0', paddingLeft: '20px', fontSize: '0.88em' }}>
              {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '3px' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
    {data.education?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Education</h2>
        {data.education.map((edu, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>
            <strong>{edu.degree}</strong>, {edu.institution}{edu.location ? `, ${edu.location}` : ''} - {edu.date}
          </p>
        ))}
      </div>
    )}
    {data.certifications?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Certifications</h2>
        {data.certifications.map((cert, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>{cert.name}, {cert.issuer}, {cert.date}</p>
        ))}
      </div>
    )}
    {data.skills?.length > 0 && (
      <div>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Skills</h2>
        {data.skills.map((skill, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>{skill.category}:</strong> {skill.items?.join(', ')}</p>
        ))}
      </div>
    )}
  </div>
);

const ExecutiveTemplate = ({ data, style }) => (
  <div style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight }}>
    <div style={{ borderBottom: `4px solid ${style.primary}`, paddingBottom: '16px', marginBottom: '16px' }}>
      <h1 style={{ fontSize: '2.2em', fontWeight: '800', color: style.primary, margin: 0, letterSpacing: '-0.5px' }}>{data.contact?.name}</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
        {data.contact?.email && <span>{data.contact.email}</span>}
        {data.contact?.phone && <span>{data.contact.phone}</span>}
        {data.contact?.linkedin && <span>{data.contact.linkedin}</span>}
      </div>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '20px', fontSize: '1em', color: '#333', borderLeft: `4px solid ${style.accent}`, paddingLeft: '16px', fontStyle: 'italic' }}>
        {data.professionalSummary}
      </div>
    )}
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
      <div>
        {data.experience?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.2em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '6px', marginBottom: '14px' }}>Experience</h2>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05em', fontWeight: '700', color: style.primary }}>{exp.title}</h3>
                  <span style={{ fontSize: '0.8em', color: '#666', fontWeight: '600' }}>{exp.startDate} - {exp.endDate}</span>
                </div>
                <p style={{ margin: '2px 0 8px 0', fontSize: '0.9em', color: '#555', fontWeight: '500' }}>{exp.company} | {exp.location}</p>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85em', color: '#444' }}>
                  {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '4px' }}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        {data.education?.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>Education</h2>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px', fontSize: '0.85em' }}>
                <strong style={{ color: style.primary }}>{edu.degree}</strong>
                <p style={{ margin: '2px 0', color: '#555' }}>{edu.institution}</p>
                <p style={{ margin: 0, color: '#777', fontSize: '0.9em' }}>{edu.date}</p>
              </div>
            ))}
          </div>
        )}
        {data.certifications?.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>Certifications</h2>
            {data.certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
                <strong>{cert.name}</strong>
                <p style={{ margin: '2px 0', color: '#666' }}>{cert.issuer} • {cert.date}</p>
              </div>
            ))}
          </div>
        )}
        {data.skills?.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>Expertise</h2>
            {data.skills.map((skill, i) => (
              <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
                <strong style={{ color: style.primary }}>{skill.category}</strong>
                <p style={{ margin: '2px 0', color: '#555' }}>{skill.items?.join(' • ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const CreativeTemplate = ({ data, style }) => (
  <div style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight }}>
    <div style={{ background: `linear-gradient(135deg, ${style.primary} 0%, ${style.accent} 50%, #f472b6 100%)`, color: 'white', padding: '24px', margin: '-20px -20px 20px -20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '-30px', left: '20%', width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
      <h1 style={{ fontSize: '2em', fontWeight: '800', margin: 0, position: 'relative' }}>{data.contact?.name}</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', fontSize: '0.85em', position: 'relative' }}>
        {data.contact?.email && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>{data.contact.email}</span>}
        {data.contact?.phone && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>{data.contact.phone}</span>}
        {data.contact?.linkedin && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px' }}>{data.contact.linkedin}</span>}
      </div>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '20px', padding: '16px', background: `linear-gradient(135deg, ${style.primary}10, ${style.accent}10)`, borderRadius: '12px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '2em', color: style.accent, opacity: 0.3 }}>"</div>
        <p style={{ margin: 0, fontSize: '0.9em', color: '#444', paddingLeft: '20px' }}>{data.professionalSummary}</p>
      </div>
    )}
    {data.skills?.length > 0 && (
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: '700', color: style.primary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2em' }}>⚡</span> Skills & Expertise
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {data.skills.flatMap(s => s.items || []).map((item, i) => (
            <span key={i} style={{ padding: '6px 14px', background: `linear-gradient(135deg, ${style.primary}, ${style.accent})`, color: 'white', borderRadius: '20px', fontSize: '0.8em', fontWeight: '500' }}>{item}</span>
          ))}
        </div>
      </div>
    )}
    {data.experience?.length > 0 && (
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: '700', color: style.primary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2em' }}>💼</span> Experience
        </h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '16px', padding: '14px', background: '#f8f9fa', borderRadius: '10px', borderLeft: `4px solid ${style.accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '4px' }}>
              <strong style={{ color: style.primary, fontSize: '1em' }}>{exp.title}</strong>
              <span style={{ fontSize: '0.8em', color: 'white', background: style.accent, padding: '2px 10px', borderRadius: '12px' }}>{exp.startDate} - {exp.endDate}</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>{exp.company} • {exp.location}</p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85em', color: '#444' }}>
              {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '4px' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {data.education?.length > 0 && (
        <div style={{ padding: '14px', background: `${style.primary}08`, borderRadius: '10px' }}>
          <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🎓</span> Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
              <strong>{edu.degree}</strong>
              <p style={{ margin: '2px 0', color: '#666' }}>{edu.institution} • {edu.date}</p>
            </div>
          ))}
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div style={{ padding: '14px', background: `${style.accent}08`, borderRadius: '10px' }}>
          <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🏆</span> Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
              <strong>{cert.name}</strong>
              <p style={{ margin: '2px 0', color: '#666' }}>{cert.issuer} • {cert.date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// MAIN INTEGRATED COMPONENT
// ============================================================================

export default function ResumeAutomation() {
  const [step, setStep] = useState('input'); // input, optimize, format
  const [resumeInput, setResumeInput] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [optimizedData, setOptimizedData] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  // Formatting state
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedFont, setSelectedFont] = useState(fontOptions[0]);
  const [selectedColor, setSelectedColor] = useState(colorSchemes[1]);
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  
  const previewRef = useRef(null);

  // Handle file upload (PDF or JSON)
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const fileType = file.name.toLowerCase();
      
      if (fileType.endsWith('.json')) {
        // Handle JSON file
        const text = await file.text();
        const jsonData = JSON.parse(text);
        
        // Check if it's already optimized data or just resume input
        if (jsonData.contact && jsonData.experience) {
          // It's a complete resume JSON - skip to formatting
          setOptimizedData(jsonData);
          setStep('format');
        } else {
          // It's raw data - use as resume input
          setResumeInput(JSON.stringify(jsonData, null, 2));
        }
      } else if (fileType.endsWith('.pdf')) {
        // Handle PDF file - convert to base64 and extract text via AI
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Use Claude to extract text from PDF
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            messages: [{
              role: "user",
              content: [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: "application/pdf",
                    data: base64Data
                  }
                },
                {
                  type: "text",
                  text: "Extract all text content from this resume PDF and return it as plain text. Include all sections: contact info, summary, experience, education, skills, certifications, etc."
                }
              ]
            }]
          })
        });

        const data = await response.json();
        const extractedText = data.content?.find(c => c.type === 'text')?.text || '';
        setResumeInput(extractedText);
      } else {
        setError('Please upload a PDF or JSON file.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to process file. Please check the file format and try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // AI Optimization Function
  const optimizeResume = async () => {
    if (!resumeInput.trim() || !jobDescription.trim()) {
      setError('Please provide both your resume information and the job description.');
      return;
    }

    setIsOptimizing(true);
    setError('');

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: `You are an expert resume optimizer. Given a person's resume information and a job description, optimize the resume to better match the job requirements.

CRITICAL RULES:
1. DO NOT invent new experiences, skills, or accomplishments
2. ONLY rework existing content to highlight relevant aspects
3. Rewrite bullet points to emphasize relevant skills and match job keywords
4. Reorder sections/items to prioritize most relevant content
5. Ensure all dates, companies, and core facts remain accurate

Resume Information:
${resumeInput}

Job Description:
${jobDescription}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "contact": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "linkedin": "LinkedIn URL (optional)",
    "address": "address (optional)"
  },
  "professionalSummary": "2-3 sentence summary optimized for this role",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or Present",
      "bullets": ["Optimized achievement 1", "Optimized achievement 2", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "location": "City, State (optional)",
      "date": "Graduation Date"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date"
    }
  ],
  "skills": [
    {
      "category": "Category Name",
      "items": ["Skill 1", "Skill 2", "..."]
    }
  ]
}`
          }],
        })
      });

      const data = await response.json();
      const content = data.content?.find(c => c.type === 'text')?.text || '';
      
      // Clean and parse JSON
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      setOptimizedData(parsed);
      setStep('format');
    } catch (err) {
      console.error('Optimization error:', err);
      setError('Failed to optimize resume. Please check your input format and try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Style object for templates
  const style = {
    fontFamily: selectedFont.family,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    primary: selectedColor.primary,
    accent: selectedColor.accent
  };

  // Template renderer
  const renderTemplate = () => {
    if (!optimizedData) return null;
    const props = { data: optimizedData, style };
    switch (selectedTemplate) {
      case 'classic': return <ClassicTemplate {...props} />;
      case 'modern': return <ModernTemplate {...props} />;
      case 'ats': return <ATSTemplate {...props} />;
      case 'executive': return <ExecutiveTemplate {...props} />;
      case 'creative': return <CreativeTemplate {...props} />;
      default: return <ModernTemplate {...props} />;
    }
  };

  // Export functions
  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    const content = previewRef.current?.innerHTML || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${optimizedData?.contact?.name || 'Resume'}</title>
          <style>
            @page { margin: 0.5in; size: letter; }
            body { margin: 0; padding: 20px; font-family: ${selectedFont.family}; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 250);
  };

  const exportHTML = () => {
    const content = previewRef.current?.innerHTML || '';
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${optimizedData?.contact?.name || 'Resume'}</title>
  <style>body { font-family: ${selectedFont.family}; max-width: 800px; margin: 40px auto; padding: 20px; }</style>
</head>
<body>${content}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${optimizedData?.contact?.name || 'resume'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(optimizedData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7" />
              <div>
                <h1 className="text-2xl font-bold">AI Resume Optimizer</h1>
                <p className="text-sm text-blue-100">Tailor your resume to any job in seconds</p>
              </div>
            </div>
            {step === 'format' && (
              <button
                onClick={() => { setStep('input'); setOptimizedData(null); }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                ← Start Over
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STEP 1: INPUT */}
      {step === 'input' && (
        <div className="max-w-5xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Step 1: Provide Your Information</h2>
                <p className="text-sm text-gray-600">Paste your current resume or enter your details</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* File Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    {isUploading ? (
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700">
                      {isUploading ? 'Processing file...' : 'Upload Resume'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Click to upload PDF or JSON file
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: .pdf, .json
                    </p>
                  </div>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Resume Information
                </label>
                <textarea
                  value={resumeInput}
                  onChange={(e) => setResumeInput(e.target.value)}
                  placeholder="Paste your resume text here, or type your information in any format:

Name: John Doe
Email: john@example.com
Phone: 555-1234
LinkedIn: linkedin.com/in/johndoe

Summary: Experienced software engineer...

Experience:
- Software Engineer at ABC Corp (2020-Present)
  * Built scalable web applications
  * Led team of 3 developers
  
Education:
- BS Computer Science, XYZ University, 2020

Skills: Python, React, AWS, etc."
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here...

Senior Software Engineer
Company XYZ is seeking an experienced engineer...

Requirements:
- 5+ years of experience with Python and React
- Strong AWS experience
- Leadership experience..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={optimizeResume}
                disabled={isOptimizing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isOptimizing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Optimizing Resume...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Optimize My Resume
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FORMAT & EXPORT */}
      {step === 'format' && optimizedData && (
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Panel - Controls */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Tabs */}
              <div className="bg-gray-50 border-b px-4 py-2 flex gap-2">
                {['templates', 'customize', 'export'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div className="p-4">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <Layout className="w-4 h-4" /> Choose Template
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplate(t.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedTemplate === t.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl mb-2 block">{t.icon}</span>
                        <span className="font-semibold text-gray-800 block">{t.name}</span>
                        <span className="text-xs text-gray-500">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Customize Tab */}
              {activeTab === 'customize' && (
                <div className="p-4 space-y-5">
                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                      <Type className="w-4 h-4" /> Font Family
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {fontOptions.map(f => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFont(f)}
                          className={`px-3 py-2 rounded-lg text-sm border transition-all ${
                            selectedFont.id === f.id 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ fontFamily: f.family }}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                      <Palette className="w-4 h-4" /> Color Scheme
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {colorSchemes.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedColor(c)}
                          className={`px-3 py-2 rounded-lg text-sm border flex items-center gap-2 transition-all ${
                            selectedColor.id === c.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full" style={{ background: c.primary }}></span>
                          <span className="text-xs">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Font Size: {fontSize}px</h3>
                    <input 
                      type="range" 
                      min="10" 
                      max="16" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(Number(e.target.value))} 
                      className="w-full accent-blue-600" 
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Line Height: {lineHeight}</h3>
                    <input 
                      type="range" 
                      min="1.2" 
                      max="2" 
                      step="0.1" 
                      value={lineHeight} 
                      onChange={(e) => setLineHeight(Number(e.target.value))} 
                      className="w-full accent-blue-600" 
                    />
                  </div>
                </div>
              )}

              {/* Export Tab */}
              {activeTab === 'export' && (
                <div className="p-4">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4" /> Export Options
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={exportPDF} 
                      className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Printer className="w-5 h-5 text-red-600 mx-auto mb-1" />
                      <span className="text-sm font-medium text-red-700 block">Print / PDF</span>
                    </button>
                    <button 
                      onClick={exportHTML} 
                      className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <Code className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                      <span className="text-sm font-medium text-orange-700 block">HTML File</span>
                    </button>
                    <button 
                      onClick={copyJSON} 
                      className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors col-span-2"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      ) : (
                        <Copy className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                      )}
                      <span className="text-sm font-medium text-purple-700 block">
                        {copied ? 'Copied!' : 'Copy JSON'}
                      </span>
                    </button>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Tip:</strong> Use "Print / PDF" and choose "Save as PDF" in the print dialog.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Preview */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Live Preview</span>
                <span className="text-xs text-gray-400">
                  {templates.find(t => t.id === selectedTemplate)?.name} Template
                </span>
              </div>
              <div className="p-4 bg-gray-100 h-[600px] overflow-auto">
                <div 
                  ref={previewRef} 
                  className="bg-white shadow-lg mx-auto p-5" 
                  style={{ width: '100%', maxWidth: '612px', minHeight: '792px' }}
                >
                  {renderTemplate()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
