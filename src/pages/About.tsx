import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { ArrowLeft, GraduationCap, ShieldCheck, Globe, Cpu } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50/20 font-sans antialiased text-slate-900 relative overflow-hidden">
      <div className="cbt-background" />

      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-primary/5 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">V</div>
          <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
        </div>
        <Button variant="ghost" onClick={() => navigate('/')} className="text-primary/900 hover:text-primary/900 gap-2 font-black text-[8px] tracking-widest ">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </header>

      <main className="max-w-4xl mx-auto py-20 px-8 space-y-20 relative z-10">
        <section className="text-center space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-primary/10 bg-white shadow-md">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[9px] font-black tracking-[0.3em] text-primary">About VIVI Systems</span>
          </motion.div>
          <motion.h6 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-2xl md:text-2xl font-black text-primary tracking-tighter leading-none">
            Empowering the Future <br/> of Examination.
          </motion.h6>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm text-primary font-medium max-w-2xl mx-auto leading-relaxed">
            VIVI CBT is a high-fidelity examination portal engineered for integrity, security, and scalability. We provide academic institutions with the tools they need to conduct fair and seamless digital assessments.
          </motion.p>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          {[
            { icon: ShieldCheck, title: 'Total Security', desc: 'Advanced AI proctoring and biometric verification to ensure session integrity.' },
            { icon: Globe, title: 'Global Standard', desc: 'Compliance with international examination protocols and academic standards.' },
            { icon: Cpu, title: 'Smart Analysis', desc: 'Real-time performance metrics and deep topic mastery analysis for candidates.' }
          ].map((feature, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="p-8 bg-white rounded-[12px] border border-primary/900 shadow-xl hover:shadow-2xl transition-all space-y-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <feature.icon className="w-6 h-6" />
              </div>
              <h6 className="font-black text-sm tracking-tight text-slate-800 uppercase">{feature.title}</h6>
              <p className="text-sm text-primary font-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="p-6 bg-primary rounded-[12px] text-white relative overflow-hidden shadow-2xl shadow-primary/20 text-center space-y-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <h4 className="text-2xl font-black tracking-tight leading-none relative z-10">Ready to join thousands of <br/> successful candidates?</h4>
          <Button onClick={() => navigate('/candidate-register')} className="h-16 px-12 bg-white text-primary rounded-2xl font-black text-xs tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10 uppercase">
            Start Registration
          </Button>
        </section>
      </main>

      <footer className="py-20 text-center border-t border-primary/5 opacity-40">
        <p className="text-[10px] font-black tracking-[0.3em]">&copy; 2026 VIVI CBT SYSTEMS • ACADEMIC EXCELLENCE</p>
      </footer>
    </div>
  );
}
