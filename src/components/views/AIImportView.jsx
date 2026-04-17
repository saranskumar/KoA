import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataMutation } from '../../hooks/useData';
import { Bot, Copy, Check, AlertCircle, ArrowRight, Upload, PlayCircle } from 'lucide-react';

const SYSTEM_PROMPT_TEMPLATE = `You are an expert study planner. I am taking courses and need a comprehensive study plan.
Please generate a completely structured JSON response containing:
1. Plan details
2. Subjects, their modules, and specific topics
3. A daily study schedule

Format your response EXACTLY matching this TypeScript interface, no other text or explanation, just the raw JSON:

\`\`\`json
{
  "plan": {
    "title": "My Master Plan",
    "description": "Custom study plan"
  },
  "subjects": [
    {
      "name": "Subject Name",
      "exam_date": "YYYY-MM-DD",
      "modules": [
        {
          "name": "Module Name",
          "topics": ["Topic 1", "Topic 2"]
        }
      ]
    }
  ],
  "study_plan": [
    {
      "date": "YYYY-MM-DD",
      "subject": "Subject Name",
      "module": "Module Name",
      "topic": "Topic 1",
      "title": "Study Topic 1",
      "planned_minutes": 120,
      "priority": "high" // low, medium, high
    }
  ]
}
\`\`\`

Rules and Context:
- The "subject" names in "study_plan" MUST perfectly match the names in "subjects".
- Do NOT wrap the JSON in Markdown code blocks. Output ONLY valid JSON syntax.
- Ensure dates are logically sequenced based on the syllabus and exam schedules.

Here is my syllabus and context data:
---
[SYLLABUS]
`;

export default function AIImportView({ onComplete }) {
  const [syllabusText, setSyllabusText] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useDataMutation();

  const generatedPrompt = SYSTEM_PROMPT_TEMPLATE.replace('[SYLLABUS]', syllabusText || '(User will enter syllabus here...)');

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  useEffect(() => {
    if (!jsonInput.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      const data = JSON.parse(jsonInput);
      
      // Strict schema validation
      if (!data.plan || !data.plan.title) throw new Error("Missing 'plan.title'");
      if (!data.subjects || !Array.isArray(data.subjects) || data.subjects.length === 0) throw new Error("Missing or empty 'subjects' array");
      
      let totalModules = 0;
      let totalTopics = 0;
      const subjectNames = new Set();

      for (const sub of data.subjects) {
        if (!sub.name) throw new Error("A subject is missing a 'name'");
        subjectNames.add(sub.name);
        
        if (!sub.modules || !Array.isArray(sub.modules)) throw new Error(`Subject '${sub.name}' is missing a 'modules' array`);
        for (const mod of sub.modules) {
          totalModules++;
          if (!mod.name) throw new Error(`A module in subject '${sub.name}' is missing a 'name'`);
          if (!mod.topics || !Array.isArray(mod.topics)) throw new Error(`Module '${mod.name}' is missing a 'topics' array`);
          totalTopics += mod.topics.length;
        }
      }

      if (!data.study_plan || !Array.isArray(data.study_plan) || data.study_plan.length === 0) throw new Error("Missing or empty 'study_plan' array");
      for (const task of data.study_plan) {
        if (!task.date || !task.subject || !task.title || !task.planned_minutes) {
           throw new Error("A study task is missing required fields (date, subject, title, planned_minutes)");
        }
        if (!subjectNames.has(task.subject)) {
           throw new Error(`Task subject '${task.subject}' does not align with any defined subject in 'subjects'.`);
        }
      }

      setValidationResult({
        valid: true,
        data,
        summary: `Found ${data.subjects.length} subjects, ${totalModules} modules, ${totalTopics} topics, and ${data.study_plan.length} tasks.`
      });

    } catch (err) {
      setValidationResult({ valid: false, error: err.message });
    }
  }, [jsonInput]);

  const handleImport = async () => {
    if (!validationResult?.valid) return;
    
    setIsProcessing(true);
    try {
      await mutation.mutateAsync({
        action: 'importAIPlan',
        payload: validationResult.data
      });
      queryClient.invalidateQueries({ queryKey: ['appData'] });
      onComplete(); // Back to Today view in App.js
    } catch (err) {
      alert('Error importing plan: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdf9] flex flex-col items-center p-4 py-8">
      <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <header className="text-center pb-4 border-b border-[#edeec9]">
          <div className="mx-auto w-12 h-12 bg-[#bfd8bd]/30 flex items-center justify-center rounded-xl mb-3 text-[#3c7f65]">
            <Bot size={24} />
          </div>
          <h1 className="text-3xl font-black text-[#313c1a] tracking-tight">AI Plan Import</h1>
          <p className="text-[#627833] font-medium mt-2">Bring your own schedule using any AI model.</p>
        </header>

        {/* Step 1: Input & Prompt */}
        <div className="bg-white p-5 rounded-2xl border border-[#edeec9] shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-[#313c1a] mb-2 flex items-center gap-2"><span className="w-5 h-5 bg-[#77bfa3] text-white rounded-full flex items-center justify-center text-xs">1</span> Provide Context</h2>
            <p className="text-sm text-[#627833] mb-3">Paste your syllabus, exam timetable, or study goals below. This will be injected into a highly formatted prompt for your AI.</p>
            <textarea
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder="e.g. Exams start May 10th. I need to study Math (Calculus), Physics (Kinematics)..."
              className="w-full h-32 p-3 bg-[#f8faf4] border border-[#dde7c7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77bfa3] text-sm resize-none"
            />
          </div>

          <div className="pt-2 border-t border-[#f0f4ea]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-[#313c1a] text-sm">Generated System Prompt</h3>
              <button 
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#f0f7f4] text-[#3c7f65] hover:bg-[#bfd8bd]/30 rounded-lg transition-colors border border-[#dde7c7]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Prompt'}
              </button>
            </div>
            <div className="bg-[#f2f4ec] p-3 rounded-xl border border-[#edeec9] text-xs font-mono text-[#5a6a40] h-32 overflow-y-auto whitespace-pre-wrap">
              {generatedPrompt}
            </div>
          </div>
        </div>

        {/* Step 2: Paste AI Output */}
        <div className="bg-white p-5 rounded-2xl border border-[#edeec9] shadow-sm space-y-4">
          <h2 className="font-bold text-[#313c1a] mb-2 flex items-center gap-2"><span className="w-5 h-5 bg-[#77bfa3] text-white rounded-full flex items-center justify-center text-xs">2</span> Paste AI Result</h2>
          <p className="text-sm text-[#627833] mb-3">Ask your AI (ChatGPT, Claude, Gemini) with the copied prompt, and paste the exact JSON response here.</p>
          
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"plan": {"title": "..."}}'
            className="w-full h-48 p-3 bg-[#1e2315] text-[#b8cd8a] font-mono border border-[#313c1a] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77bfa3] text-sm"
          />

          {jsonInput && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${validationResult?.valid ? 'bg-[#f0f7f4] border-[#bfd8bd]' : 'bg-red-50 border-red-200'}`}>
              {validationResult?.valid ? (
                <Check className="text-[#3c7f65] mt-0.5" size={18} />
              ) : (
                <AlertCircle className="text-red-500 mt-0.5" size={18} />
              )}
              <div className="flex-1">
                <h4 className={`font-bold text-sm ${validationResult?.valid ? 'text-[#313c1a]' : 'text-red-800'}`}>
                  {validationResult?.valid ? 'Valid Plan Configuration' : 'Invalid JSON Format'}
                </h4>
                <p className={`text-xs mt-1 ${validationResult?.valid ? 'text-[#627833]' : 'text-red-600'}`}>
                  {validationResult?.valid ? validationResult.summary : validationResult?.error}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action */}
        <button
          onClick={handleImport}
          disabled={!validationResult?.valid || isProcessing}
          className="w-full py-4 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(60,127,101,0.4)] bg-[#3c7f65] hover:bg-[#2d5a4c] disabled:opacity-50 disabled:bg-[#98c9a3]"
        >
          {isProcessing ? (
            <><PlayCircle className="animate-spin" size={20} /> Importing Plan...</>
          ) : (
            <><Upload size={20} /> Import Plan & Start <ArrowRight size={18} /></>
          )}
        </button>

      </div>
    </div>
  );
}
