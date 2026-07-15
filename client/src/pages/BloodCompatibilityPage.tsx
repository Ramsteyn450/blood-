import { useState } from 'react';
import { Droplets, CheckCircle, XCircle, ArrowRight, Info } from 'lucide-react';

// Blood compatibility matrix
const CAN_DONATE_TO: Record<string, string[]> = {
  'O-':  ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
  'O+':  ['O+','A+','B+','AB+'],
  'A-':  ['A-','A+','AB-','AB+'],
  'A+':  ['A+','AB+'],
  'B-':  ['B-','B+','AB-','AB+'],
  'B+':  ['B+','AB+'],
  'AB-': ['AB-','AB+'],
  'AB+': ['AB+'],
};

const CAN_RECEIVE_FROM: Record<string, string[]> = {
  'O-':  ['O-'],
  'O+':  ['O-','O+'],
  'A-':  ['O-','A-'],
  'A+':  ['O-','O+','A-','A+'],
  'B-':  ['O-','B-'],
  'B+':  ['O-','O+','B-','B+'],
  'AB-': ['O-','A-','B-','AB-'],
  'AB+': ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
};

const BLOOD_TYPES = ['O-','O+','A-','A+','B-','B+','AB-','AB+'];
const BLOOD_FACTS: Record<string, string> = {
  'O-':  'Universal donor! Can donate red cells to anyone. In high demand for emergencies.',
  'O+':  'Most common blood type (~37% of population). Great donor for O+, A+, B+, AB+.',
  'A-':  'Rare but versatile. Can donate to all A and AB types.',
  'A+':  'Second most common type. Can only receive from A and O types.',
  'B-':  'Rare type. Compatible with B and AB receivers.',
  'B+':  'Can donate to B+ and AB+ recipients.',
  'AB-': 'Rare universal plasma donor. Can receive from all Rh- types.',
  'AB+': 'Universal recipient! Can receive from anyone, but can only donate to AB+.',
};

const COLORS: Record<string, string> = {
  'O-':'#c0392b','O+':'#e74c3c','A-':'#2980b9','A+':'#3498db',
  'B-':'#8e44ad','B+':'#9b59b6','AB-':'#16a085','AB+':'#1abc9c',
};

export default function BloodCompatibilityPage() {
  const [myType, setMyType] = useState<string>('O+');
  const [mode, setMode] = useState<'donate'|'receive'>('donate');

  const compatible = mode === 'donate' ? CAN_DONATE_TO[myType] : CAN_RECEIVE_FROM[myType];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blood-100 rounded-xl flex items-center justify-center">
          <Droplets className="w-5 h-5 text-blood-700" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-800">Blood Compatibility</h1>
          <p className="text-gray-400 text-sm">Find who you can donate to or receive from</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
        <button onClick={() => setMode('donate')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode==='donate'?'bg-blood-600 text-white shadow':'text-gray-400'}`}>
          ❤️ I Can Donate To
        </button>
        <button onClick={() => setMode('receive')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode==='receive'?'bg-blue-600 text-white shadow':'text-gray-400'}`}>
          💧 I Can Receive From
        </button>
      </div>

      {/* Blood Type Selector */}
      <div className="mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select Your Blood Type</p>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_TYPES.map(bt => (
            <button
              key={bt}
              onClick={() => setMyType(bt)}
              className={`py-3 rounded-2xl text-sm font-black transition-all border-2 ${myType === bt ? 'text-white shadow-lg scale-105' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
              style={myType === bt ? { background: COLORS[bt], borderColor: COLORS[bt] } : {}}
            >
              {bt}
            </button>
          ))}
        </div>
      </div>

      {/* Fact Card */}
      <div className="bg-blood-50 border border-blood-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-4 h-4 text-blood-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blood-800">{BLOOD_FACTS[myType]}</p>
      </div>

      {/* Compatibility Visual Matrix */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm" style={{ background: COLORS[myType] }}>{myType}</div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <p className="font-bold text-gray-800 text-sm">
            {mode === 'donate' ? `Blood type ${myType} can donate to:` : `Blood type ${myType} can receive from:`}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_TYPES.map(bt => {
            const isCompatible = compatible.includes(bt);
            return (
              <div key={bt} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${isCompatible ? 'border-transparent shadow-sm' : 'border-gray-100 opacity-40'}`}
                style={isCompatible ? { background: COLORS[bt] + '20', borderColor: COLORS[bt] + '40' } : {}}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs ${isCompatible ? '' : 'bg-gray-200'}`}
                  style={isCompatible ? { background: COLORS[bt] } : {}}>
                  {bt}
                </div>
                {isCompatible
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          ✅ {compatible.length} compatible · ❌ {BLOOD_TYPES.length - compatible.length} incompatible
        </p>
      </div>

      {/* Full Compatibility Table */}
      <div className="card p-5">
        <h3 className="font-bold text-gray-800 mb-4 text-sm">Full Compatibility Reference</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 font-bold text-gray-400">Blood Type</th>
                <th className="text-center py-2 px-2 font-bold text-gray-400">Donate To</th>
                <th className="text-center py-2 px-2 font-bold text-gray-400">Receive From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {BLOOD_TYPES.map(bt => (
                <tr key={bt} className={`${bt === myType ? 'bg-blood-50' : 'hover:bg-gray-50'} transition-colors`}>
                  <td className="py-2.5 px-2">
                    <span className="font-black px-2.5 py-1 rounded-lg text-white text-xs" style={{ background: COLORS[bt] }}>{bt}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex gap-0.5 justify-center flex-wrap">
                      {CAN_DONATE_TO[bt].map(t => <span key={t} className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">{t}</span>)}
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex gap-0.5 justify-center flex-wrap">
                      {CAN_RECEIVE_FROM[bt].map(t => <span key={t} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">{t}</span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
