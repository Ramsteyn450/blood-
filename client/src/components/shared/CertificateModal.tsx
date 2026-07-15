import { X, Printer, Heart, Award, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  donorName: string;
  badgesCount: number;
  onClose(): void;
}

export default function CertificateModal({ donorName, badgesCount, onClose }: Props) {
  const dateStr = format(new Date(), 'MMMM d, yyyy');

  // Milestone type based on badges
  const milestoneTitle = badgesCount >= 10 ? 'Blood Ambassador' : badgesCount >= 5 ? 'Life Saver' : 'First Drop Hero';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9900] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col relative print:fixed print:inset-0 print:m-0 print:shadow-none print:rounded-none">
        
        {/* Close Button - hidden in print */}
        <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-colors z-[1000] print:hidden">
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Content */}
        <div id="print-area" className="p-10 border-8 border-double border-red-800 m-4 rounded-2xl flex flex-col items-center justify-center text-center bg-stone-50/30 print:border-red-800 print:m-0 print:h-screen print:justify-center">
          
          {/* Certificate Badge icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
            <Award className="w-10 h-10 animate-pulse" />
          </div>

          <h1 className="font-serif text-3xl font-bold text-red-800 tracking-wide uppercase mb-1">Certificate of Appreciation</h1>
          <p className="text-gray-400 text-xs tracking-widest uppercase font-semibold mb-6">LifeFlow Smart Blood Donor Network</p>

          <p className="text-gray-600 font-serif italic text-sm mb-4">This certificate is proudly presented to</p>
          <h2 className="font-serif text-2xl font-black text-gray-800 border-b-2 border-red-800/20 px-8 pb-2 mb-6 tracking-wide">{donorName}</h2>

          <p className="text-gray-600 text-sm max-w-lg leading-relaxed mb-6 font-serif italic">
            For outstanding commitment and compassion as a blood donor. By donating life-saving blood and earning the milestone rank of 
            <strong className="text-red-700 not-italic block mt-1.5 text-lg font-black">{milestoneTitle} ({badgesCount} Donations)</strong>
            you have directly contributed to saving lives in the local community.
          </p>

          <div className="w-full flex items-center justify-between mt-8 px-6">
            <div className="text-left">
              <p className="text-xs font-bold text-gray-700">{dateStr}</p>
              <div className="w-24 h-0.5 bg-gray-300 my-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Date Issued</p>
            </div>
            
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-8 h-8 text-red-800/80 mb-1" />
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">LifeFlow Certified</p>
            </div>

            <div className="text-right">
              <p className="font-serif text-sm font-bold text-red-800 italic">Antigravity AI</p>
              <div className="w-24 h-0.5 bg-gray-300 my-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Network Coordinator</p>
            </div>
          </div>
        </div>

        {/* Action buttons - hidden in print */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100 print:hidden">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handlePrint} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
