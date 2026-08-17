import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { ArrowLeft, FileText, Scale } from 'lucide-react';
import { ScrollArea } from '@/lib/ui/scroll-area';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 relative overflow-hidden">
      <div className="cbt-background opacity-[0.03] pointer-events-none" />

      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-primary/5 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">V</div>
          <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')} className="text-primary/40 hover:text-primary gap-2 font-black text-[10px] tracking-widest uppercase">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </header>

      <main className="max-w-4xl mx-auto py-20 px-8 relative z-10">
        <div className="text-center space-y-6 mb-16">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-primary/10 bg-white shadow-md">
            <Scale className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black tracking-[0.3em] text-primary">Legal Framework</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter leading-none">
            Terms of Service.
          </h1>
          <p className="text-sm font-black text-slate-400 tracking-widest uppercase">Last Protocol Update: August 2026</p>
        </div>

        <div className="bg-white rounded-[48px] border border-primary/5 shadow-2xl overflow-hidden p-12">
          <ScrollArea className="h-[600px] pr-8">
            <div className="space-y-12">
              {[
                { title: '01. User Eligibility', content: 'Candidates must be registered with a valid email and unique examination number. Unauthorized access to the examination portal is strictly prohibited and subject to legal action.' },
                { title: '02. Code of Conduct', content: 'During examinations, candidates must adhere to AI proctoring regulations. Use of external aids, unauthorized software, or attempts to bypass security protocols will result in immediate disqualification.' },
                { title: '03. Identity Verification', content: 'VIVI CBT utilizes biometric and live-capture verification. By using this service, you consent to identity checks throughout the examination session.' },
                { title: '04. Data Transmission', content: 'Session progress is synchronized in real-time. In the event of network failure, locally cached data will be recovered upon reconnection. VIVI Systems is not responsible for hardware failure at the candidate terminal.' },
                { title: '05. Result Policy', content: 'Examination results are subject to administrative audit. The institution reserves the right to withhold or nullify results if security violations are detected post-session.' }
              ].map((section, i) => (
                <div key={i} className="space-y-4">
                  <h3 className="font-black text-lg tracking-tight text-slate-800 uppercase border-b border-primary/5 pb-2">{section.title}</h3>
                  <p className="text-slate-600 font-medium leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>

      <footer className="py-20 text-center border-t border-primary/5 opacity-40">
        <p className="text-[10px] font-black tracking-[0.3em]">&copy; 2026 VIVI CBT SYSTEMS • LEGAL DIVISION</p>
      </footer>
    </div>
  );
}
