import { useState } from 'react';
import { Shield, Brain, CheckCircle, XCircle, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { label: string; value: boolean; isUnsafe: boolean }[];
  detail?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'age',
    text: 'Are you at least 18 years old and under 65?',
    options: [
      { label: 'Yes', value: true, isUnsafe: false },
      { label: 'No', value: false, isUnsafe: true }
    ],
    detail: 'Legal requirement for blood donation in most regions.'
  },
  {
    id: 'weight',
    text: 'Do you weigh at least 45 kg (99 lbs)?',
    options: [
      { label: 'Yes', value: true, isUnsafe: false },
      { label: 'No', value: false, isUnsafe: true }
    ],
    detail: 'Donors must meet weight limits to ensure safe donation volume.'
  },
  {
    id: 'tattoos',
    text: 'Have you had a tattoo, piercing, or acupuncture in the past 6 months?',
    options: [
      { label: 'Yes', value: true, isUnsafe: true },
      { label: 'No', value: false, isUnsafe: false }
    ],
    detail: 'A waiting period is required to reduce transmission risks of bloodborne diseases.'
  },
  {
    id: 'medication',
    text: 'Are you currently taking antibiotics or any major prescription medication?',
    options: [
      { label: 'Yes', value: true, isUnsafe: true },
      { label: 'No', value: false, isUnsafe: false }
    ],
    detail: 'Certain medications require a waiting period after your last dose.'
  },
  {
    id: 'alcohol',
    text: 'Have you consumed alcohol in the last 24 hours?',
    options: [
      { label: 'Yes', value: true, isUnsafe: true },
      { label: 'No', value: false, isUnsafe: false }
    ],
    detail: 'Donating while dehydrated or under the influence is unsafe.'
  }
];

export default function EligibilityScreener({ onClose }: { onClose?(): void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isFailed, setIsFailed] = useState(false);
  const [screeningFinished, setScreeningFinished] = useState(false);

  const handleAnswer = (qId: string, answerVal: boolean, isUnsafe: boolean) => {
    setAnswers(prev => ({ ...prev, [qId]: answerVal }));
    if (isUnsafe) {
      setIsFailed(true);
    }

    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setScreeningFinished(true);
    }
  };

  const restart = () => {
    setCurrentIdx(0);
    setAnswers({});
    setIsFailed(false);
    setScreeningFinished(false);
  };

  const currentQ = QUESTIONS[currentIdx];

  return (
    <div className="card p-5 border-blood-100 bg-white shadow-xl relative overflow-hidden">
      {/* Wave effect at top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blood-500 to-red-600" />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blood-100 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-blood-700 animate-pulse" />
        </div>
        <div>
          <h3 className="font-display font-bold text-gray-800 text-sm">Eligibility Screener</h3>
          <p className="text-xs text-gray-400">Pre-screen checklist helper</p>
        </div>
      </div>

      {!screeningFinished ? (
        <div className="space-y-4 animate-fade-in">
          {/* Progress bar */}
          <div className="flex justify-between items-center text-xs text-gray-400 font-bold mb-1">
            <span>Question {currentIdx + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(((currentIdx) / QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blood-600 transition-all duration-300" style={{ width: `${((currentIdx) / QUESTIONS.length) * 100}%` }} />
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 min-h-[90px] flex flex-col justify-center border border-gray-100">
            <p className="font-bold text-gray-800 text-sm">{currentQ.text}</p>
            {currentQ.detail && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-blood-500" />{currentQ.detail}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {currentQ.options.map(opt => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(currentQ.id, opt.value, opt.isUnsafe)}
                className="py-3 bg-white border border-gray-200 hover:border-blood-400 hover:bg-blood-50/20 text-gray-800 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {opt.label} <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Results screen */
        <div className="text-center py-4 space-y-4 animate-scale-up">
          {isFailed ? (
            <>
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
                <XCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="font-black text-gray-800 text-base">Not Eligible Yet</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">
                  Based on your responses, you do not meet all criteria at this time. Please consult a doctor or blood donation coordinator for guidance.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div>
                <h4 className="font-black text-emerald-700 text-base">You Look Eligible!</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">
                  Awesome! You meet the initial pre-screening requirements. You can proceed to check available slots at blood banks!
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <button onClick={restart} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Start Over
            </button>
            {onClose && (
              <button onClick={onClose} className="flex-1 py-2.5 bg-blood-600 hover:bg-blood-700 text-white text-xs font-bold rounded-xl transition-colors">
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
