import React, { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, CheckCircle, X, Plus, Trash2, Upload, Mic, MicOff, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as mammoth from 'mammoth';
import storageAdapter from '../storageAdapter';

export const EMPTY_PROFILE = {
  contact: { name: '', email: '', phone: '', linkedin: '', location: '' },
  professionalSummary: '',
  experience: [],        // { title, company, location, startDate, endDate, details }
  education: [],         // { degree, institution, location, date, details }
  personalProjects: [],  // { name, period, link, details }
  courses: [],           // { name, provider, date, details }
  skills: [],            // { category, items } — items is a free-text string
  notes: ''
};

// Normalize whatever is stored (structured object, legacy free-text string, or nothing)
export const normalizeProfile = (stored) => {
  if (!stored) return JSON.parse(JSON.stringify(EMPTY_PROFILE));
  if (typeof stored === 'string') {
    return { ...JSON.parse(JSON.stringify(EMPTY_PROFILE)), notes: stored };
  }
  return {
    ...JSON.parse(JSON.stringify(EMPTY_PROFILE)),
    ...stored,
    contact: { ...EMPTY_PROFILE.contact, ...(stored.contact || {}) }
  };
};

// Serialize the structured profile into the text the optimize API consumes
export const profileToText = (stored) => {
  if (!stored) return '';
  if (typeof stored === 'string') return stored;
  const p = normalizeProfile(stored);
  let out = '';
  const c = p.contact;
  const contactLine = [c.name, c.email, c.phone, c.linkedin, c.location].filter(Boolean).join(' | ');
  if (contactLine) out += `CONTACT\n${contactLine}\n\n`;
  if (p.professionalSummary) out += `PROFESSIONAL SUMMARY\n${p.professionalSummary}\n\n`;
  if (p.experience.length) {
    out += 'WORK EXPERIENCE\n\n';
    p.experience.forEach(e => {
      out += [e.title, e.company].filter(Boolean).join(' | ') + '\n';
      const meta = [e.location, [e.startDate, e.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' | ');
      if (meta) out += meta + '\n';
      if (e.details) out += e.details + '\n';
      out += '\n';
    });
  }
  if (p.education.length) {
    out += 'EDUCATION\n\n';
    p.education.forEach(e => {
      out += [e.degree, e.institution, e.location, e.date].filter(Boolean).join(' | ') + '\n';
      if (e.details) out += e.details + '\n';
      out += '\n';
    });
  }
  if (p.personalProjects.length) {
    out += 'PERSONAL PROJECTS\n\n';
    p.personalProjects.forEach(pr => {
      out += [pr.name, pr.period, pr.link].filter(Boolean).join(' | ') + '\n';
      if (pr.details) out += pr.details + '\n';
      out += '\n';
    });
  }
  if (p.courses.length) {
    out += 'COURSES & CERTIFICATIONS\n\n';
    p.courses.forEach(cr => {
      out += [cr.name, cr.provider, cr.date].filter(Boolean).join(' | ') + '\n';
      if (cr.details) out += cr.details + '\n';
    });
    out += '\n';
  }
  if (p.skills.length) {
    out += 'SKILLS\n';
    p.skills.forEach(s => {
      out += [s.category, s.items].filter(Boolean).join(': ') + '\n';
    });
    out += '\n';
  }
  if (p.notes) out += `OTHER\n${p.notes}\n`;
  return out.trim();
};

const inputCls = 'p-2 border rounded text-sm w-full';
const detailsCls = 'w-full p-3 border rounded text-sm resize-y min-h-[90px]';

// Read a resume file to plain text (same formats as the upload phase)
const readResumeFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    reader.onload = async (e) => {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
        resolve(result.value);
      } catch (error) { reject(error); }
    };
    reader.readAsArrayBuffer(file);
  } else if (file.type === 'application/pdf') {
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
      } catch (error) { reject(error); }
    };
    reader.readAsDataURL(file);
  } else {
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsText(file);
  }
  reader.onerror = reject;
});

// Merge an imported profile into the current one without destroying existing work:
// scalar fields fill only if currently empty; list sections append.
const mergeProfiles = (current, imported) => {
  const merged = { ...current };
  const imp = normalizeProfile(imported);
  merged.contact = { ...current.contact };
  Object.keys(imp.contact).forEach(k => {
    if (!merged.contact[k] && imp.contact[k]) merged.contact[k] = imp.contact[k];
  });
  if (!merged.professionalSummary && imp.professionalSummary) merged.professionalSummary = imp.professionalSummary;
  ['experience', 'education', 'personalProjects', 'courses', 'skills'].forEach(k => {
    if (imp[k]?.length) merged[k] = [...current[k], ...imp[k]];
  });
  if (imp.notes) merged.notes = current.notes ? `${current.notes}\n${imp.notes}` : imp.notes;
  return merged;
};

export default function CareerProfileEditor({ userId, onClose, onSaved }) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef(null);

  // Dictation (browser speech recognition)
  const SpeechRecognitionImpl = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [recording, setRecording] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [classifying, setClassifying] = useState(false);
  const [dictationDone, setDictationDone] = useState('');
  const recognitionRef = useRef(null);

  const stopDictation = () => {
    recognitionRef.current?.stop();
    setRecording(false);
    setInterimText('');
  };

  const startDictation = () => {
    if (!SpeechRecognitionImpl) return;
    setError('');
    setDictationDone('');
    const recognition = new SpeechRecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = i18n.language === 'es' ? 'es-ES' : 'en-US';
    recognition.onresult = (event) => {
      let interim = '';
      let finals = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finals += r[0].transcript + ' ';
        else interim += r[0].transcript;
      }
      if (finals) setDictationText(prev => (prev ? prev + (prev.endsWith(' ') ? '' : ' ') : '') + finals);
      setInterimText(interim);
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError(t('profile.dictation.micDenied', { defaultValue: 'Microphone access was denied. Allow it in your browser to dictate.' }));
      }
      setRecording(false);
      setInterimText('');
    };
    recognition.onend = () => {
      setRecording(false);
      setInterimText('');
    };
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  };

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const classifyDictation = async () => {
    if (dictationText.trim().length < 50) return;
    stopDictation();
    setClassifying(true);
    setError('');
    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: dictationText, language: i18n.language, mode: 'narration' })
      });
      const data = await response.json();
      if (!response.ok || !data.profile) {
        throw new Error(data.error || 'classification failed');
      }
      setProfile(prev => mergeProfiles(prev, data.profile));
      setDictationText('');
      setDictationDone(t('profile.dictation.classified', { defaultValue: 'Classified into the sections below — review and save.' }));
    } catch (err) {
      console.error('Dictation classification failed:', err);
      setError(t('profile.dictation.classifyError', { defaultValue: 'Could not classify the narration. You can still add it to Other as-is.' }));
    } finally {
      setClassifying(false);
    }
  };

  const addDictationToNotes = () => {
    if (!dictationText.trim()) return;
    stopDictation();
    setProfile(prev => ({ ...prev, notes: prev.notes ? `${prev.notes}\n${dictationText.trim()}` : dictationText.trim() }));
    setDictationText('');
    setDictationDone(t('profile.dictation.addedToNotes', { defaultValue: 'Added to the Other section below — review and save.' }));
  };

  const handleImportResume = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError('');
    try {
      const text = await readResumeFile(file);
      if (!text || text.trim().length < 50) {
        throw new Error('empty');
      }
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text, language: i18n.language })
      });
      const data = await response.json();
      if (!response.ok || !data.profile) {
        throw new Error(data.error || 'parse failed');
      }
      setProfile(prev => mergeProfiles(prev, data.profile));
    } catch (err) {
      console.error('Resume import failed:', err);
      setError(t('profile.importError', { defaultValue: 'Could not import the resume. Please try again or fill the profile manually.' }));
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await storageAdapter.getMasterProfile(userId);
        if (!cancelled) setProfile(normalizeProfile(stored));
      } catch (e) {
        console.error('Failed to load master profile:', e);
        if (!cancelled) setProfile(normalizeProfile(null));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const update = (patch) => setProfile(prev => ({ ...prev, ...patch }));
  const updateItem = (listKey, idx, patch) => setProfile(prev => {
    const list = [...prev[listKey]];
    list[idx] = { ...list[idx], ...patch };
    return { ...prev, [listKey]: list };
  });
  const addItem = (listKey, item) => setProfile(prev => ({ ...prev, [listKey]: [...prev[listKey], item] }));
  const removeItem = (listKey, idx) => setProfile(prev => ({ ...prev, [listKey]: prev[listKey].filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!userId) return;
    const serialized = profileToText(profile);
    if (serialized.length > 45000) {
      setError(t('profile.tooLong', { defaultValue: 'Your profile is too long; please shorten it before saving.' }));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await storageAdapter.saveMasterProfile(userId, profile);
      setSaved(true);
      onSaved?.(profile);
      setTimeout(onClose, 1000);
    } catch (e) {
      console.error('Failed to save master profile:', e);
      setError(t('profile.saveError', { defaultValue: 'Could not save your career profile. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle = (label, hint) => (
    <div className="mb-3">
      <h4 className="text-lg font-bold text-gray-800">{label}</h4>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );

  const removeBtn = (listKey, idx) => (
    <button
      onClick={() => removeItem(listKey, idx)}
      title={t('buttons.delete')}
      className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs hover:bg-red-50 flex-shrink-0"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );

  const addBtn = (listKey, item, label) => (
    <button
      onClick={() => addItem(listKey, item)}
      className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 flex items-center gap-1"
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[92vh] flex flex-col">
        <div className="p-6 pb-4 border-b">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {t('profile.title', { defaultValue: 'Career Profile' })}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {t('profile.description', { defaultValue: 'Your complete career record. Describe every job, project, decision, and course in full detail, even things that would never fit on a one-page resume. When you optimize for a job, the AI selects only what is relevant.' })}
          </p>
          {!loading && !saved && (
            <div className="mt-3">
              <input
                ref={importInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleImportResume}
                disabled={importing}
                className="hidden"
                id="profile-resume-import"
              />
              <label
                htmlFor="profile-resume-import"
                className={`inline-flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing
                  ? t('profile.importing', { defaultValue: 'Importing resume...' })
                  : t('profile.importFromResume', { defaultValue: 'Import from resume file' })}
              </label>
              <span className="ml-2 text-xs text-gray-400">{t('profile.importHint', { defaultValue: 'PDF, DOCX or TXT — fills the sections below; nothing you typed is overwritten.' })}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center"><Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto" /></div>
        ) : saved ? (
          <div className="py-24 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-semibold text-gray-800">{t('profile.saved', { defaultValue: 'Career profile saved!' })}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Dictation */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-blue-600" />
                    {t('profile.dictation.title', { defaultValue: 'Dictate your experience' })}
                  </h4>
                  {SpeechRecognitionImpl && (
                    <button
                      onClick={recording ? stopDictation : startDictation}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${recording
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                        : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      {recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      {recording
                        ? t('profile.dictation.stop', { defaultValue: 'Stop' })
                        : t('profile.dictation.start', { defaultValue: 'Start dictating' })}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  {t('profile.dictation.hint', { defaultValue: 'Talk freely about what you have done: projects, decisions, results, courses. Then add it as notes, or let the AI sort it into the sections below.' })}
                </p>
                {!SpeechRecognitionImpl && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                    {t('profile.dictation.unsupported', { defaultValue: 'Your browser does not support speech recognition. You can still type in the box below.' })}
                  </p>
                )}
                <textarea
                  value={dictationText}
                  onChange={(e) => setDictationText(e.target.value)}
                  placeholder={t('profile.dictation.placeholder', { defaultValue: 'Your narration appears here as you speak. You can edit it before adding it to your profile.' })}
                  className="w-full p-3 border rounded text-sm resize-y min-h-[90px] bg-white"
                  rows="4"
                />
                {interimText && <p className="text-sm text-gray-400 italic mt-1">{interimText}…</p>}
                {dictationDone && <p className="text-sm text-green-700 mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {dictationDone}</p>}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={classifyDictation}
                    disabled={classifying || dictationText.trim().length < 50}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:bg-gray-300 flex items-center gap-2 hover:bg-blue-600"
                  >
                    {classifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {t('profile.dictation.classify', { defaultValue: 'Classify into my profile' })}
                  </button>
                  <button
                    onClick={addDictationToNotes}
                    disabled={classifying || !dictationText.trim()}
                    className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-blue-100"
                  >
                    {t('profile.dictation.addAsNotes', { defaultValue: 'Add to "Other" as-is' })}
                  </button>
                  {dictationText && (
                    <button
                      onClick={() => { setDictationText(''); setDictationDone(''); }}
                      disabled={classifying}
                      className="px-3 py-2 text-gray-500 rounded-lg text-sm hover:bg-gray-100 ml-auto"
                    >
                      {t('profile.dictation.clear', { defaultValue: 'Clear' })}
                    </button>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div>
                {sectionTitle(t('profile.editor.contact', { defaultValue: 'Contact' }))}
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={profile.contact.name} onChange={(e) => update({ contact: { ...profile.contact, name: e.target.value } })} placeholder={t('profile.editor.name', { defaultValue: 'Full name' })} className={inputCls} />
                  <input type="email" value={profile.contact.email} onChange={(e) => update({ contact: { ...profile.contact, email: e.target.value } })} placeholder="Email" className={inputCls} />
                  <input type="text" value={profile.contact.phone} onChange={(e) => update({ contact: { ...profile.contact, phone: e.target.value } })} placeholder={t('profile.editor.phone', { defaultValue: 'Phone' })} className={inputCls} />
                  <input type="text" value={profile.contact.linkedin} onChange={(e) => update({ contact: { ...profile.contact, linkedin: e.target.value } })} placeholder="LinkedIn" className={inputCls} />
                  <input type="text" value={profile.contact.location} onChange={(e) => update({ contact: { ...profile.contact, location: e.target.value } })} placeholder={t('profile.editor.location', { defaultValue: 'Location' })} className={inputCls} />
                </div>
              </div>

              {/* Summary */}
              <div>
                {sectionTitle(t('profile.editor.summary', { defaultValue: 'Professional Summary' }), t('profile.editor.summaryHint', { defaultValue: 'Who you are professionally, in a few sentences.' }))}
                <textarea value={profile.professionalSummary} onChange={(e) => update({ professionalSummary: e.target.value })} className={detailsCls} rows="3" />
              </div>

              {/* Work Experience */}
              <div>
                {sectionTitle(
                  t('profile.editor.experience', { defaultValue: 'Work Experience' }),
                  t('profile.editor.experienceHint', { defaultValue: 'For each job, describe every project in FULL detail: the problem, the decisions you made, tools used, results, numbers. The more context, the better the AI can build your case.' })
                )}
                <div className="space-y-4">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between gap-3 mb-3">
                        <div className="grid grid-cols-2 gap-3 flex-1">
                          <input type="text" value={exp.title || ''} onChange={(e) => updateItem('experience', idx, { title: e.target.value })} placeholder={t('optimize.labels.jobTitle')} className={inputCls} />
                          <input type="text" value={exp.company || ''} onChange={(e) => updateItem('experience', idx, { company: e.target.value })} placeholder={t('optimize.labels.company')} className={inputCls} />
                          <input type="text" value={exp.location || ''} onChange={(e) => updateItem('experience', idx, { location: e.target.value })} placeholder={t('optimize.labels.location')} className={inputCls} />
                          <div className="flex gap-2">
                            <input type="text" value={exp.startDate || ''} onChange={(e) => updateItem('experience', idx, { startDate: e.target.value })} placeholder={t('optimize.labels.start')} className={inputCls} />
                            <input type="text" value={exp.endDate || ''} onChange={(e) => updateItem('experience', idx, { endDate: e.target.value })} placeholder={t('optimize.labels.end')} className={inputCls} />
                          </div>
                        </div>
                        {removeBtn('experience', idx)}
                      </div>
                      <textarea
                        value={exp.details || ''}
                        onChange={(e) => updateItem('experience', idx, { details: e.target.value })}
                        placeholder={t('profile.editor.experienceDetails', { defaultValue: 'Projects, decisions, tools, results, numbers — everything, in full detail...' })}
                        className={detailsCls}
                        rows="5"
                      />
                    </div>
                  ))}
                  {addBtn('experience', { title: '', company: '', location: '', startDate: '', endDate: '', details: '' }, t('buttons.addExperience'))}
                </div>
              </div>

              {/* Education */}
              <div>
                {sectionTitle(t('profile.editor.education', { defaultValue: 'Education' }))}
                <div className="space-y-4">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between gap-3 mb-3">
                        <div className="grid grid-cols-2 gap-3 flex-1">
                          <input type="text" value={edu.degree || ''} onChange={(e) => updateItem('education', idx, { degree: e.target.value })} placeholder={t('optimize.labels.degree')} className={inputCls} />
                          <input type="text" value={edu.institution || ''} onChange={(e) => updateItem('education', idx, { institution: e.target.value })} placeholder={t('optimize.labels.institution')} className={inputCls} />
                          <input type="text" value={edu.location || ''} onChange={(e) => updateItem('education', idx, { location: e.target.value })} placeholder={t('optimize.labels.location')} className={inputCls} />
                          <input type="text" value={edu.date || ''} onChange={(e) => updateItem('education', idx, { date: e.target.value })} placeholder={t('optimize.labels.date')} className={inputCls} />
                        </div>
                        {removeBtn('education', idx)}
                      </div>
                      <textarea
                        value={edu.details || ''}
                        onChange={(e) => updateItem('education', idx, { details: e.target.value })}
                        placeholder={t('profile.editor.educationDetails', { defaultValue: 'Thesis, specializations, relevant coursework, honors...' })}
                        className={detailsCls}
                        rows="2"
                      />
                    </div>
                  ))}
                  {addBtn('education', { degree: '', institution: '', location: '', date: '', details: '' }, t('buttons.addEducation'))}
                </div>
              </div>

              {/* Personal Projects */}
              <div>
                {sectionTitle(
                  t('profile.editor.personalProjects', { defaultValue: 'Personal Projects' }),
                  t('profile.editor.personalProjectsHint', { defaultValue: 'Side projects, open source, freelance work — with the same full detail as your jobs.' })
                )}
                <div className="space-y-4">
                  {profile.personalProjects.map((pr, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between gap-3 mb-3">
                        <div className="grid grid-cols-3 gap-3 flex-1">
                          <input type="text" value={pr.name || ''} onChange={(e) => updateItem('personalProjects', idx, { name: e.target.value })} placeholder={t('profile.editor.projectName', { defaultValue: 'Project name' })} className={inputCls} />
                          <input type="text" value={pr.period || ''} onChange={(e) => updateItem('personalProjects', idx, { period: e.target.value })} placeholder={t('profile.editor.projectPeriod', { defaultValue: 'Period (e.g. 2024)' })} className={inputCls} />
                          <input type="text" value={pr.link || ''} onChange={(e) => updateItem('personalProjects', idx, { link: e.target.value })} placeholder={t('profile.editor.projectLink', { defaultValue: 'Link (optional)' })} className={inputCls} />
                        </div>
                        {removeBtn('personalProjects', idx)}
                      </div>
                      <textarea
                        value={pr.details || ''}
                        onChange={(e) => updateItem('personalProjects', idx, { details: e.target.value })}
                        placeholder={t('profile.editor.projectDetails', { defaultValue: 'What you built, why, the stack, decisions, outcomes...' })}
                        className={detailsCls}
                        rows="4"
                      />
                    </div>
                  ))}
                  {addBtn('personalProjects', { name: '', period: '', link: '', details: '' }, t('profile.editor.addProject', { defaultValue: '+ Add Project' }))}
                </div>
              </div>

              {/* Courses & Certifications */}
              <div>
                {sectionTitle(
                  t('profile.editor.courses', { defaultValue: 'Courses & Certifications' }),
                  t('profile.editor.coursesHint', { defaultValue: 'Include everything — even small online courses. Not all of it goes in a final resume, but it gives useful context.' })
                )}
                <div className="space-y-3">
                  {profile.courses.map((cr, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between gap-3">
                        <div className="grid grid-cols-3 gap-3 flex-1">
                          <input type="text" value={cr.name || ''} onChange={(e) => updateItem('courses', idx, { name: e.target.value })} placeholder={t('profile.editor.courseName', { defaultValue: 'Course / certification name' })} className={inputCls} />
                          <input type="text" value={cr.provider || ''} onChange={(e) => updateItem('courses', idx, { provider: e.target.value })} placeholder={t('profile.editor.courseProvider', { defaultValue: 'Provider (e.g. Udemy)' })} className={inputCls} />
                          <input type="text" value={cr.date || ''} onChange={(e) => updateItem('courses', idx, { date: e.target.value })} placeholder={t('optimize.labels.date')} className={inputCls} />
                        </div>
                        {removeBtn('courses', idx)}
                      </div>
                    </div>
                  ))}
                  {addBtn('courses', { name: '', provider: '', date: '', details: '' }, t('profile.editor.addCourse', { defaultValue: '+ Add Course' }))}
                </div>
              </div>

              {/* Skills */}
              <div>
                {sectionTitle(t('profile.editor.skills', { defaultValue: 'Skills' }))}
                <div className="space-y-3">
                  {profile.skills.map((sk, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between gap-3">
                        <div className="grid grid-cols-3 gap-3 flex-1">
                          <input type="text" value={sk.category || ''} onChange={(e) => updateItem('skills', idx, { category: e.target.value })} placeholder={t('optimize.labels.category')} className={inputCls} />
                          <input type="text" value={sk.items || ''} onChange={(e) => updateItem('skills', idx, { items: e.target.value })} placeholder={t('profile.editor.skillItems', { defaultValue: 'Skills, comma separated' })} className={`${inputCls} col-span-2`} />
                        </div>
                        {removeBtn('skills', idx)}
                      </div>
                    </div>
                  ))}
                  {addBtn('skills', { category: '', items: '' }, t('buttons.addSkillCategory'))}
                </div>
              </div>

              {/* Other notes */}
              <div>
                {sectionTitle(
                  t('profile.editor.notes', { defaultValue: 'Other' }),
                  t('profile.editor.notesHint', { defaultValue: 'Volunteering, languages, publications, awards, anything else worth knowing.' })
                )}
                <textarea value={profile.notes} onChange={(e) => update({ notes: e.target.value })} className={detailsCls} rows="3" />
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-between gap-3">
              <p className="text-xs text-red-600">{error}</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-5 py-2.5 bg-gray-200 rounded-lg font-medium hover:bg-gray-300">{t('buttons.cancel')}</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium disabled:bg-gray-300 flex items-center gap-2 hover:bg-blue-600"
                >
                  {saving ? <Loader2 className="animate-spin w-5 h-5" /> : t('buttons.save')}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
