import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { GraduationCap, BookOpen, CheckCircle, ArrowRight, User, Lock, Monitor, Zap, FileCheck, Globe, Menu, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/src/context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/20 selection:bg-primary/10 font-sans relative antialiased tracking-tight">
      <div className="cbt-background" />

      {/* Navigation */}
      <nav className="sticky top-0 w-full bg-white/90 backdrop-blur-md border-b border-primary/5 px-8 py-4 flex justify-between items-center z-[100]">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/10">V</div>
          <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-wrap justify-end">
          {[
            { label: 'HOME', path: '/' },
            { label: 'CANDIDATE LOGIN', path: '/candidate-login' },
            { label: 'STAFF PORTAL', path: '/staff' },
            { label: 'ADMIN REGISTER', path: '/admin/auth' },
            { label: 'LOGIN', path: '/candidate-login' },
            { label: 'REGISTER', path: '/candidate-register' },
            { label: 'RESULTS', path: '/results' }
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="text-[10px] font-black tracking-widest px-4 h-9 text-white hover:bg-primary/90 active:bg-green-600 transition-colors bg-primary rounded-3xl uppercase"
            >
              {item.label}
            </button>
          ))}
          {user && (
            <Button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="h-9 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-[11px] tracking-widest shadow-md hover:scale-105 transition-all uppercase"
            >
              {isAdmin ? "Admin Portal" : "Candidate Portal"}
            </Button>
          )}
        </div>

        <button className="md:hidden p-2 text-primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-white border-b border-primary/10 md:hidden shadow-2xl p-8 flex flex-col gap-6"
            >
              {[
                { label: 'Home', path: '/' },
                { label: 'Candidate Login', path: '/candidate-login' },
                { label: 'Staff Portal', path: '/staff' },
                { label: 'Admin Register', path: '/admin/auth' },
                { label: 'Candidate Register', path: '/candidate-register' },
                { label: 'Results', path: '/results' }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setIsMenuOpen(false); }}
                  className="text-left text-[12px] font-black tracking-widest text-primary/80 uppercase"
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}

      <header className="relative pt-24 pb-16 px-8 bg-slate-50/10 overflow-hidden min-h-[60vh] flex items-center">

        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:40px_40px] opacity-[0.05]" />
        </div>
        <div className="container mx-auto text-center max-w-4xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 mb-8 px-6 py-2 rounded-full border-2  bg-white shadow-md  border-primary/100">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.3em] text-primary border-primary/100 border-2">Standard Examination Portal</span>
          </motion.div>

          <motion.h4 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-2xl md:text-1xl font-black text-blue/90 tracking-tighter leading-[1.8] mb-8 ">
            The Gold  Standard <br/> <span className="text-blue/90">In CBT Excellence</span>
          </motion.h4>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-sm md:text-base text-blue/100 font-large mb-12 max-w-2xl text-bold mx-auto leading-relaxed">
            Welcome to VIVI CBT Systems, where cutting-edge technology meets academic excellence. Experience a secure, fair, and seamless examination environment.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
            <Button onClick={() => navigate('/candidate-login')} className="h-14 px-8 bg-primary text-white rounded-2xl font-black text-sm tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 active:bg-green-700 transition-all flex gap-2 items-center justify-center">
              Candidate Login <ArrowRight className="w-5 h-5" />
            </Button>
            <Button onClick={() => navigate('/staff')} className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex gap-2 items-center justify-center">
              Staff & Admin Portal <Lock className="w-4 h-4" />
            <Button onClick={() => navigate('/candidate-login')} variant="outline" className="h-14 px-8 border-2 border-primary text-primary font-black text-sm tracking-widest bg-white hover:bg-slate-50 transition-all">
              Candidate Login
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Stats */}
      <section className="py-12 border-y-2 border-primary/5 bg-white">
        <div className="container mx-auto px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'Registered Candidates', value: '50,000+', icon: User },
              { label: 'Exams Conducted', value: '1.2M+', icon: FileCheck },
              { label: 'States Reached', value: '36/36', icon: Globe },
              { label: 'Uptime Reliability', value: '99.9%', icon: Zap },
            ].map((stat, idx) => (
              <div key={idx} className="text-center group space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-primary tracking-tighter">{stat.value}</h3>
                  <p className="text-[9px] font-black text-primary/30 tracking-[0.2em]">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <main className="py-20 px-8 bg-slate-50/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center md:text-left">
              <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter text-primary leading-none text-balance">Intelligent <br/>Proctoring Systems</h2>
                <p className="text-base text-primary/60 leading-relaxed font-medium text-balance">
                  Our platform integrates advanced AI behavioral monitoring and biometric verification to ensure absolute integrity during every examination session.
                </p>
              </div>
              <div className="space-y-3 inline-block text-left">
                {['Live Biometric Verification', 'Real-time Threat Detection', 'Automated Session Recovery'].map(item => (
                  <div key={item} className="flex items-center gap-4 text-[10px] font-black tracking-widest text-primary/80">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-8 bg-white rounded-[32px] border-2 border-primary/5 shadow-xl hover:shadow-2xl transition-all">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                   <Monitor className="w-7 h-7 text-blue-600" />
                </div>
                <h4 className="font-black text-xs mb-3 tracking-widest">Digital Interface</h4>
                <p className="text-[10px] font-bold text-primary/40 leading-relaxed">High-fidelity VIVI CBT simulation terminal designed for peak performance.</p>
              </Card>
              <Card className="p-8 bg-primary rounded-[32px] text-white shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                   <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h4 className="font-black text-sm mb-3 tracking-widest">Global Curriculum</h4>
                <p className="text-[10px] font-bold text-white/40 leading-relaxed">Comprehensive management for all VIVI cbt elective subjects and combinations.</p>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Steps Section */}
      <section className="py-20 bg-white px-8">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-black  text-primary/60 mb-12">The Journey</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-primary/60">
            {[
              { step: '1', label: 'Registration', desc: 'Secure Enrollment' },
              { step: '2', label: 'Verification', desc: 'Biometric Check' },
              { step: '3', label: 'Examination', desc: 'Real-time Testing' },
              { step: '4', label: 'Results', desc: 'Instant Analysis' },
            ].map((s, idx) => (
              <div key={idx} className="space-y-6 group">
                <div className="relative inline-block">
                  <span className="text-5xl font-black text-primary/5 block group-hover:text-primary/10 transition-colors">{s.step}</span>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.2em] text-primary mb-1">{s.label}</p>
                  <p className="text-[8px] font-bold text-primary/30 tracking-widest">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t-2 border-primary/5 text-center bg-slate-50 px-8">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20">V</div>
          <span className="font-black text-lg tracking-tighter text-primary">VIVI CBT SYSTEMS</span>
        </div>
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex justify-center gap-6 flex-wrap px-4">
            {[
              { label: 'ABOUT', path: '/about' },
              { label: 'CONTACT', path: '/contact' },
              { label: 'STAFF PORTAL', path: '/staff' },
              { label: 'TERMS', path: '/terms' },
              { label: 'PRIVACY', path: '/privacy' }
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className="text-[10px] font-black tracking-widest text-primary/30 hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black text-primary/30 tracking-[0.3em] leading-relaxed">
            &copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved. <br/>
            Engineered for academic integrity and global excellence.
          </p>
          
        </div>
      </footer>
    </div>
  );
}
