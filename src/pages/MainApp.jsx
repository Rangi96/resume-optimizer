import React, { useState, useRef, useContext, useEffect } from 'react';
import { FileText, Download, Palette, Type, Layout, Printer, Code, Copy, Check, Wand2, Upload, Sparkles, ArrowRight, Loader2, Search, Lightbulb, AlertCircle, CheckCircle, Gauge, ChevronLeft, ChevronRight, Briefcase, Trash2, X, Mail } from 'lucide-react';
import * as mammoth from 'mammoth';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../AuthContext';
import LoginModal from '../components/LoginModal';
import StripeCheckout from '../components/StripeCheckout';
import PaymentSuccess from '../components/PaymentSuccess';
import PaymentCanceled from '../components/PaymentCanceled';
import UserMenu from '../components/UserMenu';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ReferralDashboard from '../components/ReferralDashboard';
import { canUserOptimize, recordOptimization, getOptimizationStats } from '../optimizationManager';
import storageAdapter from '../storageAdapter';
import CareerProfileEditor, { profileToText } from '../components/CareerProfileEditor';

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

// Section ordering: resumes carry an optional sectionOrder array of keys —
// 'experience' | 'education' | 'certifications' | 'skills' | 'custom-N'.
// Keys for sections that no longer exist are dropped; new sections are appended.
const CORE_SECTION_KEYS = ['experience', 'education', 'certifications', 'skills'];
const orderedSectionKeys = (data) => {
  const customKeys = (data.customSections || []).map((_, i) => `custom-${i}`);
  const valid = new Set([...CORE_SECTION_KEYS, ...customKeys]);
  const stored = Array.isArray(data.sectionOrder) ? data.sectionOrder.filter(k => valid.has(k)) : [];
  const missing = [...CORE_SECTION_KEYS, ...customKeys].filter(k => !stored.includes(k));
  return [...stored, ...missing];
};
const customIndexFromKey = (key) => parseInt(key.split('-')[1], 10);
const isVisibleCustomSection = (s) => s && (s.title || s.bullets?.some(Boolean));

const ClassicTemplate = ({ data, style, t }) => {
  const h2Style = { fontSize: '1.1em', fontWeight: 'bold', color: style.primary, borderBottom: `1px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '8px' };
  const renderers = {
    experience: () => data.experience?.length > 0 && (
      <div key="experience" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.experience') : 'Professional Experience'}</h2>
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
    ),
    education: () => data.education?.length > 0 && (
      <div key="education" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.education') : 'Education'}</h2>
        {data.education.map((edu, i) => (
          <div key={i} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <div><strong>{edu.degree}</strong> — {edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
            <span style={{ fontSize: '0.85em', color: '#555' }}>{edu.date}</span>
          </div>
        ))}
      </div>
    ),
    certifications: () => data.certifications?.length > 0 && (
      <div key="certifications" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.certifications') : 'Certifications'}</h2>
        {data.certifications.map((cert, i) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '0.9em' }}>
            <strong>{cert.name}</strong> — {cert.issuer} ({cert.date})
          </div>
        ))}
      </div>
    ),
    skills: () => data.skills?.length > 0 && (
      <div key="skills" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.skills') : 'Skills'}</h2>
        {data.skills.map((skill, i) => (
          <div key={i} style={{ marginBottom: '4px', fontSize: '0.9em' }}>
            <strong>{skill.category}:</strong> {skill.items?.join(', ')}
          </div>
        ))}
      </div>
    ),
  };
  const renderCustom = (key) => {
    const section = data.customSections?.[customIndexFromKey(key)];
    if (!isVisibleCustomSection(section)) return null;
    return (
      <div key={key} style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{section.title}</h2>
        <ul style={{ margin: '6px 0', paddingLeft: '18px', fontSize: '0.88em', listStyleType: 'disc' }}>
          {section.bullets?.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '3px' }}>{b}</li>)}
        </ul>
      </div>
    );
  };
  return (
    <div style={{ fontFamily: style.fontFamily, fontSize: style.fontSize, lineHeight: style.lineHeight, color: '#000' }}>
      <div style={{ textAlign: 'center', borderBottom: `2px solid ${style.primary}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.8em', fontWeight: 'bold', color: style.primary, margin: 0 }}>{data.contact?.name}</h1>
        <p style={{ fontSize: '0.9em', color: '#444', marginTop: '6px' }}>
          {[data.contact?.email, data.contact?.phone, data.contact?.linkedin].filter(Boolean).join(' | ')}
        </p>
      </div>
      {data.professionalSummary && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={h2Style}>{t ? t('templates:sections.professionalSummary') : 'Professional Summary'}</h2>
          <p style={{ textAlign: 'justify', fontSize: '0.9em' }}>{data.professionalSummary}</p>
        </div>
      )}
      {orderedSectionKeys(data).map(key => key.startsWith('custom-') ? renderCustom(key) : renderers[key]?.())}
    </div>
  );
};

const ModernTemplate = ({ data, style, t }) => {
  const h2 = (label) => (
    <h2 style={{ fontSize: '1.1em', fontWeight: '600', color: style.primary, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <span style={{ width: '24px', height: '2px', background: style.accent }}></span>{label}
    </h2>
  );
  const renderers = {
    experience: () => data.experience?.length > 0 && (
      <div key="experience" style={{ marginBottom: '18px' }}>
        {h2(t ? t('templates:sections.experience') : 'Experience')}
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
    ),
    education: () => data.education?.length > 0 && (
      <div key="education" style={{ marginBottom: '18px' }}>
        {h2(t ? t('templates:sections.education') : 'Education')}
        {data.education.map((edu, i) => (
          <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
            <strong>{edu.degree}</strong><br/>
            <span style={{ color: '#666' }}>{edu.institution} • {edu.date}</span>
          </div>
        ))}
      </div>
    ),
    certifications: () => data.certifications?.length > 0 && (
      <div key="certifications" style={{ marginBottom: '18px' }}>
        {h2(t ? t('templates:sections.certifications') : 'Certifications')}
        {data.certifications.map((cert, i) => (
          <div key={i} style={{ marginBottom: '6px', fontSize: '0.85em' }}>
            <strong>{cert.name}</strong><br/>
            <span style={{ color: '#666' }}>{cert.issuer} • {cert.date}</span>
          </div>
        ))}
      </div>
    ),
    skills: () => data.skills?.length > 0 && (
      <div key="skills" style={{ marginBottom: '18px' }}>
        {h2(t ? t('templates:sections.skills') : 'Skills')}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {data.skills.flatMap(s => s.items || []).map((item, i) => (
            <span key={i} style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '12px', fontSize: '0.8em', color: style.primary }}>{item}</span>
          ))}
        </div>
      </div>
    ),
  };
  const renderCustom = (key) => {
    const section = data.customSections?.[customIndexFromKey(key)];
    if (!isVisibleCustomSection(section)) return null;
    return (
      <div key={key} style={{ marginBottom: '18px' }}>
        {h2(section.title)}
        <ul style={{ margin: '6px 0', paddingLeft: '18px', fontSize: '0.85em', color: '#444', listStyleType: 'disc' }}>
          {section.bullets?.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '4px' }}>{b}</li>)}
        </ul>
      </div>
    );
  };
  return (
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
      {orderedSectionKeys(data).map(key => key.startsWith('custom-') ? renderCustom(key) : renderers[key]?.())}
    </div>
  );
};

const ATSTemplate = ({ data, style, t }) => {
  const h2Style = { fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase' };
  const renderers = {
    experience: () => data.experience?.length > 0 && (
      <div key="experience" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.experience') : 'Professional Experience'}</h2>
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
    ),
    education: () => data.education?.length > 0 && (
      <div key="education" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.education') : 'Education'}</h2>
        {data.education.map((edu, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>
            <strong>{edu.degree}</strong>, {edu.institution}{edu.location ? `, ${edu.location}` : ''} - {edu.date}
          </p>
        ))}
      </div>
    ),
    certifications: () => data.certifications?.length > 0 && (
      <div key="certifications" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.certifications') : 'Certifications'}</h2>
        {data.certifications.map((cert, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>{cert.name}, {cert.issuer}, {cert.date}</p>
        ))}
      </div>
    ),
    skills: () => data.skills?.length > 0 && (
      <div key="skills" style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{t ? t('templates:sections.skills') : 'Skills'}</h2>
        {data.skills.map((skill, i) => (
          <p key={i} style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}><strong>{skill.category}:</strong> {skill.items?.join(', ')}</p>
        ))}
      </div>
    ),
  };
  const renderCustom = (key) => {
    const section = data.customSections?.[customIndexFromKey(key)];
    if (!isVisibleCustomSection(section)) return null;
    return (
      <div key={key} style={{ marginBottom: '14px' }}>
        <h2 style={h2Style}>{section.title}</h2>
        <ul style={{ margin: '6px 0', paddingLeft: '20px', fontSize: '0.88em', listStyleType: 'disc' }}>
          {section.bullets?.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '3px' }}>{b}</li>)}
        </ul>
      </div>
    );
  };
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: style.fontSize, lineHeight: '1.5', color: '#000' }}>
      <div style={{ marginBottom: '12px' }}>
        <h1 style={{ fontSize: '1.6em', fontWeight: 'bold', margin: '0 0 4px 0' }}>{data.contact?.name}</h1>
        <p style={{ margin: 0, fontSize: '0.9em' }}>
          {[data.contact?.email, data.contact?.phone, data.contact?.address, data.contact?.linkedin].filter(Boolean).join(' • ')}
        </p>
      </div>
      {data.professionalSummary && (
        <div style={{ marginBottom: '14px' }}>
          <h2 style={{ ...h2Style, margin: '0 0 6px 0' }}>{t ? t('templates:sections.summary') : 'Summary'}</h2>
          <p style={{ margin: 0, fontSize: '0.9em' }}>{data.professionalSummary}</p>
        </div>
      )}
      {orderedSectionKeys(data).map(key => key.startsWith('custom-') ? renderCustom(key) : renderers[key]?.())}
    </div>
  );
};

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
        {/* Main column: experience + custom sections, in the user's chosen relative order */}
        {orderedSectionKeys(data).filter(k => k === 'experience' || k.startsWith('custom-')).map(key => {
          if (key === 'experience') {
            return data.experience?.length > 0 && (
              <div key="experience" style={{ marginBottom: '18px' }}>
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
            );
          }
          const section = data.customSections?.[customIndexFromKey(key)];
          if (!isVisibleCustomSection(section)) return null;
          return (
            <div key={key} style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.2em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '6px', marginBottom: '14px' }}>{section.title}</h2>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85em', color: '#444', listStyleType: 'disc' }}>
                {section.bullets?.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '4px' }}>{b}</li>)}
              </ul>
            </div>
          );
        })}
      </div>
      <div>
        {/* Sidebar: education, certifications, skills, in the user's chosen relative order */}
        {orderedSectionKeys(data).filter(k => ['education', 'certifications', 'skills'].includes(k)).map(key => {
          if (key === 'education') {
            return data.education?.length > 0 && (
              <div key="education" style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>{t ? t('templates:sections.education') : 'Education'}</h2>
                {data.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: '10px', fontSize: '0.85em' }}>
                    <strong style={{ color: style.primary }}>{edu.degree}</strong>
                    <p style={{ margin: '2px 0', color: '#555' }}>{edu.institution}</p>
                    <p style={{ margin: 0, color: '#777', fontSize: '0.9em' }}>{edu.date}</p>
                  </div>
                ))}
              </div>
            );
          }
          if (key === 'certifications') {
            return data.certifications?.length > 0 && (
              <div key="certifications" style={{ marginBottom: '18px' }}>
                <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>{t ? t('templates:sections.certifications') : 'Certifications'}</h2>
                {data.certifications.map((cert, i) => (
                  <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
                    <strong>{cert.name}</strong>
                    <p style={{ margin: '2px 0', color: '#666' }}>{cert.issuer} • {cert.date}</p>
                  </div>
                ))}
              </div>
            );
          }
          return data.skills?.length > 0 && (
            <div key="skills" style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1em', fontWeight: '700', color: style.primary, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: `2px solid ${style.accent}`, paddingBottom: '4px', marginBottom: '10px' }}>{t ? t('templates:sections.expertise') : 'Expertise'}</h2>
              {data.skills.map((skill, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '0.85em' }}>
                  <strong style={{ color: style.primary }}>{skill.category}</strong>
                  <p style={{ margin: '2px 0', color: '#555' }}>{skill.items?.join(' • ')}</p>
                </div>
              ))}
            </div>
          );
        })}
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
    {(() => {
      const renderers = {
        skills: () => data.skills?.length > 0 && (
          <div key="skills" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.1em', fontWeight: '700', color: style.primary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2em' }}>⚡</span> {t ? t('templates:sections.skills') : 'Skills'} & {t ? t('templates:sections.expertise') : 'Expertise'}
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.skills.flatMap(s => s.items || []).map((item, i) => (
                <span key={i} style={{ padding: '6px 14px', background: `linear-gradient(135deg, ${style.primary}, ${style.accent})`, color: 'white', borderRadius: '20px', fontSize: '0.8em', fontWeight: '500' }}>{item}</span>
              ))}
            </div>
          </div>
        ),
        experience: () => data.experience?.length > 0 && (
          <div key="experience" style={{ marginBottom: '20px' }}>
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
        ),
        education: () => data.education?.length > 0 && (
          <div key="education" style={{ marginBottom: '16px', padding: '14px', background: `${style.primary}08`, borderRadius: '10px' }}>
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
        ),
        certifications: () => data.certifications?.length > 0 && (
          <div key="certifications" style={{ marginBottom: '16px', padding: '14px', background: `${style.accent}08`, borderRadius: '10px' }}>
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
        ),
      };
      const renderCustom = (key) => {
        const section = data.customSections?.[customIndexFromKey(key)];
        if (!isVisibleCustomSection(section)) return null;
        return (
          <div key={key} style={{ marginBottom: '16px', padding: '14px', background: '#f8f9fa', borderRadius: '10px', borderLeft: `4px solid ${style.accent}` }}>
            <h2 style={{ fontSize: '1.1em', fontWeight: '700', color: style.primary, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2em' }}>✨</span> {section.title}
            </h2>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85em', color: '#444', listStyleType: 'disc' }}>
              {section.bullets?.filter(Boolean).map((b, j) => <li key={j} style={{ marginBottom: '4px' }}>{b}</li>)}
            </ul>
          </div>
        );
      };
      return orderedSectionKeys(data).map(key => key.startsWith('custom-') ? renderCustom(key) : renderers[key]?.());
    })()}
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
    customSections: [],
    sectionOrder: [],
    references: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [scoreResult, setScoreResult] = useState(null);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingGaps, setLoadingGaps] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [actionRailExpanded, setActionRailExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [activeRailTab, setActiveRailTab] = useState(null); // 'suggestions' | 'gaps' | 'score' | null

  // Application tracker
  const [showApplications, setShowApplications] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [showSaveApplication, setShowSaveApplication] = useState(false);
  const [saveCompany, setSaveCompany] = useState('');
  const [saveJobTitle, setSaveJobTitle] = useState('');
  const [savingApplication, setSavingApplication] = useState(false);
  const [applicationSaved, setApplicationSaved] = useState(false);
  const [confirmDeleteAppId, setConfirmDeleteAppId] = useState(null);
  const [applicationSearch, setApplicationSearch] = useState('');

  // Master career profile
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [resumeSource, setResumeSource] = useState('upload'); // 'upload' | 'profile'

  // Cover letter
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [coverTone, setCoverTone] = useState('professional');
  const [coverCompany, setCoverCompany] = useState('');
  const [coverInstructions, setCoverInstructions] = useState('');
  const [coverLetterText, setCoverLetterText] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [coverCopied, setCoverCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showStripeCheckout, setShowStripeCheckout] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentCanceled, setShowPaymentCanceled] = useState(false);
  const [paymentSessionId, setPaymentSessionId] = useState('');
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const { user } = useContext(AuthContext);
  const { t, i18n } = useTranslation(['common', 'templates', 'errors']);

  // Check for payment success/cancel and referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const canceled = params.get('canceled');
    const referralCode = params.get('ref');

    // Store referral code in localStorage BEFORE any OAuth redirect
    if (referralCode) {
      console.log('🔗 Referral code detected:', referralCode);
      localStorage.setItem('pending_referral', referralCode);
      // Clean URL to remove ref parameter (better UX)
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (sessionId) {
      setPaymentSessionId(sessionId);
      setShowPaymentSuccess(true);
      setRequiresPayment(false);
      setShowPaymentRequired(false);
      localStorage.removeItem('payment_intent');
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/app');
    } else if (canceled) {
      setShowPaymentCanceled(true);
      // If payment was required and they cancelled, redirect to landing
      const paymentWasRequired = requiresPayment || localStorage.getItem('payment_intent');
      localStorage.removeItem('payment_intent');
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/app');

      if (paymentWasRequired) {
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    }
  }, [requiresPayment]);

  // Check if user needs to pay (payment-first flow from landing page)
  useEffect(() => {
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const paymentRequired = params.get('payment_required') === 'true';
    const fromLanding = params.get('from') === 'landing';
    const paymentIntent = localStorage.getItem('payment_intent');

    // Check if user needs to pay
    const needsPayment = !user.paymentStatus ||
                         user.paymentStatus === 'free' ||
                         user.paymentStatus === 'unpaid';

    if ((paymentRequired || fromLanding || paymentIntent) && needsPayment) {
      setRequiresPayment(true);
      setShowStripeCheckout(true);
      setShowPaymentRequired(true);
      // Clean up
      localStorage.removeItem('payment_intent');
      window.history.replaceState({}, document.title, '/app');
    }
  }, [user]);

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
            setError(t('errors:textTooShort'));
          } else {
            setError(''); // Clear errors on success
          }
        } catch (error) {
          setError(t('errors:fileReadError'));
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
    
    const sectionEmitters = {
      experience: () => {
        if (!structured.experience || structured.experience.length === 0) return;
        text += `EXPERIENCE\n\n`;
        structured.experience.forEach(exp => {
          text += `${exp.title} | ${exp.company}\n${exp.location} | ${exp.startDate} - ${exp.endDate}\n`;
          exp.bullets.forEach(bullet => text += `• ${bullet}\n`);
          text += '\n';
        });
      },
      education: () => {
        if (!structured.education || structured.education.length === 0) return;
        text += `EDUCATION\n\n`;
        structured.education.forEach(edu => {
          text += `${edu.degree} | ${edu.institution}\n${edu.location} | ${edu.date}\n`;
          if (edu.details) edu.details.forEach(d => text += `• ${d}\n`);
          text += '\n';
        });
      },
      certifications: () => {
        if (!structured.certifications || structured.certifications.length === 0) return;
        text += `CERTIFICATIONS\n\n`;
        structured.certifications.forEach(cert => text += `${cert.name} | ${cert.issuer} | ${cert.date}\n`);
        text += '\n';
      },
      skills: () => {
        if (!structured.skills || structured.skills.length === 0) return;
        text += `SKILLS\n\n`;
        structured.skills.forEach(sg => text += `${sg.category}: ${sg.items.join(', ')}\n`);
        text += '\n';
      },
    };

    orderedSectionKeys(structured).forEach(key => {
      if (key.startsWith('custom-')) {
        const section = structured.customSections?.[customIndexFromKey(key)];
        if (!isVisibleCustomSection(section)) return;
        text += `${(section.title || '').toUpperCase()}\n\n`;
        (section.bullets || []).forEach(b => { if (b) text += `• ${b}\n`; });
        text += '\n';
      } else {
        sectionEmitters[key]?.();
      }
    });

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

    // Defensive check: user should never be null due to ProtectedRoute
    if (!user) {
      console.error('❌ CRITICAL: User should not be null in protected route');
      setError('Authentication error. Please refresh the page.');
      return;
    }

    if (!jobDescription || !resumeText) {
      console.log('❌ Missing job description or resume text');
      console.log('❌ jobDescription length:', jobDescription?.length || 0);
      console.log('❌ resumeText length:', resumeText?.length || 0);
      setError(t('errors:missingFields'));
      return;
    }

    console.log('✅ Starting optimization process...');
    console.log('📝 Resume text length:', resumeText.length);
    console.log('📝 Job description length:', jobDescription.length);

    // Validation check before API call
    if (resumeText.length < 50) {
      console.log('❌ Resume text too short:', resumeText.length, 'characters');
      setError(t('errors:resumeTooShort'));
      return;
    }

    if (jobDescription.length < 50) {
      console.log('❌ Job description too short:', jobDescription.length, 'characters');
      setError(t('errors:jobTooShort'));
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
          language: i18n.language,
          sourceType: resumeSource
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

  const computeCompatibilityScore = async () => {
    setLoadingScore(true);
    setError('');

    try {
      const optimizedText = convertStructuredToText(structuredResume);

      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalResume: resumeText,
          optimizedResume: optimizedText,
          jobDescription: jobDescription,
          language: i18n.language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to compute compatibility score');
      }

      setScoreResult({
        originalScore: data.originalScore,
        optimizedScore: data.optimizedScore,
        originalReason: data.originalReason,
        optimizedReason: data.optimizedReason
      });
    } catch (error) {
      console.error('computeCompatibilityScore error:', error);
      setError('Failed to compute compatibility score: ' + error.message);
    } finally {
      setLoadingScore(false);
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
    else if (section.startsWith('customSection-')) updated.customSections[parseInt(section.split('-')[1])] = editData;

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
    else if (section === 'customSections') {
      updated.customSections.splice(index, 1);
      // Renumber custom-N keys in sectionOrder so later sections keep their positions
      if (Array.isArray(updated.sectionOrder)) {
        updated.sectionOrder = updated.sectionOrder
          .filter(k => k !== `custom-${index}`)
          .map(k => {
            if (k.startsWith('custom-')) {
              const n = customIndexFromKey(k);
              if (n > index) return `custom-${n - 1}`;
            }
            return k;
          });
      }
    }
    setStructuredResume(updated);
    setOptimizedContent(convertStructuredToText(updated));
  };//FALTABA

  const moveSection = (key, dir) => {
    const order = orderedSectionKeys(structuredResume);
    const i = order.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    const updated = { ...structuredResume, sectionOrder: order };
    setStructuredResume(updated);
    setOptimizedContent(convertStructuredToText(updated));
  };

  // --- Application tracker ---
  const openApplications = async () => {
    setShowApplications(true);
    setConfirmDeleteAppId(null);
    setApplicationSearch('');
    setLoadingApplications(true);
    try {
      const apps = await storageAdapter.getApplications(user?.uid);
      setApplications(apps);
    } catch (error) {
      console.error('Failed to load applications:', error);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleSaveApplication = async () => {
    if (!saveCompany.trim() || !user?.uid) return;
    setSavingApplication(true);
    try {
      const application = {
        id: `app_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
        company: saveCompany.trim(),
        jobTitle: saveJobTitle.trim(),
        jobDescription,
        resume: JSON.parse(JSON.stringify(structuredResume)),
        createdAt: new Date().toISOString()
      };
      await storageAdapter.saveApplication(user.uid, application);
      setApplicationSaved(true);
      setTimeout(() => {
        setShowSaveApplication(false);
        setApplicationSaved(false);
        setSaveCompany('');
        setSaveJobTitle('');
      }, 1200);
    } catch (error) {
      console.error('Failed to save application:', error);
      setError(t('applications.saveError', { defaultValue: 'Could not save the application. Please try again.' }));
      setShowSaveApplication(false);
    } finally {
      setSavingApplication(false);
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    try {
      await storageAdapter.deleteApplication(user?.uid, applicationId);
      setApplications(prev => prev.filter(a => a.id !== applicationId));
    } catch (error) {
      console.error('Failed to delete application:', error);
    } finally {
      setConfirmDeleteAppId(null);
    }
  };

  const handleLoadApplication = (app) => {
    setStructuredResume(app.resume);
    setJobDescription(app.jobDescription || '');
    setResumeText(convertStructuredToText(app.resume));
    setOptimizedContent(convertStructuredToText(app.resume));
    setSuggestions([]);
    setGaps([]);
    setScoreResult(null);
    setIsUploadComplete(true);
    setPhase('optimize');
    setShowApplications(false);
  };

  // --- Cover letter ---
  const generateCoverLetter = async () => {
    setGeneratingCover(true);
    setCoverError('');
    try {
      const response = await fetch('/api/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: convertStructuredToText(structuredResume),
          jobDescription,
          company: coverCompany,
          tone: coverTone,
          instructions: coverInstructions,
          language: i18n.language
        })
      });
      const data = await response.json();
      if (!response.ok || !data.coverLetter) {
        throw new Error(data.error || 'Failed to generate cover letter');
      }
      setCoverLetterText(data.coverLetter);
    } catch (err) {
      console.error('Cover letter generation failed:', err);
      setCoverError(t('coverLetter.error', { defaultValue: 'Could not generate the cover letter. Please try again.' }));
    } finally {
      setGeneratingCover(false);
    }
  };

  const copyCoverLetter = async () => {
    try {
      await navigator.clipboard.writeText(coverLetterText);
      setCoverCopied(true);
      setTimeout(() => setCoverCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // --- Master career profile ---
  const openProfileEditor = () => setShowProfileEditor(true);

  const useMyProfile = async () => {
    setLoadingProfile(true);
    try {
      const profile = await storageAdapter.getMasterProfile(user?.uid);
      const profileText = profileToText(profile);
      if (profileText.trim().length < 50) {
        // Nothing usable stored yet — send the user to the editor first
        setLoadingProfile(false);
        openProfileEditor();
        return;
      }
      setResumeText(profileText);
      setResumeFile(null);
      setResumeSource('profile');
      setError('');
    } catch (error) {
      console.error('Failed to load master profile:', error);
      setError(t('profile.loadError', { defaultValue: 'Could not load your career profile. Please try again.' }));
    } finally {
      setLoadingProfile(false);
    }
  };

  const addNewItem = (section) => {
    const updated = {...structuredResume};
    if (section === 'experience') updated.experience.push({title:'',company:'',location:'',startDate:'',endDate:'',bullets:['']});
    else if (section === 'education') updated.education.push({degree:'',institution:'',location:'',date:'',details:[]});
    else if (section === 'certifications') updated.certifications.push({name:'',issuer:'',date:''});
    else if (section === 'skills') updated.skills.push({category:'',items:[]});
    else if (section === 'customSections') updated.customSections = [...(updated.customSections || []), {title:'',bullets:['']}];
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



  // Render payment required overlay if needed
  if (showPaymentRequired && requiresPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50">
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
                <LanguageSwitcher />
                {user && <UserMenu />}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-xl shadow-lg p-12">
            <Sparkles className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t('payment.required.title') || 'Complete Your Purchase'}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t('payment.required.message') || "You're one step away from optimizing your resume with AI"}
            </p>
          </div>
        </div>

        <StripeCheckout
          isOpen={showStripeCheckout}
          onClose={() => {
            setShowStripeCheckout(false);
            setShowPaymentRequired(false);
            window.location.href = '/';
          }}
        />
      </div>
    );
  }

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
                      customSections: [],
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
             {user && (
               <button
                 onClick={openProfileEditor}
                 className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
               >
                 <FileText className="w-4 h-4" />
                 {t('profile.title', { defaultValue: 'Career Profile' })}
               </button>
             )}
             {user && (
               <button
                 onClick={openApplications}
                 className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
               >
                 <Briefcase className="w-4 h-4" />
                 {t('applications.myApplications', { defaultValue: 'My Applications' })}
               </button>
             )}
             <LanguageSwitcher />
             {user && <UserMenu />}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Referral Dashboard - Only show when user is authenticated */}
        {user && (
          <div className="mb-6">
            <ReferralDashboard />
          </div>
        )}

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
                  <h2 className="text-xl font-bold text-gray-800">{t('upload.step1')}</h2>
                  <p className="text-sm text-gray-600">{t('upload.subtitle')}</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('upload.jobLabel')}</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={t('upload.jobPlaceholder')}
                  className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('upload.resumeLabel')}</label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isExtractingFile 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => { setResumeSource('upload'); handleResumeUpload(e); }}
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
                          ? t('upload.extracting')
                          : resumeFile
                            ? resumeFile.name
                            : t('upload.uploadButton')
                        }
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {isExtractingFile
                          ? t('upload.extractingMessage')
                          : t('upload.clickToUpload')
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {t('upload.supported')}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Career Profile as resume source */}
                {user && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="text-xs text-gray-400 uppercase">{t('profile.or', { defaultValue: 'or' })}</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                    {resumeSource === 'profile' ? (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-blue-800">{t('profile.usingProfile', { defaultValue: 'Using your Career Profile as the resume source' })}</p>
                            <p className="text-xs text-blue-600">{t('profile.usingProfileHint', { defaultValue: 'The AI will select the most relevant content for this job.' })}</p>
                          </div>
                        </div>
                        <button
                          onClick={openProfileEditor}
                          className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded text-sm hover:bg-blue-100 flex-shrink-0"
                        >
                          {t('buttons.edit')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={useMyProfile}
                        disabled={loadingProfile}
                        className="w-full p-4 border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
                      >
                        {loadingProfile ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <FileText className="w-5 h-5 text-blue-600" />}
                        <div className="text-left">
                          <p className="text-sm font-semibold text-blue-800">{t('profile.useProfile', { defaultValue: 'Use my Career Profile' })}</p>
                          <p className="text-xs text-blue-600">{t('profile.useProfileHint', { defaultValue: 'Your full career record; the AI picks what fits this job best.' })}</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}

                {isExtractingFile && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                      <span className="font-medium">{t('upload.extractingMessage')}</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">{t('upload.extractingTime')}</p>
                  </div>
                )}
                
                {resumeText && (
                  <button
                    onClick={() => setShowResumePreview(!showResumePreview)}
                    className="mt-2 text-xs text-blue-600 underline"
                  >
                    {showResumePreview ? t('buttons.hide') : t('buttons.preview')} {t('upload.extractedText')}
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
                  <p className="text-sm text-gray-600">{t('optimize.statusDisplay')}</p>
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
            {/* Action Rail (fixed; hover-to-open menu, click-pinned content) */}
            {(() => {
              const railOpen = actionRailExpanded || hoverExpanded;
              const hasResult = {
                suggestions: suggestions.length > 0,
                gaps: gaps.length > 0,
                score: !!scoreResult,
              };
              const tabs = [
                { key: 'suggestions', run: getSuggestions, loading: loadingSuggestions, disabled: loadingSuggestions, color: 'green', Icon: Lightbulb, label: t('buttons.getSuggestions') },
                { key: 'gaps', run: findGaps, loading: loadingGaps, disabled: loadingGaps, color: 'amber', Icon: Search, label: t('buttons.findGaps') },
                { key: 'score', run: computeCompatibilityScore, loading: loadingScore, disabled: loadingScore || !jobDescription || !resumeText, color: 'purple', Icon: Gauge, label: t('buttons.compatibilityScore') },
                { key: 'format', run: () => { setIsFormatTriggered(true); setPhase('format'); }, loading: false, disabled: false, color: 'blue', Icon: Sparkles, label: t('buttons.formatExport') },
                { key: 'cover', run: () => { setCoverError(''); setShowCoverLetter(true); }, loading: false, disabled: !jobDescription, color: 'rose', Icon: Mail, label: t('coverLetter.title', { defaultValue: 'Cover Letter' }) },
                { key: 'save', run: () => { setSaveCompany(''); setSaveJobTitle(''); setApplicationSaved(false); setShowSaveApplication(true); }, loading: false, disabled: !user, color: 'indigo', Icon: Briefcase, label: t('applications.save', { defaultValue: 'Save Application' }) },
              ];
              const colorMap = {
                green: 'bg-green-500 hover:bg-green-600',
                amber: 'bg-amber-500 hover:bg-amber-600',
                purple: 'bg-purple-500 hover:bg-purple-600',
                blue: 'bg-blue-500 hover:bg-blue-600',
                indigo: 'bg-indigo-500 hover:bg-indigo-600',
                rose: 'bg-rose-500 hover:bg-rose-600',
              };
              const handleTabClick = (tab) => {
                if (tab.key === 'format' || tab.key === 'save' || tab.key === 'cover') { tab.run(); return; }
                setActiveRailTab(tab.key);
                setActionRailExpanded(true);
                if (!hasResult[tab.key]) tab.run();
              };
              const showContent = actionRailExpanded && activeRailTab && hasResult[activeRailTab];
              const activeTab = tabs.find(t => t.key === activeRailTab);
              return (
                <div
                  className={`fixed left-4 top-24 z-30 bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-200 ${railOpen ? 'w-96' : 'w-14'}`}
                  style={{ maxHeight: 'calc(100vh - 7rem)' }}
                  onMouseEnter={() => setHoverExpanded(true)}
                  onMouseLeave={() => setHoverExpanded(false)}
                >
                  <button
                    onClick={() => setActionRailExpanded(v => !v)}
                    aria-label={actionRailExpanded ? 'Collapse actions' : 'Expand actions'}
                    className="w-full flex items-center justify-between px-3 py-2 text-gray-500 hover:bg-gray-50 border-b border-gray-100 flex-shrink-0"
                  >
                    {railOpen && <span className="text-xs font-semibold uppercase tracking-wide">{t('optimize.actions', { defaultValue: 'Actions' })}</span>}
                    {actionRailExpanded ? <ChevronLeft className="w-4 h-4 ml-auto" /> : <ChevronRight className="w-4 h-4 mx-auto" />}
                  </button>
                  <div className="p-2 flex-shrink-0 flex flex-col gap-2">
                    {tabs.map((tab) => {
                      const { key, loading, disabled, color, Icon, label } = tab;
                      const isActive = actionRailExpanded && activeRailTab === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleTabClick(tab)}
                          disabled={disabled}
                          aria-label={label}
                          className={`${colorMap[color]} text-white rounded-lg font-semibold disabled:bg-gray-300 flex items-center ${railOpen ? 'justify-start gap-2 px-3 h-10 w-full' : 'justify-center w-10 h-10 mx-auto'} ${isActive ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                        >
                          {loading ? <Loader2 className="animate-spin w-5 h-5 flex-shrink-0" /> : <Icon className="w-5 h-5 flex-shrink-0" />}
                          {railOpen && <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {showContent && (
                    <div className="flex-1 overflow-y-auto p-4 border-t border-gray-100">
                      {activeRailTab === 'score' && scoreResult && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <Gauge className="w-4 h-4 text-purple-600" />
                              {t('optimize.compatibilityTitle')}
                            </h3>
                            <button
                              onClick={() => activeTab.run()}
                              disabled={activeTab.disabled}
                              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 flex items-center gap-1"
                            >
                              {activeTab.loading ? <Loader2 className="animate-spin w-3 h-3" /> : null}
                              {t('buttons.regenerate')}
                            </button>
                          </div>
                          <div className="space-y-3">
                            {[
                              { label: t('optimize.originalResume'), score: scoreResult.originalScore, reason: scoreResult.originalReason },
                              { label: t('optimize.optimizedResume'), score: scoreResult.optimizedScore, reason: scoreResult.optimizedReason }
                            ].map((item, idx) => {
                              const c = item.score >= 80 ? 'green' : item.score >= 60 ? 'amber' : 'red';
                              const cc = {
                                green: { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
                                amber: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
                                red: { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
                              }[c];
                              return (
                                <div key={idx} className={`p-3 rounded-lg border ${cc.bg} ${cc.border}`}>
                                  <div className="flex justify-between items-baseline mb-1.5">
                                    <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                                    <span className={`text-xl font-bold ${cc.text}`}>{item.score}<span className="text-xs font-medium">/100</span></span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
                                    <div className={`h-1.5 rounded-full ${cc.bar}`} style={{ width: `${item.score}%` }} />
                                  </div>
                                  {item.reason && <p className="text-xs text-gray-600 leading-relaxed">{item.reason}</p>}
                                </div>
                              );
                            })}
                          </div>
                          {scoreResult.optimizedScore < 80 && (
                            <div className="mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-blue-800">{t('optimize.lowScoreRecommendation')}</p>
                            </div>
                          )}
                        </>
                      )}
                      {activeRailTab === 'suggestions' && suggestions.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {t('optimize.suggestions')}
                            </h3>
                            <button
                              onClick={() => activeTab.run()}
                              disabled={activeTab.disabled}
                              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 flex items-center gap-1"
                            >
                              {activeTab.loading ? <Loader2 className="animate-spin w-3 h-3" /> : null}
                              {t('buttons.regenerate')}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {suggestions.map((suggestion, i) => (
                              <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-gray-700 leading-relaxed">
                                  {renderTextWithBold(suggestion)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {activeRailTab === 'gaps' && gaps.length > 0 && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              {t('optimize.gaps')}
                            </h3>
                            <button
                              onClick={() => activeTab.run()}
                              disabled={activeTab.disabled}
                              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 flex items-center gap-1"
                            >
                              {activeTab.loading ? <Loader2 className="animate-spin w-3 h-3" /> : null}
                              {t('buttons.regenerate')}
                            </button>
                          </div>
                          <div className="space-y-2">
                            {gaps.map((gap, i) => (
                              <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-xs font-semibold text-gray-800 mb-1">{gap.requirement}</p>
                                <p className="text-xs text-gray-600 mb-2">{gap.prompt}</p>
                                {structuredResume.experience?.length > 0 && (
                                  <button
                                    onClick={() => handleAddGap(i)}
                                    className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                                  >
                                    + Add to Resume
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Resume Preview */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t('optimize.optimizedContent')}</h3>
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
                        <h3 className="text-lg font-semibold">{t('optimize.sections.professionalSummary')}</h3>
                        {editingSection !== 'summary' && (
                          <button onClick={()=>startEdit('summary',structuredResume.professionalSummary)} className="px-3 py-1 border rounded text-sm">{t('buttons.edit')}</button>
                        )}
                      </div>
                      {editingSection === 'summary' ? (
                        <div className="space-y-3">
                          <textarea value={editData} onChange={(e)=>setEditData(e.target.value)} className="w-full p-3 border rounded text-sm" rows="4" />
                          <div className="flex gap-2">
                            <button onClick={()=>saveEdit('summary')} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">{t('buttons.save')}</button>
                            <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">{t('buttons.cancel')}</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700">{structuredResume.professionalSummary}</p>
                      )}
                    </div>
                  )}

                  {/* Sections render in user-controlled order (structuredResume.sectionOrder); ↑/↓ buttons reorder */}
                  {(() => {
                  const order = orderedSectionKeys(structuredResume);
                  const moveButtons = (key) => (
                    <span className="inline-flex gap-1">
                      <button onClick={() => moveSection(key, -1)} disabled={order.indexOf(key) === 0} title={t('buttons.moveUp', { defaultValue: 'Move section up' })} className="px-2 py-0.5 border rounded text-sm disabled:opacity-30 hover:bg-gray-50">↑</button>
                      <button onClick={() => moveSection(key, 1)} disabled={order.indexOf(key) === order.length - 1} title={t('buttons.moveDown', { defaultValue: 'Move section down' })} className="px-2 py-0.5 border rounded text-sm disabled:opacity-30 hover:bg-gray-50">↓</button>
                    </span>
                  );
                  const sectionBlocks = {};
                  sectionBlocks.experience = structuredResume.experience && structuredResume.experience.length > 0 && (
                    <div key="experience">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold">{t('optimize.sections.experience')}</h3>
                        {moveButtons('experience')}
                      </div>
                      {structuredResume.experience.map((exp,idx)=>(
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600">{idx+1}</div>
                            <div className="flex-1">
                              {editingSection === `experience-${idx}` ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <input type="text" value={editData.title} onChange={(e)=>setEditData({...editData,title:e.target.value})} placeholder={t('optimize.labels.jobTitle')} className="p-2 border rounded font-semibold" />
                                    <input type="text" value={editData.company} onChange={(e)=>setEditData({...editData,company:e.target.value})} placeholder={t('optimize.labels.company')} className="p-2 border rounded" />
                                    <input type="text" value={editData.location} onChange={(e)=>setEditData({...editData,location:e.target.value})} placeholder={t('optimize.labels.location')} className="p-2 border rounded text-sm" />
                                    <div className="flex gap-2">
                                      <input type="text" value={editData.startDate} onChange={(e)=>setEditData({...editData,startDate:e.target.value})} placeholder={t('optimize.labels.start')} className="p-2 border rounded text-sm flex-1" />
                                      <input type="text" value={editData.endDate} onChange={(e)=>setEditData({...editData,endDate:e.target.value})} placeholder={t('optimize.labels.end')} className="p-2 border rounded text-sm flex-1" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">{t('optimize.labels.bullets')}</label>
                                    {editData.bullets.map((bullet,bIdx)=>(
                                      <div key={bIdx} className="flex gap-2">
                                        <input type="text" value={bullet} onChange={(e)=>{const nb=[...editData.bullets];nb[bIdx]=e.target.value;setEditData({...editData,bullets:nb});}} className="flex-1 p-2 border rounded text-sm" />
                                        <button onClick={()=>{const nb=editData.bullets.filter((_,i)=>i!==bIdx);setEditData({...editData,bullets:nb});}} className="px-3 py-2 bg-red-100 text-red-600 rounded text-sm">✕</button>
                                      </div>
                                    ))}
                                    <button onClick={()=>setEditData({...editData,bullets:[...editData.bullets,'']})} className="px-3 py-1 bg-gray-100 rounded text-sm">{t('buttons.addBullet')}</button>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={()=>saveEdit(`experience-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">{t('buttons.save')}</button>
                                    <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">{t('buttons.cancel')}</button>
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
                                      <button onClick={()=>startEdit(`experience-${idx}`,exp)} className="px-3 py-1 border rounded text-sm">{t('buttons.edit')}</button>
                                      <button onClick={()=>deleteItem('experience',idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">{t('buttons.delete')}</button>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-2">{t('optimize.labels.jobDescription')}</p>
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
                      <button onClick={()=>addNewItem('experience')} className="px-4 py-2 bg-blue-500 text-white rounded">{t('buttons.addExperience')}</button>
                    </div>
                  );

                  sectionBlocks.education = structuredResume.education && structuredResume.education.length>0 && (
                    <div key="education">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold">{t('optimize.sections.education')}</h3>
                        {moveButtons('education')}
                      </div>
                      {structuredResume.education.map((edu,idx)=>(
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                          {editingSection === `education-${idx}` ? (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <input type="text" value={editData.degree} onChange={(e)=>setEditData({...editData,degree:e.target.value})} placeholder={t('optimize.labels.degree')} className="p-2 border rounded font-semibold" />
                                <input type="text" value={editData.institution} onChange={(e)=>setEditData({...editData,institution:e.target.value})} placeholder={t('optimize.labels.institution')} className="p-2 border rounded" />
                                <input type="text" value={editData.location} onChange={(e)=>setEditData({...editData,location:e.target.value})} placeholder={t('optimize.labels.location')} className="p-2 border rounded text-sm" />
                                <input type="text" value={editData.date} onChange={(e)=>setEditData({...editData,date:e.target.value})} placeholder={t('optimize.labels.date')} className="p-2 border rounded text-sm" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={()=>saveEdit(`education-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">{t('buttons.save')}</button>
                                <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">{t('buttons.cancel')}</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between">
                              <div>
                                <h4 className="text-lg font-semibold">{edu.degree} | {edu.institution}</h4>
                                <p className="text-sm text-gray-600">{edu.location} | {edu.date}</p>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={()=>startEdit(`education-${idx}`,edu)} className="px-3 py-1 border rounded text-sm">{t('buttons.edit')}</button>
                                <button onClick={()=>deleteItem('education',idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">{t('buttons.delete')}</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <button onClick={()=>addNewItem('education')} className="px-4 py-2 bg-blue-500 text-white rounded">{t('buttons.addEducation')}</button>
                    </div>
                  );

                  sectionBlocks.certifications = structuredResume.certifications && structuredResume.certifications.length>0 && (
                    <div key="certifications">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold">{t('optimize.sections.certifications')}</h3>
                        {moveButtons('certifications')}
                      </div>
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        {structuredResume.certifications.map((cert,idx)=>(
                          <div key={idx} className="pb-3 mb-3 border-b last:border-0">
                            {editingSection === `certification-${idx}` ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <input type="text" value={editData.name} onChange={(e)=>setEditData({...editData,name:e.target.value})} placeholder={t('optimize.labels.certName')} className="p-2 border rounded font-semibold" />
                                  <input type="text" value={editData.issuer} onChange={(e)=>setEditData({...editData,issuer:e.target.value})} placeholder={t('optimize.labels.issuer')} className="p-2 border rounded" />
                                  <input type="text" value={editData.date} onChange={(e)=>setEditData({...editData,date:e.target.value})} placeholder={t('optimize.labels.date')} className="p-2 border rounded text-sm" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={()=>saveEdit(`certification-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">{t('buttons.save')}</button>
                                  <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">{t('buttons.cancel')}</button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between">
                                <div>
                                  <p className="font-semibold">{cert.name}</p>
                                  <p className="text-sm text-gray-600">{cert.issuer} | {cert.date}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={()=>startEdit(`certification-${idx}`,cert)} className="px-2 py-1 border rounded text-xs">{t('buttons.edit')}</button>
                                  <button onClick={()=>deleteItem('certifications',idx)} className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs">{t('buttons.delete')}</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={()=>addNewItem('certifications')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">{t('buttons.addCertification')}</button>
                    </div>
                  );

                  sectionBlocks.skills = structuredResume.skills && structuredResume.skills.length > 0 && (
                    <div key="skills">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-bold">{t('optimize.sections.skills')}</h3>
                        {moveButtons('skills')}
                      </div>
                      {structuredResume.skills.map((sg, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-4">
                          {editingSection === `skills-${idx}` ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editData.category}
                                onChange={(e) => setEditData({...editData, category: e.target.value})}
                                placeholder={t('optimize.labels.category')}
                                className="w-full p-2 border rounded font-semibold"
                              />
                              <div className="space-y-2">
                                <label className="text-sm font-medium">{t('optimize.labels.skillsLabel')}</label>
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
                                  {t('buttons.addSkill')}
                                </button>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => saveEdit(`skills-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">{t('buttons.save')}</button>
                                <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">{t('buttons.cancel')}</button>
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
                                <button onClick={() => startEdit(`skills-${idx}`, sg)} className="px-3 py-1 border rounded text-sm">{t('buttons.edit')}</button>
                                <button onClick={() => deleteItem('skills', idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">{t('buttons.delete')}</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      <button onClick={() => addNewItem('skills')} className="px-4 py-2 bg-blue-500 text-white rounded">{t('buttons.addSkillCategory')}</button>
                    </div>
                  );

                  const customBlock = (key) => {
                    const idx = customIndexFromKey(key);
                    const section = structuredResume.customSections?.[idx];
                    if (!section) return null;
                    return (
                      <div key={key}>
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold">{section.title || t('optimize.labels.untitledSection')}</h3>
                          {moveButtons(key)}
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                        {editingSection === `customSection-${idx}` ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editData.title}
                              onChange={(e) => setEditData({...editData, title: e.target.value})}
                              placeholder={t('optimize.labels.sectionTitle')}
                              className="w-full p-2 border rounded font-semibold"
                            />
                            <div className="space-y-2">
                              <label className="text-sm font-medium">{t('optimize.labels.bullets')}</label>
                              {editData.bullets.map((bullet, bIdx) => (
                                <div key={bIdx} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={bullet}
                                    onChange={(e) => {
                                      const nb = [...editData.bullets];
                                      nb[bIdx] = e.target.value;
                                      setEditData({...editData, bullets: nb});
                                    }}
                                    className="flex-1 p-2 border rounded text-sm"
                                  />
                                  <button
                                    onClick={() => {
                                      const nb = editData.bullets.filter((_, i) => i !== bIdx);
                                      setEditData({...editData, bullets: nb});
                                    }}
                                    className="px-3 py-2 bg-red-100 text-red-600 rounded text-sm"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => setEditData({...editData, bullets: [...editData.bullets, '']})}
                                className="px-3 py-1 bg-gray-100 rounded text-sm"
                              >
                                {t('buttons.addBullet')}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => saveEdit(`customSection-${idx}`)} className="px-4 py-2 bg-blue-500 text-white rounded text-sm">{t('buttons.save')}</button>
                              <button onClick={cancelEdit} className="px-4 py-2 bg-gray-200 rounded text-sm">{t('buttons.cancel')}</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => startEdit(`customSection-${idx}`, section)} className="px-3 py-1 border rounded text-sm">{t('buttons.edit')}</button>
                              <button onClick={() => deleteItem('customSections', idx)} className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm">{t('buttons.delete')}</button>
                            </div>
                            {section.bullets && section.bullets.length > 0 && (
                              <div className="mt-3">
                                {section.bullets.map((bullet, bIdx) => (
                                  bullet ? <p key={bIdx} className="text-sm text-gray-700">• {bullet}</p> : null
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <>
                      {order.map(key => key.startsWith('custom-') ? customBlock(key) : sectionBlocks[key])}
                      <div>
                        <button onClick={() => addNewItem('customSections')} className="px-4 py-2 bg-blue-500 text-white rounded">{t('buttons.addCustomSection')}</button>
                      </div>
                    </>
                  );
                  })()}
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
                      {t(`format.tabs.${tab}`)}
                    </button>
                  ))}
                </div>

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                  <div className="p-4">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                      <Layout className="w-4 h-4" /> {t('format.chooseTemplate')}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      {templates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedTemplate === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl mb-2 block">{template.icon}</span>
                          <span className="font-semibold text-gray-800 block">{t(`templates:templates.${template.id}.name`)}</span>
                          <span className="text-xs text-gray-500">{t(`templates:templates.${template.id}.description`)}</span>
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
                        <Type className="w-4 h-4" /> {t('format.fontFamily')}
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
                            {t(`templates:fonts.${f.id}`)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4" /> {t('format.colorScheme')}
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
                            <span className="text-xs">{t(`templates:colors.${c.id}`)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">{t('format.fontSize')}: {fontSize}px</h3>
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
                      <h3 className="font-medium text-gray-700 mb-3">{t('format.lineHeight')}: {lineHeight}</h3>
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
                      <Download className="w-4 h-4" /> {t('format.exportOptions')}
                    </h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={exportPDF}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Printer className="w-5 h-5 text-red-600 mx-auto mb-1" />
                        <span className="text-sm font-medium text-red-700 block">{t('export.printPDF')}</span>
                      </button>
                      <button
                        onClick={exportHTML}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        <Code className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                        <span className="text-sm font-medium text-orange-700 block">{t('export.htmlFile')}</span>
                      </button>
                      <button
                        onClick={exportJSON}
                        className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <span className="text-sm font-medium text-purple-700 block">{t('export.jsonFile')}</span>
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
                          {copied ? t('export.copied') : t('export.copyJSON')}
                        </span>
                      </button>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {t('export.tip')}
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

        {/* Career Profile Editor Modal */}
        {showProfileEditor && (
          <CareerProfileEditor
            userId={user?.uid}
            onClose={() => setShowProfileEditor(false)}
            onSaved={(profile) => {
              // Keep the active resume text in sync when the profile is the current source
              if (resumeSource === 'profile') setResumeText(profileToText(profile));
            }}
          />
        )}

        {/* Cover Letter Modal */}
        {showCoverLetter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  {t('coverLetter.title', { defaultValue: 'Cover Letter' })}
                </h3>
                <button onClick={() => setShowCoverLetter(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              {coverLetterText ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">{t('coverLetter.resultHint', { defaultValue: 'Review and edit freely; make sure every claim is truly yours before sending.' })}</p>
                  <textarea
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    className="flex-1 w-full p-4 border rounded-lg text-sm resize-none min-h-[45vh] leading-relaxed"
                  />
                  {coverError && <p className="text-xs text-red-600 mt-2">{coverError}</p>}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={copyCoverLetter}
                      className="px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600"
                    >
                      {coverCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {coverCopied ? t('coverLetter.copied', { defaultValue: 'Copied!' }) : t('buttons.copy')}
                    </button>
                    <button
                      onClick={generateCoverLetter}
                      disabled={generatingCover}
                      className="px-5 py-2.5 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50 flex items-center gap-2"
                    >
                      {generatingCover ? <Loader2 className="animate-spin w-4 h-4" /> : null}
                      {t('buttons.regenerate')}
                    </button>
                    <button
                      onClick={() => setCoverLetterText('')}
                      className="px-5 py-2.5 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 ml-auto"
                    >
                      {t('coverLetter.back', { defaultValue: 'Options' })}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <p className="text-sm text-gray-600 mb-4">{t('coverLetter.description', { defaultValue: 'Built from your optimized resume and this job description. Pick a tone, add any instructions, and generate.' })}</p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">{t('coverLetter.companyLabel', { defaultValue: 'Company name (optional)' })}</label>
                    <input
                      type="text"
                      value={coverCompany}
                      onChange={(e) => setCoverCompany(e.target.value)}
                      placeholder={t('applications.companyPlaceholder', { defaultValue: 'e.g. Acme Corp' })}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">{t('coverLetter.toneLabel', { defaultValue: 'Tone' })}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['professional', 'enthusiastic', 'conversational', 'formal'].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setCoverTone(tone)}
                          className={`p-3 border rounded-lg text-left transition-colors ${coverTone === tone ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        >
                          <p className="text-sm font-semibold text-gray-800">{t(`coverLetter.tones.${tone}.name`)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t(`coverLetter.tones.${tone}.desc`)}</p>
                          <p className="text-xs text-gray-400 italic mt-1">"{t(`coverLetter.tones.${tone}.example`)}"</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">{t('coverLetter.instructionsLabel', { defaultValue: 'Instructions (optional)' })}</label>
                    <textarea
                      value={coverInstructions}
                      onChange={(e) => setCoverInstructions(e.target.value)}
                      placeholder={t('coverLetter.instructionsPlaceholder', { defaultValue: 'e.g. Keep it under 250 words. Mention I am available immediately. Explain that I am relocating to Miami. Do not mention my current employer by name.' })}
                      className="w-full p-3 border rounded-lg text-sm resize-y"
                      rows="3"
                    />
                  </div>
                  {coverError && <p className="text-xs text-red-600 mb-3">{coverError}</p>}
                  <button
                    onClick={generateCoverLetter}
                    disabled={generatingCover}
                    className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 flex items-center justify-center gap-2 hover:bg-blue-600"
                  >
                    {generatingCover ? (
                      <>
                        <Loader2 className="animate-spin w-5 h-5" />
                        {t('coverLetter.generating', { defaultValue: 'Writing your cover letter...' })}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        {t('coverLetter.generate', { defaultValue: 'Generate Cover Letter' })}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Application Modal */}
        {showSaveApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              {applicationSaved ? (
                <div className="py-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-lg font-semibold text-gray-800">{t('applications.saved', { defaultValue: 'Application saved!' })}</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      {t('applications.save', { defaultValue: 'Save Application' })}
                    </h3>
                    <button onClick={() => setShowSaveApplication(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{t('applications.saveDescription', { defaultValue: 'Store this resume and job description so you can look up exactly what you sent to each company.' })}</p>
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">{t('applications.companyLabel', { defaultValue: 'Company' })} *</label>
                    <input
                      type="text"
                      value={saveCompany}
                      onChange={(e) => setSaveCompany(e.target.value)}
                      placeholder={t('applications.companyPlaceholder', { defaultValue: 'e.g. Acme Corp' })}
                      className="w-full p-3 border rounded-lg"
                      autoFocus
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">{t('applications.jobTitleLabel', { defaultValue: 'Job title (optional)' })}</label>
                    <input
                      type="text"
                      value={saveJobTitle}
                      onChange={(e) => setSaveJobTitle(e.target.value)}
                      placeholder={t('applications.jobTitlePlaceholder', { defaultValue: 'e.g. Senior Data Analyst' })}
                      className="w-full p-3 border rounded-lg"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveApplication}
                      disabled={!saveCompany.trim() || savingApplication}
                      className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 flex items-center justify-center gap-2 hover:bg-blue-600"
                    >
                      {savingApplication ? <Loader2 className="animate-spin w-5 h-5" /> : t('buttons.save')}
                    </button>
                    <button onClick={() => setShowSaveApplication(false)} className="px-6 py-3 bg-gray-200 rounded-lg font-medium hover:bg-gray-300">{t('buttons.cancel')}</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* My Applications Modal */}
        {showApplications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  {t('applications.myApplications', { defaultValue: 'My Applications' })}
                </h3>
                <button onClick={() => setShowApplications(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              {!loadingApplications && applications.length > 0 && (
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={applicationSearch}
                    onChange={(e) => setApplicationSearch(e.target.value)}
                    placeholder={t('applications.searchPlaceholder', { defaultValue: 'Search by company or position...' })}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                {loadingApplications ? (
                  <div className="py-12 text-center"><Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto" /></div>
                ) : applications.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 text-sm px-6">
                    {t('applications.empty', { defaultValue: 'No saved applications yet. After optimizing a resume, use "Save Application" to keep a record of what you sent to each company.' })}
                  </div>
                ) : (() => {
                  const q = applicationSearch.trim().toLowerCase();
                  const filtered = q
                    ? applications.filter(a =>
                        (a.company || '').toLowerCase().includes(q) ||
                        (a.jobTitle || '').toLowerCase().includes(q))
                    : applications;
                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-gray-500 text-sm px-6">
                        {t('applications.noResults', { defaultValue: 'No applications match your search.' })}
                      </div>
                    );
                  }
                  return (
                  <div className="space-y-3">
                    {filtered.map((app) => (
                      <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between gap-4 hover:bg-gray-50">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{app.company}</p>
                          {app.jobTitle && <p className="text-sm text-gray-600 truncate">{app.jobTitle}</p>}
                          <p className="text-xs text-gray-400 mt-1">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {confirmDeleteAppId === app.id ? (
                            <>
                              <button
                                onClick={() => handleDeleteApplication(app.id)}
                                className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                              >
                                {t('applications.confirmDelete', { defaultValue: 'Delete?' })}
                              </button>
                              <button onClick={() => setConfirmDeleteAppId(null)} className="px-3 py-1.5 bg-gray-200 rounded text-sm hover:bg-gray-300">{t('buttons.cancel')}</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleLoadApplication(app)}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                              >
                                {t('applications.open', { defaultValue: 'Open' })}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteAppId(app.id)}
                                title={t('buttons.delete')}
                                className="px-2.5 py-1.5 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Gap Addition Modal */}
        {addingGap !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold mb-2">{t('modals.addSkill.title')}</h3>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                <p className="text-sm font-medium">{t('modals.addSkill.missingSkill')}</p>
                <p className="text-base font-semibold mt-1">{gaps[addingGap]?.requirement}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('modals.addSkill.selectExperience')}</label>
                <select
                  value={selectedExperience}
                  onChange={(e) => {
                    setSelectedExperience(e.target.value);
                    setShowPreview(false);
                    setPreviewBullet('');
                  }}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">{t('modals.addSkill.chooseExperience')}</option>
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
                      {t('modals.generateBullet.generating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {t('modals.generateBullet.title')}
                    </>
                  )}
                </button>
              )}

              {showPreview && (
                <div className="mb-4 space-y-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">{t('modals.generateBullet.preview')}</p>
                    <textarea 
                      value={previewBullet} 
                      onChange={(e) => setPreviewBullet(e.target.value)} 
                      className="w-full p-2 border rounded text-sm resize-none" 
                      rows="3" 
                    />
                    <p className="text-xs text-gray-600 mt-2">{t('modals.addSkill.editNote')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={generatePreview}
                      disabled={generatingBullet}
                      className="flex-1 py-2 border border-blue-500 text-blue-600 rounded-lg font-medium hover:bg-blue-50"
                    >
                      {generatingBullet ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : t('buttons.regenerate')}
                    </button>
                    <button
                      onClick={addBulletToResume}
                      className="flex-1 py-2 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('buttons.addToResume')}
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
                {t('buttons.cancel')}
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
            wasRequired={requiresPayment}
          />
        )}
      </div>
    </div>
  );
}