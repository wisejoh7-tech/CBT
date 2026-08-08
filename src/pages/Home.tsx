import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Input } from '@/lib/ui/input';
import { GraduationCap, Shield, BookOpen, School, CheckCircle, ArrowRight, User, Lock, Monitor, Zap, ShieldCheck, PieChart, Smartphone, Search, FileCheck, Globe, Clock, MessageSquare } from 'lucide-react';
import { Separator } from '@/lib/ui/separator';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [showExamInput, setShowExamInput] = useState(false);

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
            <span className="font-black text-1xl tracking-tighter text-primary">VIVI CBT</span>
          </div>
          <div className="h-8 w-[1px] bg-primary/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 text-primary/40">
            <div className="relative">
              <Monitor className="w-6 h-6" />
              <User className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-none text-left">VIVI Standard<br/>Examination Portal</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => navigate('/')} className="text-[14px] font-black tracking-widest text-primary transition-colors uppercase">Home</button>
          <button onClick={() => navigate('/candidate-login')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Candidate Login</button>
          <button onClick={() => navigate('/candidate-register')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Register</button>
          <button onClick={() => navigate('/results')} className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors uppercase">Check Results</button>

          {user && isAdmin && (
            <>
              <Separator orientation="vertical" className="h-4 bg-primary/10" />
              <button
                onClick={() => navigate('/admin')}
                className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2 uppercase"
              >
                <Shield className="w-3.5 h-3.5" />
                Go to Admin Panel
              </button>
            </>
          )}
          {user && !isAdmin && (
            <>
              <Separator orientation="vertical" className="h-4 bg-primary/10" />
              <button
                onClick={() => navigate('/dashboard')}
                className="text-[14px] font-black tracking-widest text-primary/40 hover:text-primary transition-colors flex items-center gap-2 uppercase"
              >
                <User className="w-3.5 h-3.5" />
                Exam Terminal
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-16 px-6 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="cbt-background opacity-[0.15]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(var(--primary)_1.5px,transparent:1.5px)] [background-size:32px_32px] opacity-[0.05]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto relative z-10 text-center max-w-5xl"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-4 px-6 py-2.5 rounded-full border-2 border-primary/20 bg-white shadow-sm">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">Standard Examination Portal</span>
          </motion.div>

          <motion.h5 variants={itemVariants} className="text-2xl md:text-2xl font-black text-primary tracking-tighter leading-[0.9] mb-4">
            The Future of <br/> <br/> <span className="text-primary/40 ">Digital Examination</span>
          </motion.h5>

          <motion.p variants={itemVariants} className="text-base md:text-lg text-primary/60 font-medium mb-4 max-w-2xl mx-auto leading-relaxed">
            Welcome to VIVI CBT Systems, where cutting-edge technology meets academic excellence. Our platform provides a secure, seamless, and fair environment for standardized continuous assessments and examination.
          </motion.p>

          {/* Central Hero Buttons Removed */}
        </motion.div>
      </header>

      {/* Quick Statistics Bar */}
      <section className="bg-primary py-6">
        <div className="container mx-auto px-2 max-w-[1600px]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Registered Candidates', value: '50,000+', icon: User },
              { label: 'Exams Conducted', value: '1.2M+', icon: FileCheck },
              { label: 'States Reached', value: '36/36', icon: Globe },
              { label: 'Uptime Reliability', value: '99.9%', icon: Zap },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tighter">{stat.value}</h3>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Institutional Hub */}
      <main className="container mx-auto px-6 py-12 max-w-[1600px]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="rounded-[20px] border-2 border-primary/10 bg-white overflow-hidden relative min-h-[700px] flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

            <div className="grid md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-primary/5 flex-1">
              <div className="p-8 md:p-12 space-y-6 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/5 rounded-1xl flex items-center justify-center">
                    <School className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter uppercase leading-none">A World-Class <br/>Learning Campus</h2>
                  <p className="text-[13px] text-primary/60 leading-relaxed font-medium">
                    VIVI International is a premier educational ecosystem dedicated to fostering global leaders. Our sanctuary for intellectual curiosity blends cutting-edge infrastructure with a supportive global community.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    'Smart Classrooms & Hybrid Hubs',
                    'Advanced Scientific & Tech Labs',
                    'Global Accreditation & Mentorship'
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-primary/80 font-black text-[9px] uppercase tracking-wider">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative aspect-square rounded-3xl bg-slate-100 border-2 border-primary/5 overflow-hidden group">
                    <img
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop"
                      alt="CBT Environment"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">CBT Lab Alpha</span>
                    </div>
                  </div>
                  <div className="relative aspect-square rounded-3xl bg-slate-100 border-2 border-primary/5 overflow-hidden group">
                    <img
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=800&auto=format&fit=crop"
                      alt="Students Writing Exam"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">Digital Terminal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Section */}
              <div className="p-8 md:p-12 space-y-6 flex flex-col justify-center bg-slate-50/30">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-black text-primary tracking-tighter uppercase leading-none">Excellence In <br/>Examination</h2>
                  <p className="text-[12px] text-primary/60 leading-relaxed font-medium">
                    The VIVI CBT platform is the gold standard for academic assessment. We prioritize integrity and efficiency, providing an unbiased system that recognizes and rewards true potential.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-white rounded-3xl border-2 border-primary/5 shadow-sm">
                    <h4 className="font-black text-primary text-lg mb-1 uppercase tracking-tighter">Precision</h4>
                    <p className="text-[8px] font-black text-primary/30 uppercase tracking-[0.2em]">Auto-Scoring</p>
                  </div>
                  <div className="p-5 bg-white rounded-3xl border-2 border-primary/5 shadow-sm">
                    <h4 className="font-black text-primary text-lg mb-1 uppercase tracking-tighter">Security</h4>
                    <p className="text-[8px] font-black text-primary/30 uppercase tracking-[0.2em]">Verified Identity</p>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                   <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-[10px] font-black">V</div>
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">10,000+ Active Users</p>
                  </div>
                  <Button
                    onClick={() => navigate('/results')}
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-2 border-primary/10 font-black text-[11px] tracking-widest uppercase hover:bg-white"
                  >
                    Verify Results Portal
                  </Button>
                </div>

                <div className="relative h-40 rounded-[32px] bg-slate-200 border-2 border-primary/5 overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop"
                    alt="University Campus"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <p className="text-[10px] font-black text-white tracking-[0.3em] uppercase">VIVI Global Training Center</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>

      <section className="py-12 bg-white overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1600px]">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-primary tracking-tighter  leading-[0.9]">Start Your Journey <br/> <br/> <span className="text-primary/40">In 4 Easy Steps</span></h2>
                <p className="text-base text-primary/60 font-medium max-w-xl">
                  We've streamlined our process to ensure you spend less time on paperwork and more time on preparation.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { step: "01", title: "Digital Registration", desc: "Complete your profile and select your subject combination in minutes." },
                  { step: "02", title: "Secure Verification", desc: "Verify your identity through our encrypted email and token system." },
                  { step: "03", title: "Examination Terminal", desc: "Access your scheduled exams through our high-performance CBT portal." },
                  { step: "04", title: "Instant Certification", desc: "View, download, and print your results immediately after completion." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-6 items-start group">
                    <span className="text-3xl font-black text-primary/10 group-hover:text-primary/40 transition-colors">{item.step}</span>
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-primary uppercase">{item.title}</h4>
                      <p className="text-[12px] font-medium text-primary/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-primary/5 rounded-[50px] -rotate-4 scale-105 pointer-events-none" />
              <Card className="relative rounded-[50px] border-3 border-primary/6 bg-white p-10 shadow-2xl overflow-hidden aspect-square flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                    <Zap className="w-12 h-12 text-primary animate-pulse" />
                 </div>
                 <h3 className="text-2xl font-black text-primary mb-4  tracking-tighter">Ready to Begin?</h3>
                 <p className="text-sm text-primary/60 font-medium mb-4 max-w-xs">Join thousands of students in the next generation of academic assessment.</p>
                 <Button
                   onClick={() => navigate('/candidate-register')}
                   className="h-12 px-12 bg-primary text-white rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:scale-105 transition-all uppercase"
                 >
                   Register Now
                 </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 z-10 w-full text-center border-t border-primary/5 bg-slate-50">
        <div className="container mx-auto px-6 max-w-[1440px]">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm">V</div>
            <span className="font-black text-lg tracking-tighter text-primary">VIVI CBT SYSTEMS</span>
          </div>
          <p className="text-[10px] font-bold text-primary/80 tracking-widest uppercase mb-4">
            &copy; {new Date().getFullYear()} VIVI CBT Systems. All Rights Reserved. <br/>
            Engineered for Academic Integrity.
          </p>
          <button onClick={() => navigate('/admin/auth')} className="text-[8px] font-black text-primary/5 hover:text-primary transition-colors flex items-center gap-1 mx-auto uppercase mt-4">
            <Lock className="w-2 h-2" /> Authorized Access
          </button>
        </div>
      </footer>
    </div>
  );
}
