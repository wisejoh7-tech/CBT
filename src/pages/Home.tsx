import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { GraduationCap, Shield, BookOpen, School, CheckCircle, ArrowRight, User, Lock } from 'lucide-react';
import { Separator } from '@/lib/ui/separator';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'reg_admin';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", damping: 25, stiffness: 100 }
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-white selection:bg-primary/10">
      {/* Navigation */}
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b-2 border-primary/10 px-8 py-4 flex justify-between items-center z-[100] shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
          <span className="font-black text-xl tracking-tighter text-primary">VIVI CBT</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-primary transition-colors uppercase">Home</button>
          {!user && (
            <>
              <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Candidate Login</button>
              <button onClick={() => navigate('/results')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Check Results</button>
              <Separator orientation="vertical" className="h-4 bg-primary/10" />
              <button onClick={() => navigate('/staff')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2 uppercase">
                <User className="w-3 h-3" /> Staff Portal
              </button>
            </>
          )}
          {user && (
            <button
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2 uppercase"
            >
              {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              Go to {isAdmin ? 'Admin Panel' : 'Exam Terminal'}
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-24 px-6 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto relative z-10 text-center max-w-3xl"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-8 px-6 py-2.5 rounded-full border-2 border-primary/20 bg-white shadow-sm">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[12px] font-black tracking-[0.2em] text-primary uppercase">Elite Academic Assessment Center</span>
          </motion.div>

          <motion.h4 variants={itemVariants} className="text-4xl md:text-5xl font-black text-primary tracking-tighter leading-[0.9] mb-8">
            The Future of <br/> <span className="text-primary/40 uppercase">Digital Examination.</span>
          </motion.h4>

          <motion.p variants={itemVariants} className="text-base text-primary/60 font-medium mb-12 max-w-xl mx-auto leading-relaxed">
            Welcome to VIVI CBT Systems, where cutting-edge technology meets academic excellence. Our platform provides a secure, seamless, and fair environment for standardized testing and assessments.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate(user ? (isAdmin ? '/admin' : '/dashboard') : '/candidate-login')}
              className="h-16 px-10 bg-primary text-white rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 border-none active:scale-95 flex items-center gap-3 uppercase"
            >
              {user ? 'Enter Dashboard' : 'Start Examination'} <ArrowRight className="w-5 h-5" />
            </Button>
            <Button onClick={() => navigate('/results')} variant="outline" className="h-16 px-10 border-2 border-primary/20 text-primary rounded-2xl font-black text-lg active:scale-95 uppercase">
              Verify Results
            </Button>
          </motion.div>
        </motion.div>
      </header>

      {/* School & Exam Description Section */}
      <main className="container mx-auto px-6 py-24 space-y-24 max-w-5xl">
        {/* School Description */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4">
            <div className="w-12 h-12 bg-primary/5 rounded-[24px] flex items-center justify-center mb-2">
              <School className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase">About VIVI International</h2>
            <p className="text-base text-primary/60 leading-relaxed font-medium">
              VIVI International is a premier educational institution dedicated to fostering global leaders through innovation and rigorous academic standards.
            </p>
            <ul className="space-y-3">
              {['State-of-the-art Infrastructure', 'Expert Faculty & Mentorship', 'Global Accreditation'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-primary/80 font-bold text-sm uppercase">
                  <CheckCircle className="w-4 h-4 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative aspect-video rounded-[32px] bg-primary/5 border-2 border-primary/10 overflow-hidden shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center font-black text-primary/5 text-4xl">CAMPUS</div>
          </motion.div>
        </section>

        {/* Exam Description */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="md:order-1 relative aspect-video rounded-[32px] bg-primary/5 border-2 border-primary/10 overflow-hidden shadow-xl order-2">
            <div className="absolute inset-0 flex items-center justify-center font-black text-primary/5 text-4xl uppercase">Exam</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4 md:order-2 order-1">
            <div className="w-12 h-12 bg-primary/5 rounded-[24px] flex items-center justify-center mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase">Unified Assessment</h2>
            <p className="text-base text-primary/60 leading-relaxed font-medium">
              The VIVI CBT platform is designed to provide an unbiased, efficient, and instantaneous evaluation system.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-primary/5">
                <h4 className="font-black text-primary text-lg mb-0.5">Instant</h4>
                <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Real-time Results</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-primary/5">
                <h4 className="font-black text-primary text-lg mb-0.5">Secure</h4>
                <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Biometric Login</p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="py-20 z-10 w-full text-center border-t border-primary/5 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm">V</div>
            <span className="font-black text-lg tracking-tighter text-primary">VIVI CBT SYSTEMS</span>
          </div>
          <p className="text-[10px] font-bold text-primary/20 tracking-widest uppercase mb-4">
            &copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved. <br/>
            Engineered for Academic Integrity.
          </p>
          <button onClick={() => navigate('/admin/auth')} className="text-[8px] font-black text-primary/10 hover:text-primary transition-colors flex items-center gap-1 mx-auto uppercase">
            <Lock className="w-2 h-2" /> System Administration
          </button>
        </div>
      </footer>
    </div>
  );
}
