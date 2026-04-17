import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDataMutation } from '../../hooks/useData';
import {
  Copy, Check, AlertCircle, ArrowRight, Upload,
  Loader2, ClipboardPaste, Sparkles, Bot
} from 'lucide-react';

// ─── The fixed prompt the user will copy ─────────────────────────────────────
const TODAY = new Date().toLocaleDateString('en-CA');

const PROMPT = `You are an expert academic study planner.

Create a COMPLETE and BALANCED daily study plan based on the syllabus and exam timetable provided below.

TODAY'S DATE: ${TODAY}

==================================================
PRIMARY OBJECTIVE
=================

* Cover 100% of the syllabus (ALL subjects, ALL modules, ALL topics).
* Ensure NO topic is skipped.
* Distribute study sessions intelligently across available days.
* Prioritize subjects with earlier exams.

==================================================
STRICT RULES
============

1. FULL COVERAGE

* Every topic listed in the syllabus MUST appear at least once in the study_plan.
* Important topics should appear multiple times (initial study + revision).

2. DISTRIBUTION

* Spread sessions across all days before each subject’s exam.
* Do NOT overload a single day unless necessary.
* Do NOT leave large gaps without studying a subject before its exam.

3. SESSION STRUCTURE

* Each session duration: 60–180 minutes.
* Each session must focus on:

  * one topic OR
  * a small group of closely related topics

4. REVISION STRATEGY

* Include revision sessions:

  * at least 1 revision before exam per subject
  * final revision 1–2 days before exam
* Label clearly:

  * "Revision: ..."
  * "Final Revision: ..."

5. OUTPUT PRACTICE (VERY IMPORTANT)

* Include regular output-based sessions:

  * problem solving
  * writing answers
  * PYQs (previous year questions)
* At least:

  * every 2–3 days per subject
* Label clearly:

  * "Practice: ..."
  * "PYQs: ..."
  * "Write Answers: ..."

6. PRIORITY LOGIC

* "high" → exam within 7 days
* "medium" → 8–14 days
* "low" → 15+ days

7. SESSION TITLES

* Must be natural and varied:

  * "Deep Dive: Recursion Trees"
  * "Practice: SQL Joins & Queries"
  * "Revision: Deadlocks & Scheduling"
* Avoid generic titles like "Study Topic"

8. DATE RULES

* Use YYYY-MM-DD format
* Do NOT schedule anything on or after a subject’s exam date

9. DATA CONSISTENCY (CRITICAL)

* The "subject" field in study_plan MUST EXACTLY match a subject name
* The "module" field MUST match module names
* The "topic" MUST exist inside that module

10. BALANCE

* Mix subjects across days
* Avoid studying only one subject repeatedly unless very close to exam

==================================================
OUTPUT FORMAT (STRICT)
======================

Return ONLY valid JSON.
No markdown, no explanations, no code blocks (like \`\`\`json).

{
  "plan": {
    "title": "string",
    "description": "short summary of strategy used"
  },
  "subjects": [
    {
      "name": "string",
      "exam_date": "YYYY-MM-DD",
      "modules": [
        {
          "name": "string",
          "topics": ["Topic A", "Topic B"]
        }
      ]
    }
  ],
  "study_plan": [
    {
      "date": "YYYY-MM-DD",
      "subject": "string",
      "module": "string",
      "topic": "string",
      "title": "string",
      "planned_minutes": 90,
      "priority": "high"
    }
  ]
}

==================================================
VALIDATION BEFORE RETURNING
===========================

Before outputting JSON, ensure:

* Every topic appears at least once
* No invalid subject/module/topic references
* No duplicate meaningless sessions
* Dates are valid and ordered logically
* Sessions increase in intensity closer to exams

==================================================
NOW PASTE YOUR SYLLABUS AND EXAM TIMETABLE BELOW THIS LINE:
`;

// ─── Step indicator ───────────────────────────────────────────────────────────
function Step({ n, label, active, done }) {
  return (
    <div className={`flex items-center gap-2.5 ${active ? 'opacity-100' : done ? 'opacity-60' : 'opacity-30'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
        done ? 'bg-[#3c7f65] text-white' : active ? 'bg-[#77bfa3] text-white ring-4 ring-[#77bfa3]/20' : 'bg-[#edeec9] text-[#627833]'
      }`}>
        {done ? <Check size={13} /> : n}
      </div>
      <span className={`text-xs font-bold ${active ? 'text-[#313c1a]' : 'text-[#627833]'}`}>{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AIImportView({ onComplete, onCancel }) {
  const [step, setStep] = useState(1); // 1 = copy prompt, 2 = paste result, 3 = import
  const [promptCopied, setPromptCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const mutation = useDataMutation();

  // ── Copy prompt ──
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT);
      setPromptCopied(true);
      setTimeout(() => setStep(2), 1200); // auto-advance after copy
    } catch {
      alert('Could not copy. Please select + copy the prompt text manually.');
    }
  };

  // ── Validate JSON as user types ──
  useEffect(() => {
    if (!jsonInput.trim()) { setValidationResult(null); return; }

    try {
      const data = JSON.parse(jsonInput);

      if (!data.plan?.title) throw new Error("Missing 'plan.title'");
      if (!Array.isArray(data.subjects) || data.subjects.length === 0)
        throw new Error("'subjects' must be a non-empty array");

      let totalModules = 0, totalTopics = 0;
      const subjectNames = new Set();

      for (const sub of data.subjects) {
        if (!sub.name) throw new Error("A subject is missing a 'name'");
        subjectNames.add(sub.name);
        if (!Array.isArray(sub.modules)) throw new Error(`'${sub.name}' is missing 'modules'`);
        for (const mod of sub.modules) {
          totalModules++;
          if (!mod.name) throw new Error(`A module in '${sub.name}' is missing a 'name'`);
          if (!Array.isArray(mod.topics)) throw new Error(`Module '${mod.name}' is missing 'topics'`);
          totalTopics += mod.topics.length;
        }
      }

      if (!Array.isArray(data.study_plan) || data.study_plan.length === 0)
        throw new Error("'study_plan' must be a non-empty array");

      for (const task of data.study_plan) {
        if (!task.date || !task.subject || !task.title || !task.planned_minutes)
          throw new Error(`A task is missing required fields (date/subject/title/planned_minutes)`);
        if (!subjectNames.has(task.subject))
          throw new Error(`Task subject "${task.subject}" doesn't match any subject name`);
      }

      setValidationResult({
        valid: true, data,
        summary: `${data.subjects.length} subjects · ${totalModules} modules · ${totalTopics} topics · ${data.study_plan.length} sessions`
      });
    } catch (err) {
      setValidationResult({ valid: false, error: err.message });
    }
  }, [jsonInput]);

  // ── Import ──
  const handleImport = async () => {
    if (!validationResult?.valid) return;
    setIsProcessing(true);
    try {
      await mutation.mutateAsync({ action: 'importAIPlan', payload: validationResult.data });
      queryClient.invalidateQueries({ queryKey: ['appData'] });
      onComplete();
    } catch (err) {
      alert('Import failed: ' + err.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfdf9]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="relative text-center">
          {onCancel && (
            <button 
              onClick={onCancel}
              className="absolute left-0 top-1.5 w-10 h-10 rounded-xl bg-white border border-[#edeec9] flex items-center justify-center text-[#627833] hover:bg-[#f8faf4] transition-colors shadow-sm"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#bfd8bd] to-[#77bfa3] flex items-center justify-center rounded-2xl mb-3 shadow-md">
            <Bot size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#313c1a]">Build Plan with AI</h1>
          <p className="text-[#627833] text-sm mt-1">3 simple steps — works with any AI</p>
        </div>

        {/* Step tracker */}
        <div className="flex items-center gap-2 px-1">
          <Step n={1} label="Copy prompt" active={step === 1} done={step > 1} />
          <div className="flex-1 h-px bg-[#edeec9]" />
          <Step n={2} label="Paste AI response" active={step === 2} done={step > 2} />
          <div className="flex-1 h-px bg-[#edeec9]" />
          <Step n={3} label="Import" active={step === 3} done={false} />
        </div>

        {/* ── STEP 1: Copy prompt ── */}
        <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${step === 1 ? 'border-[#77bfa3] shadow-[0_0_0_4px_rgba(119,191,163,0.08)]' : 'border-[#edeec9]'}`}>
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#3c7f65] text-white rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black">1</div>
            <div>
              <h2 className="font-bold text-[#313c1a] text-base">Instructions</h2>
              <ul className="text-[#627833] text-sm mt-2 space-y-1.5 leading-relaxed list-decimal list-inside pr-2">
                <li><strong>Copy</strong> the master prompt below.</li>
                <li><strong>Paste</strong> it into ChatGPT, Claude, or Gemini.</li>
                <li><strong>Add</strong> your syllabus & timetable at the bottom.</li>
                <li><strong>Copy</strong> the AI's response and paste it in Step 2.</li>
              </ul>
            </div>
          </div>

          <div className="p-5 bg-[#f8faf4] border-t border-[#f0f4ea]">
            <button
              onClick={handleCopyPrompt}
              className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                promptCopied
                  ? 'bg-[#3c7f65] text-white'
                  : 'bg-[#77bfa3] hover:bg-[#50a987] text-white shadow-[0_4px_16px_rgba(119,191,163,0.25)]'
              }`}
            >
              {promptCopied ? <><Check size={18} /> Copied! Proceed to your AI</> : <><Copy size={18} /> Copy AI Prompt</>}
            </button>
            <p className="text-center text-[#8aad60] text-[10px] uppercase font-bold tracking-wider mt-3">
              Included: Rules, Formatting & JSON Schema
            </p>
          </div>
        </div>



        {/* ── STEP 2: Paste AI response ── */}
        <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${step >= 2 ? 'border-[#77bfa3] shadow-[0_0_0_4px_rgba(119,191,163,0.08)]' : 'border-[#edeec9] opacity-40 pointer-events-none'}`}>
          <div className="p-4 flex items-start gap-3 border-b border-[#f0f4ea]">
            <div className="w-8 h-8 bg-[#3c7f65] text-white rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black">2</div>
            <div>
              <h2 className="font-bold text-[#313c1a] text-sm">Paste AI response here</h2>
              <p className="text-[#8aad60] text-xs mt-0.5">The app checks it automatically as you paste.</p>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="relative">
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); if (step === 2) setStep(2); }}
                onPaste={() => setTimeout(() => setStep(validationResult?.valid ? 3 : 2), 100)}
                placeholder={'Paste the JSON from your AI here…\n\n{\n  "plan": { "title": "..." },\n  "subjects": [...],\n  "study_plan": [...]\n}'}
                className="w-full h-44 p-3 bg-[#f8faf4] text-[#3c7f65] font-mono border border-[#edeec9] shadow-inner rounded-xl focus:outline-none focus:ring-2 focus:ring-[#77bfa3] focus:bg-white transition-colors text-[11px] leading-relaxed"
              />
              {!jsonInput && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-1.5 opacity-20">
                    <ClipboardPaste size={28} className="text-[#77bfa3]" />
                    <span className="text-[#77bfa3] text-xs font-bold">Paste here</span>
                  </div>
                </div>
              )}
            </div>

            {/* Validation badge */}
            {jsonInput.trim() && validationResult && (
              <div className={`flex items-start gap-3 p-3 rounded-xl border text-xs animate-in slide-in-from-bottom-2 duration-200 ${
                validationResult.valid
                  ? 'bg-[#f0f7f4] border-[#bfd8bd]'
                  : 'bg-red-50 border-red-200'
              }`}>
                {validationResult.valid
                  ? <Check size={15} className="text-[#3c7f65] mt-0.5 flex-shrink-0" />
                  : <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                }
                <div>
                  <p className={`font-bold ${validationResult.valid ? 'text-[#3c7f65]' : 'text-red-700'}`}>
                    {validationResult.valid ? '✓ Valid — ready to import' : 'Format error'}
                  </p>
                  <p className={`mt-0.5 ${validationResult.valid ? 'text-[#627833]' : 'text-red-600'}`}>
                    {validationResult.valid ? validationResult.summary : validationResult.error}
                  </p>
                  {!validationResult.valid && (
                    <p className="text-[#98c9a3] mt-1">
                      Fix the issue in your AI chat and paste the corrected response.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 3: Import ── */}
        <button
          onClick={handleImport}
          disabled={!validationResult?.valid || isProcessing}
          className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center gap-2.5 transition-all text-sm ${
            validationResult?.valid && !isProcessing
              ? 'bg-[#3c7f65] hover:bg-[#2d5a4c] text-white shadow-[0_4px_20px_rgba(60,127,101,0.35)]'
              : 'bg-[#dde7c7] text-[#98c9a3] cursor-not-allowed'
          }`}
        >
          {isProcessing
            ? <><Loader2 size={18} className="animate-spin" /> Importing your plan…</>
            : validationResult?.valid
              ? <><Upload size={18} /> Import &amp; Start Studying <ArrowRight size={16} /></>
              : 'Paste valid AI JSON to continue'
          }
        </button>

      </div>
    </div>
  );
}
