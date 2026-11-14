import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  TrendingUp,
  Store,
  Wallet,
  Users,
  Package
} from 'lucide-react';
import { apiService } from '../../services/api';
import { ChatMarkdown } from '../../components/ChatMarkdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  model?: string;
}

const getWibTimeStr = () =>
  new Date().toLocaleTimeString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';

export const AiAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Halo Bos! Saya siap bantu cek data operasional Roti Bakar Borneo di 6 gerai Yogyakarta (Krapyak, Kadipiro, Jakal, Timoho, Malioboro, Nologaten).\n\nSilakan tanya apa saja seputar gerai yang buka, omzet POS, laporan rekonsiliasi shift, kasbon, atau hitungan payroll.`,
      timestamp: getWibTimeStr()
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    {
      label: 'Status 6 Gerai Sekarang',
      icon: <Store className="w-3.5 h-3.5 text-sky-400" />,
      text: 'Gerai mana saja yang buka hari ini dan mana yang tutup? Sebutkan data penjualannya.'
    },
    {
      label: 'Rekap Payroll Bulan Ini',
      icon: <Users className="w-3.5 h-3.5 text-indigo-400" />,
      text: 'Bagaimana rekap gaji karyawan bulan ini termasuk potongan telat dan kasbon?'
    },
    {
      label: 'Omzet Kasir & Terlaris',
      icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
      text: 'Berapa total omzet kasir POS hari ini dan keseluruhan, serta cabang mana yang terlaris?'
    },
    {
      label: 'Kasbon Menunggu Persetujuan',
      icon: <Wallet className="w-3.5 h-3.5 text-amber-400" />,
      text: 'Ada pengajuan kasbon yang masih menunggu persetujuan saya? Sebutkan rinciannya.'
    },
    {
      label: 'Rekonsiliasi Shift Terbaru',
      icon: <Package className="w-3.5 h-3.5 text-rose-400" />,
      text: 'Tampilkan ringkasan laporan shift terbaru dan cek apakah ada selisih stok.'
    }
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || loading) return;

    const historySnapshot = messages
      .filter((m) => m.id !== 'init-1')
      .slice(-6)
      .map((m) => ({ sender: m.sender, text: m.text }));

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: getWibTimeStr()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await apiService.askAiAssistant(textToSend, historySnapshot);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: getWibTimeStr(),
        model: res.model
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'Maaf Bos, terjadi kendala saat menghubungi asisten AI. Coba lagi sebentar.',
        timestamp: getWibTimeStr()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'ai',
        text: 'Riwayat percakapan dibersihkan. Silakan ajukan pertanyaan baru seputar data gerai Roti Bakar Borneo.',
        timestamp: getWibTimeStr()
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto space-y-4">
      {/* Top AI Banner */}
      <div className="ios-glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-950/40">
            <div className="w-full h-full rounded-[14px] bg-[#0a0f1c] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Asisten AI Roti Bakar Borneo</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Membaca langsung angka operasional, shift, kasbon, menu, dan payroll dari database.
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Bersihkan Chat</span>
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.text)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-sky-500/40 text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0"
          >
            {qp.icon}
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 p-4 rounded-3xl ios-glass shadow-xl">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-md ${
                  isUser
                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
                    : 'bg-gradient-to-tr from-amber-500 via-blue-600 to-sky-400 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs shadow-lg relative group ${
                  isUser
                    ? 'bg-sky-600/35 border border-sky-400/35 text-white rounded-tr-sm'
                    : 'bg-[#0b1120]/85 border border-white/10 text-slate-200 rounded-tl-sm backdrop-blur-md'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/5">
                  <span className="font-bold text-[11px] text-sky-300">
                    {isUser ? 'Bos Faqih' : 'Asisten Gemini'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:text-white text-slate-400 rounded cursor-pointer"
                        title="Salin jawaban"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser ? (
                  <p className="text-xs leading-relaxed text-white whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <ChatMarkdown text={m.text} />
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl shrink-0 bg-gradient-to-tr from-amber-500 via-blue-600 to-sky-400 text-white flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0b1120]/85 border border-white/10 rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1 font-medium">
                Membaca database Roti Bakar Borneo...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Bar */}
      <div className="ios-glass-card rounded-2xl p-2.5 shadow-2xl shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Tanyakan apa saja seputar omzet cabang, laporan shift, karyawan, kasbon, atau payroll..."
            disabled={loading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
