import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message Sent Successfully", {
      description: "Our support team will contact you within 24 hours."
    });
    (e.target as HTMLFormElement).reset();
  };

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

      <main className="max-w-6xl mx-auto py-20 px-8 relative z-10">
        <div className="grid lg:grid-cols-[1fr_450px] gap-20">
          <div className="space-y-12">
            <div className="space-y-6">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-6 py-2 rounded-full border-2 border-primary/10 bg-white shadow-md">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-[9px] font-black tracking-[0.3em] text-primary">Support Terminal</span>
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter leading-none">
                Contact Our <br/> Central Support.
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
                Have technical issues or general inquiries? Our specialized support team is online 24/7 to assist you.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: Phone, label: 'Helpline', value: '+234 (0) 800 VIVI CBT' },
                { icon: Mail, label: 'Official Email', value: 'support@vivicbt.com' },
                { icon: MapPin, label: 'Headquarters', value: 'Abuja Central District, FCT, Nigeria' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-lg border border-primary/5">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">{item.label}</p>
                    <p className="font-bold text-slate-700">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-10 rounded-[40px] bg-white border border-primary/5 shadow-2xl space-y-8">
              <div className="border-b border-primary/5 pb-6">
                <h3 className="text-xl font-black tracking-tight text-slate-800 uppercase">Dispatch Instruction</h3>
                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Secure Message Protocol</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase ml-1">Identity</Label>
                    <Input placeholder="Full Name" required className="h-12 px-5 rounded-2xl bg-slate-50 border-none font-bold text-xs shadow-inner" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase ml-1">Email Link</Label>
                    <Input type="email" placeholder="email@address.com" required className="h-12 px-5 rounded-2xl bg-slate-50 border-none font-bold text-xs shadow-inner" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase ml-1">Subject</Label>
                  <Input placeholder="Technical / Inquiry" required className="h-12 px-5 rounded-2xl bg-slate-50 border-none font-bold text-xs shadow-inner" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary/40 tracking-widest uppercase ml-1">Message Content</Label>
                  <textarea
                    required
                    placeholder="Enter your detailed instruction here..."
                    className="w-full h-32 px-6 py-4 rounded-3xl bg-slate-50 border-none font-bold text-xs shadow-inner outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                  />
                </div>

                <Button type="submit" className="w-full h-16 bg-primary text-white rounded-2xl font-black tracking-[0.2em] text-xs uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex gap-3">
                  <Send className="w-4 h-4" /> Send Message
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>

      <footer className="py-20 text-center border-t border-primary/5 opacity-40">
        <p className="text-[10px] font-black tracking-[0.3em]">&copy; 2026 VIVI CBT SYSTEMS • OFFICIAL SUPPORT</p>
      </footer>
    </div>
  );
}
