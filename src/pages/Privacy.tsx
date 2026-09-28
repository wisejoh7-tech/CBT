import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { ScrollArea } from '@/lib/ui/scroll-area';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/20 font-sans antialiased text-slate-900 relative overflow-hidden">
      <div className="cbt-background" />

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
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black tracking-[0.3em] text-primary">Privacy Protocol</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter leading-none">
            Privacy Policy.
          </h1>
          <p className="text-sm font-black text-slate-400 tracking-widest uppercase">Global Data Protection Compliance</p>
        </div>

        <div className="bg-white rounded-[48px] border border-primary/5 shadow-2xl overflow-hidden p-12">
          <ScrollArea className="h-[600px] pr-8">
            <div className="space-y-12">
              <div className="flex items-start gap-6 p-8 bg-primary/5 rounded-3xl border border-primary/5">
                <Lock className="w-10 h-10 text-primary shrink-0" />
                <div>
                   <h3 className="font-black text-lg text-primary uppercase mb-2">We value your privacy</h3>
                   <p className="text-sm text-slate-600 font-medium leading-relaxed">VIVI CBT uses advanced encryption to protect your biometric data and examination records. We never share your personal information with third parties without institutional consent.</p>
                </div>
              </div>

              {[
                { title: 'Data Collection', content: 'We collect biographic data, email addresses, and real-time biometric snapshots (webcam) solely for the purpose of examination authentication and security monitoring.' },
                { title: 'AI Monitoring', content: 'Our AI proctoring engine analyzes behavioral patterns during active sessions. This data is used only for integrity verification and is automatically purged following result publication.' },
                { title: 'Information Security', content: 'All passwords are salted and hashed using industry-standard bcrypt protocols. Data transmission is secured via HTTPS/TLS 1.2+ encryption.' },
                { title: 'Cookie Protocol', content: 'We use session tokens stored in local storage to maintain your authenticated state. No tracking or marketing cookies are utilized on this platform.' },
                { title: 'Data Subject Rights', content: 'Candidates may request access to their performance records or data deletion through their registered institution following the final result release.' }
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
        <p className="text-[10px] font-black tracking-[0.3em]">&copy; 2026 VIVI CBT SYSTEMS • PRIVACY DIVISION</p>
      </footer>
    </div>
  );
}
