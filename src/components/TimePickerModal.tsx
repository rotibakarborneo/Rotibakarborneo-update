import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Sparkles } from 'lucide-react';

interface TimePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onSelect: (timeStr: string) => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  isOpen,
  onClose,
  value,
  onSelect
}) => {
  // Parse initial value like "16:30 - 02:00 WITA"
  const [bukaJam, setBukaJam] = useState<string>('16');
  const [bukaMenit, setBukaMenit] = useState<string>('30');
  const [tutupJam, setTutupJam] = useState<string>('02');
  const [tutupMenit, setTutupMenit] = useState<string>('00');
  const [timezone, setTimezone] = useState<string>('WIB');

  useEffect(() => {
    if (!value) return;
    try {
      // Regex parse "HH:MM - HH:MM TZ"
      const match = value.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})(?:\s*([A-Za-z]+))?/);
      if (match) {
        setBukaJam(match[1].padStart(2, '0'));
        setBukaMenit(match[2].padStart(2, '0'));
        setTutupJam(match[3].padStart(2, '0'));
        setTutupMenit(match[4].padStart(2, '0'));
        if (match[5]) setTimezone(match[5].toUpperCase());
      }
    } catch {
      // Keep defaults
    }
  }, [value, isOpen]);

  if (!isOpen) return null;

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const presets = [
    { label: 'Shift Standar (Krapyak/Kadipiro)', value: '15:00 - 02:00 WIB' },
    { label: 'Shift Jakal', value: '15:00 - 01:00 WIB' },
    { label: 'Shift Timoho', value: '12:00 - 23:00 WIB' },
    { label: 'Shift Malioboro', value: '14:00 - 03:00 WIB' },
    { label: 'Shift Nologaten', value: '18:00 - 05:00 WIB' }
  ];

  const handleApply = () => {
    const formatted = `${bukaJam}:${bukaMenit} - ${tutupJam}:${tutupMenit} ${timezone}`;
    onSelect(formatted);
    onClose();
  };

  const handleSelectPreset = (presetValue: string) => {
    onSelect(presetValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-fade-in">
      <div className="ios-glass-card border border-white/20 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Pilih Jam Operasional</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Display */}
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 text-center mb-4">
          <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block mb-1">
            Pratinjau Jam
          </span>
          <div className="text-2xl font-black font-mono text-white tracking-wide">
            <span className="text-sky-400">{bukaJam}:{bukaMenit}</span>
            <span className="text-slate-500 mx-2">—</span>
            <span className="text-indigo-400">{tutupJam}:{tutupMenit}</span>
            <span className="text-xs font-sans text-amber-400 ml-2 font-bold px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
              {timezone}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-slate-400 block mb-2">Preset Cepat:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-white border border-white/10 text-left text-xs transition flex items-center justify-between cursor-pointer"
              >
                <span className="truncate">{p.label}</span>
                <span className="font-mono text-[10px] text-indigo-300 shrink-0 ml-1">{p.value.replace(' WIB', '')}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Time Selector */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Jam Buka */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
            <span className="text-xs font-bold text-sky-400 block mb-2">Jam Buka</span>
            <div className="flex items-center gap-1">
              <select
                value={bukaJam}
                onChange={(e) => setBukaJam(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm font-mono text-white font-bold text-center focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {hours.map((h) => (
                  <option key={h} value={h} className="bg-slate-900 text-white">
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 font-bold">:</span>
              <select
                value={bukaMenit}
                onChange={(e) => setBukaMenit(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm font-mono text-white font-bold text-center focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {minutes.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Jam Tutup */}
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10">
            <span className="text-xs font-bold text-indigo-400 block mb-2">Jam Tutup</span>
            <div className="flex items-center gap-1">
              <select
                value={tutupJam}
                onChange={(e) => setTutupJam(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm font-mono text-white font-bold text-center focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {hours.map((h) => (
                  <option key={h} value={h} className="bg-slate-900 text-white">
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-slate-400 font-bold">:</span>
              <select
                value={tutupMenit}
                onChange={(e) => setTutupMenit(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm font-mono text-white font-bold text-center focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {minutes.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timezone picker */}
        <div className="flex items-center justify-between mb-5 px-1">
          <span className="text-xs text-slate-400 font-medium">Zona Waktu:</span>
          <div className="flex items-center gap-1.5">
            {['WIB', 'WITA', 'WIT'].map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => setTimezone(tz)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  timezone === tz
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {tz}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Terapkan Jam
          </button>
        </div>
      </div>
    </div>
  );
};
