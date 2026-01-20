import React, { useState, useRef, useContext, useEffect } from 'react';
import { FileText, Download, Palette, Type, Layout, Printer, Code, Copy, Check, Wand2, Upload, Sparkles, ArrowRight, Loader2, Search, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import * as mammoth from 'mammoth';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../AuthContext';
import LoginModal from '../components/LoginModal';
import StripeCheckout from '../components/StripeCheckout';
import PaymentSuccess from '../components/PaymentSuccess';
import PaymentCanceled from '../components/PaymentCanceled';
import UserMenu from '../components/UserMenu';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { canUserOptimize, recordOptimization, getOptimizationStats } from '../optimizationManager';

// Helper function to render text with markdown-style bold
const renderTextWithBold = (text) => {
  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  const regex = /\*\*(.*?)\*\*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    // Add the bold part
    parts.push(
      <strong key={`bold-${match.index}`} className="font-bold text-gray-900">
        {match[1]}
      </strong>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text after the last bold part
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
};

// Add the new props here inside the curly braces
const PhaseNavigation = ({ phase, setPhase, isUploadComplete = false, isFormatTriggered = false, t }) => {
  const phases = ['upload', 'optimize', 'format'];
  const currentIndex = phases.indexOf(phase);
  
  // Logic: 
  // Phase 0 (Upload): Next disabled until isUploadComplete is true
  // Phase 1 (Optimize): Next always enabled (user can go to format anytime)
  // Phase 2 (Format): No next button
  const isNextDisabled = (currentIndex === 0 && !isUploadComplete);

  return (
    <div className="flex justify-between items-center mb-6">
      {currentIndex > 0 ? (
        <button
          onClick={() => setPhase(phases[currentIndex - 1])}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
        >
          {t ? t('navigation.back') : '← Back'}
        </button>
      ) : <div />}
      
      {currentIndex < phases.length - 1 && (
        <button 
          onClick={() => {
            setPhase(phases[currentIndex + 1]);
          }}
          disabled={isNextDisabled}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isNextDisabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {t ? t('navigation.next') : 'Next →'}
        </button>
      )}
    </div>
  );
};

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

const ClassicTemplate = ({ data, style, t }) => (
  <div style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight, color: '#000' }}>
    <div style={{ textAlign: 'center', borderBottom: `2px solid ${style.primary}`, paddingBottom: '12px', marginBottom: '16px' }}>
      <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', color: style.primary, margin: 0 }}>{data.contact?.name}</h1>
      <p style={{ fontSize: '0.9em', color: '#444', marginTop: '6px' }}>
        {[data.contact?.email, data.contact?.phone, data.contact?.linkedin].filter(Boolean).join(' | ')}
      </p>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>{t ? t('templates:sections.professionalSummary') : 'Professional Summary'}</h2>
        <p style={{ textAlign: 'justify', fontSize: '0.9em' }}>{data.professionalSummary}</p>
      </div>
    )}
    {data.experience?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>{t ? t('templates:sections.experience') : 'Professional Experience'}</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: '1em' }}>{exp.title}</strong>
              <span style={{ fontSize: '0.85em', color: '#555' }}>{exp.startDate} - {exp.endDate}</span>
            </div>
            <div style={{ fontSize: '0.9em', color: '#444', fontStyle: 'italic' }}>{exp.company}, {exp.location}</div>
            <ul style={{ margin: '6px 0', paddingLeft: '18px', fontSize: '0.88em', listStyleType: 'disc'  }}>
              {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '3px' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
    {data.education?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>{t ? t('templates:sections.education') : 'Education'}</h2>
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
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>{t ? t('templates:sections.certifications') : 'Certifications'}</h2>
        {data.certifications.map((cert, i) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '0.9em' }}>
            <strong>{cert.name}</strong> — {cert.issuer} ({cert.date})
          </div>
        ))}
      </div>
    )}
    {data.skills?.length > 0 && (
      <div>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' }}>{t ? t('templates:sections.skills') : 'Skills'}</h2>
        {data.skills.map((skill, i) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '0.9em' }}>
            <strong>{skill.category}:</strong> {skill.items?.join(', ')}
          </div>
        ))}
      </div>
    )}
  </div>
);

const ModernTemplate = ({ data, style, t }) => (
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
          <span style={{ width: '24px', height: '2px', background: style.accent }}></span>{t ? t('templates:sections.experience') : 'Experience'}
        </h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '14px', paddingLeft: '12px', borderLeft: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <strong style={{ color: style.primary }}>{exp.title}</strong>
              <span style={{ fontSize: '0.8em', color: style.accent, fontWeight: '500' }}>{exp.startDate} - {exp.endDate}</span>
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>{exp.company} • {exp.location}</div>
            <ul style={{ margin: '8px 0', paddingLeft: '16px', fontSize: '0.85em', color: '#444', listStyleType: 'disc'  }}>
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
            <span style={{ width: '24px', height: '2px', background: style.accent }}></span>{t ? t('templates:sections.education') : 'Education'}
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
            <span style={{ width: '24px', height: '2px', background: style.accent }}></span>{t ? t('templates:sections.certifications') : 'Certifications'}
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
          <span style={{ width: '24px', height: '2px', background: style.accent }}></span>{t ? t('templates:sections.skills') : 'Skills'}
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

const ATSTemplate = ({ data, style, t }) => (
  <div style={{ fontFamily: 'Arial, sans-serif', fontSize: style.fontSize, lineHeight: '1.5', color: '#000' }}>
    <div style={{ marginBottom: '12px' }}>
      <h1 style={{ fontSize: '1.6em', fontWeight: 'bold', margin: '0 0 4px 0' }}>{data.contact?.name}</h1>
      <p style={{ margin: 0, fontSize: '0.9em' }}>
        {[data.contact?.email, data.contact?.phone, data.contact?.address, data.contact?.linkedin].filter(Boolean).join(' • ')}
      </p>
    </div>
    {data.professionalSummary && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 6px 0', textTransform: 'uppercase' }}>{t ? t('templates:sections.summary') : 'Summary'}</h2>
        <p style={{ margin: 0, fontSize: '0.9em' }}>{data.professionalSummary}</p>
      </div>
    )}
    {data.experience?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{t ? t('templates:sections.experience') : 'Professional Experience'}</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '12px' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{exp.title}</p>
            <p style={{ margin: '2px 0', fontSize: '0.9em' }}>{exp.company}, {exp.location} | {exp.startDate} - {exp.endDate}</p>
            <ul style={{ margin: '6px 0', paddingLeft: '20px', fontSize: '0.88em', listStyleType: 'disc'  }}>
              {exp.bullets?.map((b, j) => <li key={j} style={{ marginBottom: '3px' }}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    )}
    {data.education?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{t ? t('templates:sections.education') : 'Education'}</h2>
        {data.education.map((edu, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>
            <strong>{edu.degree}</strong>, {edu.institution}{edu.location ? `, ${edu.location}` : ''} - {edu.date}
          </p>
        ))}
      </div>
    )}
    {data.certifications?.length > 0 && (
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{t ? t('templates:sections.certifications') : 'Certifications'}</h2>
        {data.certifications.map((cert, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>{cert.name}, {cert.issuer}, {cert.date}</p>
        ))}
      </div>
    )}
    {data.skills?.length > 0 && (
      <div>
        <h2 style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{t ? t('templates:sections.skills') : 'Skills'}</h2>
        {data.skills.map((skill, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>{skill.category}:</strong> {skill.items?.join(', ')}</p>
        ))}
      </div>
    )}
  </div>
);

const ExecutiveTemplate = ({ data, style, t }) => (
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
            <h2 style={{ fontSize: '1.2em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '6px', marginBottom: '14px' }}>{t ? t('templates:sections.experience') : 'Experience'}</h2>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05em', fontWeight: '700', color: style.primary }}>{exp.title}</h3>
                  <span style={{ fontSize: '0.8em', color: '#666', fontWeight: '600' }}>{exp.startDate} - {exp.endDate}</span>
                </div>
                <p style={{ margin: '2px 0 8px 0', fontSize: '0.9em', color: '#555', fontWeight: '500' }}>{exp.company} | {exp.location}</p>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85em', color: '#444', listStyleType: 'disc'  }}>
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
            <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>{t ? t('templates:sections.education') : 'Education'}</h2>
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
            <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>{t ? t('templates:sections.certifications') : 'Certifications'}</h2>
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
            <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>{t ? t('templates:sections.expertise') : 'Expertise'}</h2>
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

const CreativeTemplate = ({ data, style, t }) => (
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
          <span style={{ fontSize: '1.2em' }}>⚡</span> {t ? t('templates:sections.skills') : 'Skills'} & {t ? t('templates:sections.expertise') : 'Expertise'}
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
          <span style={{ fontSize: '1.2em' }}>💼</span> {t ? t('templates:sections.experience') : 'Experience'}
        </h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '16px', padding: '14px', background: '#f8f9fa', borderRadius: '10px', borderLeft: `4px solid ${style.accent}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: '4px' }}>
              <strong style={{ color: style.primary, fontSize: '1em' }}>{exp.title}</strong>
              <span style={{ fontSize: '0.8em', color: 'white', background: style.accent, padding: '2px 10px', borderRadius: '12px' }}>{exp.startDate} - {exp.endDate}</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: '#666' }}>{exp.company} • {exp.location}</p>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85em', color: '#444', listStyleType: 'disc' }}>
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
            <span>🎓</span> {t ? t('templates:sections.education') : 'Education'}
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
            <span>🏆</span> {t ? t('templates:sections.certifications') : 'Certifications'}
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

export default function MainApp() {
  // Phase management
  const [phase, setPhase] = useState('upload'); // upload, optimize, format
  
  // Upload phase
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [optimizedContent, setOptimizedContent] = useState('');//FALTABA
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [isFormatTriggered, setIsFormatTriggered] = useState(false);

  
  // Optimize phase
  const [structuredResume, setStructuredResume] = useState({
    contact: { name: '', email: '', phone: '', address: '', linkedin: '' },
    professionalSummary: '',
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    references: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCanceled, setShowPaymentCanceled] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation(['common', 'templates']);

  // Check for payment success/cancel in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');

    if (sessionId) {
      setPaymentSessionId(sessionId);
      setShowPaymentSuccess(true);
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/');
    } else if (canceled) {
      setShowPaymentCanceled(true);
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Gap filling
  const [addingGap, setAddingGap] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState('');
  const [generatingBullet, setGeneratingBullet] = useState(false);
  const [previewBullet, setPreviewBullet] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [editingSection, setEditingSection] = useState(null);//FALTABA
  const [editData, setEditData] = useState(null);//FALTABA
  const [showExportMenu, setShowExportMenu] = useState(false);//FALTABA
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  
  // Format phase
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedFont, setSelectedFont] = useState(fontOptions[0]);
  const [selectedColor, setSelectedColor] = useState(colorSchemes[1]);
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [activeTab, setActiveTab] = useState('templates');
  const [copied, setCopied] = useState(false);
  
  const [error, setError] = useState('');
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);

  // File reading function
  const readFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        reader.onload = async (e) => {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
            resolve(result.value);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'application/pdf') {
        // For PDF, we'll need backend extraction
        reader.onload = async (e) => {
          try {
            const base64Data = e.target.result.split(',')[1];
            const response = await fetch('/api/extract-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pdfBase64: base64Data })
            });
            const data = await response.json();
            resolve(data.text || '');
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsText(file);
      }
      
      reader.onerror = reject;
    });
  };

  const handleResumeUpload = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setResumeFile(file);
        setIsExtractingFile(true);  // Show loading state
        try {
          const text = await readFile(file);
          setResumeText(text);
          if (text.length < 50) {
            setError('Warning: The extracted text seems too short. Please check the file.');
          } else {
            setError(''); // Clear errors on success
          }
        } catch (error) {
          setError('Error reading file. Please try a different format.');
          setResumeFile(null);
          setResumeText('');
        } finally {
          setIsExtractingFile(false);  // Hide loading state
        }
      }
    };

    const convertStructuredToText = (structured) => {
    let text = '';
    
    if (structured.contact) {
      text += `${structured.contact.name}\n`;
      const contactDetails = [structured.contact.email, structured.contact.phone, structured.contact.address].filter(Boolean).join(' | ');
      text += `${contactDetails}\n\n`;
    }
    
    if (structured.professionalSummary) {
      text += `PROFESSIONAL SUMMARY\n${structured.professionalSummary}\n\n`;
    }
    
    if (structured.experience && structured.experience.length > 0) {
      text += `EXPERIENCE\n\n`;
      structured.experience.forEach(exp => {
        text += `${exp.title} | ${exp.company}\n${exp.location} | ${exp.startDate} - ${exp.endDate}\n`;
        exp.bullets.forEach(bullet => text += `• ${bullet}\n`);
        text += '\n';
      });
    }
    
    if (structured.education && structured.education.length > 0) {
      text += `EDUCATION\n\n`;
      structured.education.forEach(edu => {
        text += `${edu.degree} | ${edu.institution}\n${edu.location} | ${edu.date}\n`;
        if (edu.details) edu.details.forEach(d => text += `• ${d}\n`);
        text += '\n';
      });
    }
    
    if (structured.certifications && structured.certifications.length > 0) {
      text += `CERTIFICATIONS\n\n`;
      structured.certifications.forEach(cert => text += `${cert.name} | ${cert.issuer} | ${cert.date}\n`);
      text += '\n';
    }
    
    if (structured.skills && structured.skills.length > 0) {
      text += `SKILLS\n\n`;
      structured.skills.forEach(sg => text += `${sg.category}: ${sg.items.join(', ')}\n`);
      text += '\n';
    }
    
    if (structured.references) {
      text += `REFERENCES\n${structured.references}\n`;
    }
    
    return text;
  };//FALTABA

  const optimizeContent = async () => {
    console.log('=== optimizeContent function called ===');
    console.log('👤 User object:', user);
    console.log('👤 User ID:', user?.uid);
    console.log('👤 User email:', user?.email);
    console.log('👤 Payment status:', user?.paymentStatus);

    if (!user) {
      console.log('❌ No user - showing login modal');
      setShowLoginModal(true);
      return;
    }

    if (!jobDescription || !resumeText) {
      console.log('❌ Missing job description or resume text');
      console.log('❌ jobDescription length:', jobDescription?.length || 0);
      console.log('❌ resumeText length:', resumeText?.length || 0);
      setError('Please provide both job description and resume.');
      return;
    }

    console.log('✅ Starting optimization process...');
    console.log('📝 Resume text length:', resumeText.length);
    console.log('📝 Job description length:', jobDescription.length);

    // Validation check before API call
    if (resumeText.length < 50) {
      console.log('❌ Resume text too short:', resumeText.length, 'characters');
      setError('Resume text is too short. Please provide a complete resume (at least 50 characters).');
      return;
    }

    if (jobDescription.length < 50) {
      console.log('❌ Job description too short:', jobDescription.length, 'characters');
      setError('Job description is too short. Please provide a complete job description (at least 50 characters).');
      return;
    }

    // NOW ASYNC - Wait for database check
    console.log('🔍 Checking if user can optimize...');
    const optCheck = await canUserOptimize(user?.uid, user?.paymentStatus || 'free', 0);
    console.log('🔍 canUserOptimize result:', optCheck);
    if (!optCheck.canOptimize) {
      setError(optCheck.message);
      setShowStripeCheckout(true);
      return;
    }

    setLoadingOptimize(true);
    setError('');

    try {
      console.log('📡 Calling /api/optimize...');
      console.log('📡 Sending resumeInput length:', resumeText.length);
      console.log('📡 Sending jobDescription length:', jobDescription.length);
      console.log('🌐 Current language:', i18n.language);
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeInput: resumeText,
          jobDescription: jobDescription,
          language: i18n.language
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        // Show specific validation error if available
        const errorMessage = data.details || data.error || 'Failed to optimize resume';
        console.error('❌ API Error:', errorMessage);
        console.error('❌ Full error response:', data);
        throw new Error(errorMessage);
      }

      console.log('✅ API call successful, setting state...');
      setStructuredResume(data);
      setOptimizedContent(JSON.stringify(data, null, 2));
      setPhase('optimize');
      setIsUploadComplete(true);

      // NOW ASYNC - Wait for database write
      const tokensUsed = data.tokensUsed || 5000;
      console.log('💾 About to call recordOptimization with userId:', user?.uid, 'tokensUsed:', tokensUsed);
      const recordResult = await recordOptimization(user?.uid, tokensUsed);
      console.log('💾 recordOptimization completed. Result:', recordResult);
      
    } catch (error) {
      console.error('ERROR caught:', error);
      setError(`Error: ${error.message}`);
      setIsUploadComplete(false);
    } finally {
      setLoadingOptimize(false);
    }
  };
    
  // FIXED: Calls your backend instead of Anthropic directly
  const getSuggestions = async () => {
      console.log('getSuggestions called!');
      setLoadingSuggestions(true);
      setError('');
      
      try {
        const resumeData = JSON.stringify(structuredResume);
        console.log('Sending resumeText:', resumeData.substring(0, 100) + '...');
        console.log('🌐 Current language:', i18n.language);

        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: resumeData,
            language: i18n.language
          })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch suggestions');
        }
        
        setSuggestions(data.suggestions || []);
      } catch (error) {
        console.error('getSuggestions error:', error);
        setError('Failed to get suggestions: ' + error.message);
      } finally {
        setLoadingSuggestions(false);
      }
    };

  // FIXED: Calls your backend
  const findGaps = async () => {
      console.log('findGaps called!');
      setLoadingGaps(true);
      setError('');
      
      try {
        const resumeData = JSON.stringify(structuredResume);
        console.log('Sending resumeText:', resumeData.substring(0, 100) + '...');
        console.log('Sending jobDescription:', jobDescription.substring(0, 100) + '...');
        console.log('🌐 Current language:', i18n.language);

        const response = await fetch('/api/gaps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: resumeData,
            jobDescription: jobDescription,
            language: i18n.language
          })
        });
        
        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze gaps');
        }
        
        setGaps(data.gaps || []);
      } catch (error) {
        console.error('findGaps error:', error);
        setError('Failed to analyze gaps: ' + error.message);
      } finally {
        setLoadingGaps(false);
      }
    };

  const startEdit = (section, data) => {
    setEditingSection(section);
    setEditData(JSON.parse(JSON.stringify(data)));
  };//FALTABA

  const cancelEdit = () => {
    setEditingSection(null);
    setEditData(null);
  };//FALTABA

  const saveEdit = (section) => {
    const updated = {...structuredResume};
    
    if (section === 'contact') updated.contact = editData;
    else if (section === 'summary') updated.professionalSummary = editData;
    else if (section.startsWith('experience-')) updated.experience[parseInt(section.split('-')[1])] = editData;
    else if (section.startsWith('education-')) updated.education[parseInt(section.split('-')[1])] = editData;
    else if (section.startsWith('skills-')) updated.skills[parseInt(section.split('-')[1])] = editData;
    else if (section.startsWith('certification-')) updated.certifications[parseInt(section.split('-')[1])] = editData;
    
    setStructuredResume(updated);
    setOptimizedContent(convertStructuredToText(updated));
    setEditingSection(null);
    setEditData(null);
  };//FALTABA

  const deleteItem = (section, index) => {
    const updated = {...structuredResume};
    if (section === 'experience') updated.experience.splice(index, 1);
    else if (section === 'education') updated.education.splice(index, 1);
    else if (section === 'certifications') updated.certifications.splice(index, 1);
    else if (section === 'skills') updated.skills.splice(index, 1);
    setStructuredResume(updated);
    setOptimizedContent(convertStructuredToText(updated));
  };//FALTABA

  const addNewItem = (section) => {
    const updated = {...structuredResume};
    if (section === 'experience') updated.experience.push({title:'',company:'',location:'',startDate:'',endDate:'',bullets:['']});
    else if (section === 'education') updated.education.push({degree:'',institution:'',location:'',date:'',details:[]});
    else if (section === 'certifications') updated.certifications.push({name:'',issuer:'',date:''});
    else if (section === 'skills') updated.skills.push({category:'',items:[]});
    setStructuredResume(updated);
  };//FALTABA

  const handleAddGap = (gapIndex) => {
    if (structuredResume.experience && structuredResume.experience.length > 0) {
      setAddingGap(gapIndex);
      setShowPreview(false);
      setPreviewBullet('');
      setSelectedExperience('');
    }
  };

  const generatePreview = async () => {
    if (selectedExperience === '' || addingGap === null) return;
    setGeneratingBullet(true);
    try {
      const expIndex = parseInt(selectedExperience);
      const exp = structuredResume.experience[expIndex];
      
      const response = await fetch('/api/generate-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: exp.title,
          company: exp.company,
          requirement: gaps[addingGap].requirement,
          context: resumeText
        })
      });

      if (!response.ok) throw new Error('Backend failed');

      const data = await response.json();
      setPreviewBullet(data.bullet || '');
      setShowPreview(true); // Show the preview section
    } catch (error) {
      setError('Failed to generate preview');
    } finally {
      setGeneratingBullet(false);
    }
  };

  const addBulletToResume = () => {
    if (!previewBullet || selectedExperience === '') return;
    const updated = {...structuredResume};
    updated.experience[parseInt(selectedExperience)].bullets.push(previewBullet);
    setStructuredResume(updated);
    setOptimizedContent(convertStructuredToText(updated));
    setAddingGap(null);
    setSelectedExperience('');
    setPreviewBullet('');
    setShowPreview(false);
  };

  const style = {
    fontFamily: selectedFont.family,
    fontSize: `${fontSize}px`,
    lineHeight: lineHeight,
    primary: selectedColor.primary,
    accent: selectedColor.accent
  };

  const renderTemplate = () => {
    if (!structuredResume) return null;
    const props = { data: structuredResume, style, t };
    switch (selectedTemplate) {
      case 'classic': return <ClassicTemplate {...props} />;
      case 'modern': return <ModernTemplate {...props} />;
      case 'ats': return <ATSTemplate {...props} />;
      case 'executive': return <ExecutiveTemplate {...props} />;
      case 'creative': return <CreativeTemplate {...props} />;
      default: return <ModernTemplate {...props} />;
    }
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    const content = previewRef.current?.innerHTML || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${structuredResume?.contact?.name || 'Resume'}</title>
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
  <title>${structuredResume?.contact?.name || 'Resume'}</title>
  <style>body { font-family: ${selectedFont.family}; max-width: 800px; margin: 40px auto; padding: 20px; }</style>
</head>
<body>${content}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${structuredResume?.contact?.name || 'resume'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(structuredResume, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportJSON = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(structuredResume, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${structuredResume?.contact?.name || 'resume'}_optimized.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };



  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7" />
              <div>
                <h1 className="text-2xl font-bold">{t('app.title')}</h1>
                <p className="text-sm text-blue-100">{t('app.tagline')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {phase !== 'upload' && (
                <button
                  onClick={() => { 
                    setPhase('upload'); 
                    setStructuredResume({
                      contact: { name: '', email: '', phone: '', address: '', linkedin: '' },
                      professionalSummary: '',
                      experience: [],
                      education: [],
                      certifications: [],
                      skills: [],
                      references: ''
                    });
                    setSuggestions([]);
                    setGaps([]);
                  }}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('navigation.startOver')}
                </button>
              )}
             <LanguageSwitcher />
             <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* PHASE 1: UPLOAD */}
        {phase === 'upload' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Headers of the boxes */}
            <div className="flex items-center gap-3 mb-6">
                {/* Icon */}
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                {/* Text */}
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Step 1: Upload Your Information</h2>
                  <p className="text-sm text-gray-600">Provide your resume and the job description</p>
                </div>
                
                {/* Navigation */}
                <div className="ml-auto">
                  <PhaseNavigation
                    phase={phase}
                    setPhase={setPhase}
                    isUploadComplete={isUploadComplete}
                    t={t}
                    isFormatTriggered={isFormatTriggered}
                  />
                </div>
            </div>
            {/* Box for the inputs upload and job description Not the white rectangle*/}
            <div className="space-y-6">
              {/* Job Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description *</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Your Resume *</label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isExtractingFile 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeUpload}
                    disabled={isExtractingFile}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className={`cursor-pointer flex flex-col items-center gap-3 ${
                    isExtractingFile ? 'opacity-50' : ''
                  }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isExtractingFile 
                        ? 'bg-blue-200' 
                        : 'bg-blue-100'
                    }`}>
                      {isExtractingFile ? (
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-700">
                        {isExtractingFile 
                          ? 'Extracting text...' 
                          : resumeFile 
                            ? resumeFile.name 
                            : 'Upload Resume'
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {isExtractingFile 
                          ? 'Please wait while we extract your resume...' 
                          : 'Click to upload PDF, Word, or Text file'
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Supported: .pdf, .doc, .docx, .txt
                      </p>
                    </div>
                  </label>
                </div>

                {isExtractingFile && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                      <span className="font-medium">Extracting text from your resume...</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">This usually takes 5-10 seconds for PDFs</p>
                  </div>
                )}
                
                {resumeText && (
                  <button 
                    onClick={() => setShowResumePreview(!showResumePreview)} 
                    className="mt-2 text-xs text-blue-600 underline"
                  >
                    {showResumePreview ? 'Hide' : 'Preview'} extracted text
                  </button>
                )}
                
                {showResumePreview && resumeText && (
                  <div className="mt-2 p-3 bg-gray-50 border rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{resumeText.substring(0, 500)}...</p>
                  </div>
                )}
              </div>
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              
              {/* Optimization Status */}
              {user && (
                <div className={`p-4 rounded-lg border ${
                  user?.paymentStatus === 'free'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-green-50 border-green-200'
                }`}>
                  <p className="text-sm text-gray-600">Optimization status display coming soon...</p>
                  {/* TEMPORARILY DISABLED - Stats display needs async refactoring
                  {(() => {
                    const stats = getOptimizationStats(user?.uid, user?.paymentStatus || 'free');
                    return (
                      <>
                        <p className={`text-sm font-medium ${
                          user?.paymentStatus === 'free' ? 'text-blue-800' : 'text-green-800'
                        }`}>
                          Optimizations Used: <strong>{stats.used} / {stats.max}</strong>
                        </p>
                        <p className={`text-xs mt-1 ${
                          user?.paymentStatus === 'free' ? 'text-blue-700' : 'text-green-700'
                        }`}>
                          Tokens: <strong>{stats.tokensUsed.toLocaleString()} / {stats.tokensMax.toLocaleString()}</strong> ({stats.percentage}%)
                        </p>
                        {stats.remaining === 0 && ( 
                          <p className="text-xs text-red-600 mt-2 font-medium">
                            ⚠️ You've reached your optimization limit. Upgrade to continue.
                          </p>
                        )}
                      </>
                    );
                  })()}
                  */}
                </div>
              )}

              {/* Button to optimize resume */}
              <button
                onClick={optimizeContent}
                disabled={loadingOptimize || !jobDescription || !resumeText}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loadingOptimize ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    {t('optimize.title')}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    {t('buttons.optimize')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: OPTIMIZE (Gap Analysis & Suggestions) */}
        {phase === 'optimize' && (
          <div className="space-y-6">
            {/* UPDATE THIS LINE */}
            <PhaseNavigation
              phase={phase}
              setPhase={setPhase}
              isUploadComplete={true}
              t={t} 
              isFormatTriggered={isFormatTriggered} 
            />
            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid md:grid-cols-3 gap-3">
                <button 
                  onClick={getSuggestions} 
                  disabled={loadingSuggestions} 
                  className="bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {loadingSuggestions ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5" />
                      {t('buttons.getSuggestions')}
                    </>
                  )}
                </button>
                <button 
                  onClick={findGaps} 
                  disabled={loadingGaps} 
                  className="bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {loadingGaps ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      {t('buttons.findGaps')}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setIsFormatTriggered(true);
                    setPhase('format');
                  }} 
                  className="bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {t('buttons.formatExport')}
                </button>
              </div>
            </div>

            {/* Suggestions & Gaps */}
            {(suggestions.length > 0 || gaps.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Suggestions Panel */}
                {suggestions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Improvement Suggestions
                    </h3>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, i) => (
                        <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {renderTextWithBold(suggestion)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gap Analysis Panel */}
                {gaps.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      Missing Skills Analysis
                    </h3>
                    <div className="space-y-3">
                      {gaps.map((gap, i) => (
                        <div key={i} className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm font-semibold text-gray-800 mb-1">{gap.requirement}</p>
                          <p className="text-xs text-gray-600 mb-3">{gap.prompt}</p>
                          {structuredResume.experience?.length > 0 && (
                            <button 
                              onClick={() => handleAddGap(i)} 
                              className="text-xs bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              + Add to Resume
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resume Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Optimized Resume Content</h3>
              <div className="prose max-w-none">
                <div className="space-y-4">
                  {/* Contact */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    {editingSection === 'contact' ? (
                      <div className="space-y-3">
                        <input type="text" value={editData.name} onChange={(e)=>setEditData({...editData,name:e.target.value})} className="w-full p-2 border rounded text-xl font-bold" />
                        <div className="grid grid-cols-2 gap-3">
                          <input type="email" value={editData.email} onChange={(e)=>setEditData({...editData,email:e.target.value})} className="p-2 border rounded text-sm" />
                          <input type="text" value={editData.phone} onChange={(e)=>setEditData({...editData,phone:e.target.value})} className="p-2 border rounded text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>saveEdit('contact')} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Save</button>
                          <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <div>
                          <h2 className="text-2xl font-bold">{structuredResume.contact.name}</h2>
                          <p className="text-sm text-gray-600">{structuredResume.contact.email} | {structuredResume.contact.phone}</p>
                        </div>
                        <button onClick={()=>startEdit('contact',structuredResume.contact)} className="px-3 py-1 border rounded text-sm">Edit</button>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {structuredResume.professionalSummary && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold">Professional Summary</h3>
                        {editingSection !== 'summary' && (
                          <button onClick={()=>startEdit('summary',structuredResume.professionalSummary)} className="px-3 py-1 border rounded text-sm">Edit</button>
                        )}
                      </div>
                      {editingSection === 'summary' ? (
                        <div className="space-y-3">
                          <textarea value={editData} onChange={(e)=>setEditData(e.target.value)} className="w-full p-3 border rounded text-sm" rows="4" />
                          <div className="flex gap-2">
                            <button onClick={()=>saveEdit('summary')} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Save</button>
                            <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700">{structuredResume.professionalSummary}</p>
                      )}
                    </div>
                  )}

                  {/* Experience */}
                  {structuredResume.experience && structuredResume.experience.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Experience</h3>
                      {structuredResume.experience.map((exp,idx)=>(
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600">{idx+1}</div>
                            <div className="flex-1">
                              {editingSection === `experience-${idx}` ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={editData.title} onChange={(e)=>setEditData({...editData,title:e.target.value})} placeholder="Job Title" className="p-2 border rounded font-semibold" />
                                    <input type="text" value={editData.company} onChange={(e)=>setEditData({...editData,company:e.target.value})} placeholder="Company" className="p-2 border rounded" />
                                    <input type="text" value={editData.location} onChange={(e)=>setEditData({...editData,location:e.target.value})} placeholder="Location" className="p-2 border rounded text-sm" />
                                    <div className="flex gap-2">
                                      <input type="text" value={editData.startDate} onChange={(e)=>setEditData({...editData,startDate:e.target.value})} placeholder="Start" className="p-2 border rounded text-sm flex-1" />
                                      <input type="text" value={editData.endDate} onChange={(e)=>setEditData({...editData,endDate:e.target.value})} placeholder="End" className="p-2 border rounded text-sm flex-1" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Bullets:</label>
                                    {editData.bullets.map((bullet,bIdx)=>(
                                      <div key={bIdx} className="flex gap-2">
                                        <input type="text" value={bullet} onChange={(e)=>{const nb=[...editData.bullets];nb[bIdx]=e.target.value;setEditData({...editData,bullets:nb});}} className="flex-1 p-2 border rounded text-sm" />
                                        <button onClick={()=>{const nb=editData.bullets.filter((_,i)=>i!==bIdx);setEditData({...editData,bullets:nb});}} className="px-3 py-2 bg-red-100 text-red-600 rounded text-sm">✕</button>
                                      </div>
                                    ))}
                                    <button onClick={()=>setEditData({...editData,bullets:[...editData.bullets,'']})} className="px-3 py-1 bg-gray-100 rounded text-sm">+ Add Bullet</button>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={()=>saveEdit(`experience-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Save</button>
                                    <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <div>
                                      <h4 className="text-lg font-semibold">{exp.title} | {exp.company}</h4>
                                      <p className="text-sm text-gray-600">{exp.location} | {exp.startDate} - {exp.endDate}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button onClick={()=>startEdit(`experience-${idx}`,exp)} className="px-3 py-1 border rounded text-sm">Edit</button>
                                      <button onClick={()=>deleteItem('experience',idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">Delete</button>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-2">Job description</p>
                                    {exp.bullets.map((bullet,bIdx)=>(
                                      <p key={bIdx} className="text-sm text-gray-700">• {bullet}</p>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>addNewItem('experience')} className="px-4 py-2 bg-blue-500 text-white rounded">+ Add Experience</button>
                    </div>
                  )}

                  {/* Education */}
                  {structuredResume.education && structuredResume.education.length>0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Education</h3>
                      {structuredResume.education.map((edu,idx)=>(
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-lg font-semibold">{edu.degree} | {edu.institution}</h4>
                              <p className="text-sm text-gray-600">{edu.location} | {edu.date}</p>
                            </div>
                            <button onClick={()=>deleteItem('education',idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">Delete</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={()=>addNewItem('education')} className="px-4 py-2 bg-blue-500 text-white rounded">+ Add Education</button>
                    </div>
                  )}

                  {/* Certifications */}
                  {structuredResume.certifications && structuredResume.certifications.length>0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Certifications</h3>
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        {structuredResume.certifications.map((cert,idx)=>(
                          <div key={idx} className="pb-3 mb-3 border-b last:border-0 flex justify-between">
                            <div>
                              <p className="font-semibold">{cert.name}</p>
                              <p className="text-sm text-gray-600">{cert.issuer} | {cert.date}</p>
                            </div>
                            <button onClick={()=>deleteItem('certifications',idx)} className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs">Delete</button>
                          </div>
                        ))}
                      </div>
                      <button onClick={()=>addNewItem('certifications')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">+ Add Certification</button>
                    </div>
                  )}

                  {/* Skills */}
                  {structuredResume.skills && structuredResume.skills.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Skills</h3>
                      {structuredResume.skills.map((sg, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                          {editingSection === `skills-${idx}` ? (
                            <div className="space-y-3">
                              <input 
                                type="text" 
                                value={editData.category} 
                                onChange={(e) => setEditData({...editData, category: e.target.value})} 
                                placeholder="Category (e.g., Programming Languages)" 
                                className="w-full p-2 border rounded font-semibold" 
                              />
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Skills:</label>
                                {editData.items.map((item, iIdx) => (
                                  <div key={iIdx} className="flex gap-2">
                                    <input 
                                      type="text" 
                                      value={item} 
                                      onChange={(e) => {
                                        const newItems = [...editData.items];
                                        newItems[iIdx] = e.target.value;
                                        setEditData({...editData, items: newItems});
                                      }} 
                                      className="flex-1 p-2 border rounded text-sm" 
                                    />
                                    <button 
                                      onClick={() => {
                                        const newItems = editData.items.filter((_, i) => i !== iIdx);
                                        setEditData({...editData, items: newItems});
                                      }} 
                                      className="px-3 py-2 bg-red-100 text-red-600 rounded text-sm"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => setEditData({...editData, items: [...editData.items, '']})} 
                                  className="px-3 py-1 bg-gray-100 rounded text-sm"
                                >
                                  + Add Skill
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(`skills-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">Save</button>
                                <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm">
                                  <span className="font-semibold">{sg.category}:</span> {sg.items.join(', ')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(`skills-${idx}`, sg)} className="px-3 py-1 border rounded text-sm">Edit</button>
                                <button onClick={() => deleteItem('skills', idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addNewItem('skills')} className="px-4 py-2 bg-blue-500 text-white rounded">+ Add Skill Category</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: FORMAT (Template Selection & Export) */}
        {phase === 'format' && structuredResume.contact?.name && (
          <div className="space-y-6">
            {/* Navigation */}
            <PhaseNavigation
              phase={phase}
              setPhase={setPhase}
              isUploadComplete={isUploadComplete}
              t={t}
              isFormatTriggered={isFormatTriggered}
            />
            
            {/* Grid for the two panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Panel - Controls */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                        onClick={exportJSON} 
                        className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <span className="text-sm font-medium text-purple-700 block">JSON File</span>
                      </button>
                      <button 
                        onClick={copyJSON} 
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        ) : (
                          <Copy className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        )}
                        <span className="text-sm font-medium text-blue-700 block">
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
              </div> {/* Close Left Panel */}

              {/* Right Panel - Live Preview */}
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

        {/* Gap Addition Modal */}
        {addingGap !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-2">Add Missing Skill to Resume</h3>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm font-medium">Missing Skill:</p>
                <p className="text-base font-semibold mt-1">{gaps[addingGap]?.requirement}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select which experience to add this to:</label>
                <select 
                  value={selectedExperience} 
                  onChange={(e) => {
                    setSelectedExperience(e.target.value);
                    setShowPreview(false);
                    setPreviewBullet('');
                  }} 
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Choose an experience...</option>
                  {structuredResume.experience?.map((exp, i) => (
                    <option key={i} value={i}>{exp.title} | {exp.company}</option>
                  ))}
                </select>
              </div>

              {selectedExperience !== '' && !showPreview && (
                <button 
                  onClick={generatePreview} 
                  disabled={generatingBullet} 
                  className="w-full mb-4 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                  {generatingBullet ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Preview Bullet
                    </>
                  )}
                </button>
              )}

              {showPreview && (
                <div className="mb-4 space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">✓ Preview Bullet Point:</p>
                    <textarea 
                      value={previewBullet} 
                      onChange={(e) => setPreviewBullet(e.target.value)} 
                      className="w-full p-2 border rounded text-sm resize-none" 
                      rows="3" 
                    />
                    <p className="text-xs text-gray-600 mt-2">You can edit this before adding</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={generatePreview} 
                      disabled={generatingBullet} 
                      className="flex-1 py-2 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                    >
                      {generatingBullet ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : '🔄 Regenerate'}
                    </button>
                    <button 
                      onClick={addBulletToResume} 
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Add to Resume
                    </button>
                  </div>
                </div>
              )}

              <button 
                onClick={() => {
                  setAddingGap(null);
                  setSelectedExperience('');
                  setPreviewBullet('');
                  setShowPreview(false);
                }} 
                className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {/* Login Modal */}
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
        
        {/* Stripe Checkout Modal */}
        <StripeCheckout
          isOpen={showStripeCheckout}
          onClose={() => setShowStripeCheckout(false)}
        />

        {/* Payment Success Modal */}
        {showPaymentSuccess && (
          <PaymentSuccess
            sessionId={paymentSessionId}
            onClose={() => {
              setShowPaymentSuccess(false);
              // Optionally reload to refresh user stats
              window.location.reload();
            }}
          />
        )}

        {/* Payment Canceled Modal */}
        {showPaymentCanceled && (
          <PaymentCanceled
            onClose={() => setShowPaymentCanceled(false)}
          />
        )}
      </div>
    </div>
  );
}