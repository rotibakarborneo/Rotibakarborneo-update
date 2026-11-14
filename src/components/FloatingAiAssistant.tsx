import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, RotateCcw, Copy, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { ChatMarkdown } from './ChatMarkdown';

const getWibTimeStr = () =>
  new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';

export const FloatingAiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string }>
  >([
    {
      sender: 'ai',
      text: 'Halo Bos! Tanya apa saja tentang status 6 gerai, omzet, laporan shift, kasbon, atau payroll.',
      time: getWibTimeStr()
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (quickPrompt?: string) => {
    const textToSend = (quickPrompt || inputText).trim();
    if (!textToSend || loading) return;

    const historySnapshot = messages
      .slice(-6)
      .map((m) => ({ sender: m.sender, text: m.text }));

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: textToSend, time: getWibTimeStr() }
    ]);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiService.askAiAssistant(textToSend, historySnapshot);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          time: getWibTimeStr()
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Maaf Bos, gagal menghubungi server asisten AI.',
          time: getWibTimeStr()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const quickChips = [
    'Gerai mana yang buka?',
    'Rekap payroll bulan ini',
    'Ada kasbon menunggu?',
    'Omzet kasir & terlaris'
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-2xl shadow-blue-950/60 border border-white/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Tanya AI Bos</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] max-h-[85vh] flex flex-col rounded-3xl ios-glass border border-white/20 shadow-2xl overflow-hidden">
          <div className="p-3.5 bg-[#0b1120]/85 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Asisten Gemini Borneo</h4>
                <p className="text-[10px] text-slate-400">Terhubung langsung ke database</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setMessages([
                    {
                      sender: 'ai',
                      text: 'Percakapan dibersihkan. Silakan tanya data operasional gerai yang dibutuhkan.',
                      time: getWibTimeStr()
                    }
                  ])
                }
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                title="Bersihkan chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-2 border-b border-white/5 bg-black/20 flex gap-1.5 overflow-x-auto shrink-0">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((m, idx) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl p-3 text-xs leading-relaxed relative group ${
                      isUser
                        ? 'bg-sky-600/40 border border-sky-400/35 text-white rounded-tr-sm'
                        : 'bg-[#0b1120]/90 border border-white/10 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs text-white whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      <ChatMarkdown text={m.text} compact />
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/5 text-[9px] text-slate-400 font-mono">
                      <span>{m.time}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(idx, m.text)}
                          className="hover:text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Salin"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="p-2.5 rounded-2xl bg-[#0b1120]/85 border border-white/10 w-fit text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                <span>Membaca database...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2.5 border-t border-white/10 bg-black/40 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Tanya omzet, kasbon, shift, payroll..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
