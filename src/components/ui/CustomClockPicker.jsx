import React, { useState, useEffect, useRef } from 'react';
import { Clock, X, ChevronRight } from 'lucide-react';

export default function CustomClockPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  // Default values
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const [mode, setMode] = useState('hour'); // 'hour' | 'minute'

  const modalRef = useRef(null);

  // Parse `HH:mm` (24h) string into local states
  useEffect(() => {
    if (value && value.includes(':')) {
      const [hStr, mStr] = value.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      
      const pm = h >= 12;
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;
      
      setHour12(h);
      setMinute(m);
      setIsPM(pm);
    }
  }, [value, isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Convert current selection to HH:mm (24h) and trigger onChange
  const applyTime = () => {
    let finalH = hour12;
    if (isPM && finalH !== 12) finalH += 12;
    if (!isPM && finalH === 12) finalH = 0;
    
    const outValue = `${finalH.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(outValue);
    setIsOpen(false);
  };

  const handleHourClick = (h) => {
    setHour12(h);
    setMode('minute'); // Auto switch to minutes
  };

  const handleMinuteClick = (m) => {
    setMinute(m);
  };

  const formatDisplay = (h, m, pm) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${pm ? 'PM' : 'AM'}`;
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[#dde7c7] bg-white hover:border-[#77bfa3] transition-all"
      >
        <div className="flex items-center gap-2">
           <Clock size={16} className="text-[#98c9a3]" />
           <span className="text-sm font-black text-[#313c1a]">
             {value ? formatDisplay(hour12, minute, isPM) : 'Select Time'}
           </span>
        </div>
        <ChevronRight size={14} className="text-[#c1c8a9]" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div ref={modalRef} className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-[#edeec9] p-6 animate-in slide-in-from-bottom-4 duration-300">
             
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#3c7f65] font-black text-sm uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> Select Time
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-[#98c9a3] hover:text-[#313c1a] transition-all">
                  <X size={20} />
                </button>
             </div>

             {/* Digital Display Headers */}
             <div className="flex items-center justify-center gap-2 mb-8">
               <button 
                 onClick={() => setMode('hour')}
                 className={`text-5xl font-black rounded-2xl px-4 py-2 transition-all ${mode === 'hour' ? 'bg-[#f0f7f4] text-[#77bfa3]' : 'text-[#c1c8a9] hover:text-[#98c9a3]'}`}
               >
                 {hour12.toString().padStart(2, '0')}
               </button>
               <span className="text-4xl font-black text-[#dde7c7] pb-1">:</span>
               <button 
                 onClick={() => setMode('minute')}
                 className={`text-5xl font-black rounded-2xl px-4 py-2 transition-all ${mode === 'minute' ? 'bg-[#f0f7f4] text-[#77bfa3]' : 'text-[#c1c8a9] hover:text-[#98c9a3]'}`}
               >
                 {minute.toString().padStart(2, '0')}
               </button>
             </div>

             {/* AM / PM Toggles */}
             <div className="flex bg-[#f8faf4] p-1.5 rounded-xl mb-8">
               <button 
                 onClick={() => setIsPM(false)}
                 className={`flex-1 py-2 text-sm font-black rounded-lg transition-all ${!isPM ? 'bg-white text-[#fb923c] shadow-sm' : 'text-[#98c9a3]'}`}
               >
                 AM
               </button>
               <button 
                 onClick={() => setIsPM(true)}
                 className={`flex-1 py-2 text-sm font-black rounded-lg transition-all ${isPM ? 'bg-white text-[#77bfa3] shadow-sm' : 'text-[#98c9a3]'}`}
               >
                 PM
               </button>
             </div>

             {/* Clock Face Grids */}
             <div className="relative h-56 mb-8">
               {mode === 'hour' ? (
                 <div className="grid grid-cols-4 gap-3 h-full animate-in zoom-in-95 duration-200">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
                      <button 
                        key={h}
                        onClick={() => handleHourClick(h)}
                        className={`rounded-2xl font-black text-lg transition-all flex items-center justify-center ${hour12 === h ? 'bg-[#77bfa3] text-white shadow-md scale-110' : 'bg-[#f8faf4] text-[#627833] hover:border hover:border-[#bfd8bd]'}`}
                      >
                        {h}
                      </button>
                    ))}
                 </div>
               ) : (
                 <div className="grid grid-cols-4 gap-3 h-full animate-in zoom-in-95 duration-200">
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                      <button 
                        key={m}
                        onClick={() => handleMinuteClick(m)}
                        className={`rounded-2xl font-black text-lg transition-all flex items-center justify-center ${minute === m ? 'bg-[#77bfa3] text-white shadow-md scale-110' : 'bg-[#f8faf4] text-[#627833] hover:border hover:border-[#bfd8bd]'}`}
                      >
                        {m.toString().padStart(2, '0')}
                      </button>
                    ))}
                 </div>
               )}
             </div>

             <button 
               onClick={applyTime}
               className="w-full py-4 bg-[#313c1a] hover:bg-black text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg"
             >
               Confirm Time
             </button>
          </div>
        </div>
      )}
    </>
  );
}
