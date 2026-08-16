import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

import { Label } from '@/lib/ui/label';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  newQuestion: { text: string; options: string[]; correctOptionIndex: number; topic: string };
  setNewQuestion: (val: any) => void;
  handleAddQuestion: (e: React.FormEvent) => void;
}

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  newQuestion,
  setNewQuestion,
  handleAddQuestion,
}) => {
  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6 text-base overflow-hidden">
      <div className="cbt-background opacity-[0.05] pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-8 border border-primary/5 overflow-hidden relative z-10"
      >
        <h3 className="text-xl font-black text-primary mb-6 text-center tracking-tighter uppercase">Set Subject</h3>
        <form onSubmit={handleAddQuestion} className="space-y-4 font-medium">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Questions</Label>
            <textarea
              value={newQuestion.text}
              onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
              placeholder=""
              required
              className="w-full h-24 px-6 py-4 rounded-2xl bg-slate-50 border-2 border-primary/20 font-bold text-xs shadow-inner outline-none focus:border-primary focus:ring-0 resize-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="space-y-1.5">
                <Label className="text-[10px] font-black text-primary/30 tracking-widest ">Option {String.fromCharCode(65 + i)}</Label>
                <Input
                  placeholder={`option ${String.fromCharCode(65 + i)}`}
                  value={newQuestion.options[i]}
                  onChange={e => {
                    const opts = [...newQuestion.option];
                    opts[i] = e.target.value;
                    setNewQuestion({...newQuestion, options: opts});
                  }}
                  required
                  className="h-10 px-5 rounded-xl bg-slate-50 font-bold text-xs shadow-inner"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Correct Answer</Label>
              <select
                value={newQuestion.correctOptionIndex}
                onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})}
                className="w-full h-10 px-5 rounded-xl bg-slate-50 border-2 border-primary/20 font-bold text-xs outline-none shadow-inner focus:border-primary transition-all"
              >
                <option value={0}>Answer: a</option>
                <option value={1}>Answer: b</option>
                <option value={2}>Answer: c</option>
                <option value={3}>Answer: d</option>
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-[11px] font-black text-primary/40 tracking-widest uppercase">Topic Tag</Label>
              <Input
                placeholder="e.g. Algebra"
                value={newQuestion.topic}
                onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
                className="h-10 px-5 rounded-xl bg-slate-50 font-bold text-xs shadow-inner"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1 h-14 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all tracking-widest text-xs uppercase">Commit Item</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-14 px-8 rounded-2xl font-black text-xs border-primary/10 uppercase">Discard</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
