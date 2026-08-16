import React from 'react';
import { motion } from 'motion/react';
import { Input } from '@/lib/ui/input';
import { Button } from '@/lib/ui/button';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-primary/10 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-8 border border-primary/5 overflow-hidden">
        <h3 className="text-lg font-black uppercase text-primary mb-6 text-center">Set Assessment Item</h3>
        <form onSubmit={handleAddQuestion} className="space-y-4">
          <textarea
            value={newQuestion.text}
            onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
            placeholder="Context / question text..."
            required
            className="w-full h-24 px-5 py-3 rounded-xl bg-slate-50 border-none font-bold text-sm shadow-inner outline-none focus:ring-2 focus:ring-primary/10 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map(i => (
              <Input
                key={i}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={newQuestion.options[i]}
                onChange={e => {
                  const opts = [...newQuestion.options];
                  opts[i] = e.target.value;
                  setNewQuestion({...newQuestion, options: opts});
                }}
                required
                className="h-10 px-4 rounded-lg bg-slate-50 border-none font-bold text-xs shadow-inner"
              />
            ))}
          </div>
          <div className="flex gap-3">
            <select
              value={newQuestion.correctOptionIndex}
              onChange={e => setNewQuestion({...newQuestion, correctOptionIndex: parseInt(e.target.value)})}
              className="flex-1 h-10 px-4 rounded-lg bg-slate-50 border-none font-bold text-xs outline-none shadow-inner"
            >
              <option value={0}>Answer: A</option>
              <option value={1}>Answer: B</option>
              <option value={2}>Answer: C</option>
              <option value={3}>Answer: D</option>
            </select>
            <Input
              placeholder="Topic Tag"
              value={newQuestion.topic}
              onChange={e => setNewQuestion({...newQuestion, topic: e.target.value})}
              className="flex-1 h-10 px-4 rounded-lg bg-slate-50 border-none font-bold text-xs shadow-inner"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 h-12 bg-slate-900 text-white font-black rounded-xl uppercase shadow-lg">Commit Item</Button>
            <Button type="button" onClick={onClose} variant="outline" className="h-12 px-6 rounded-xl font-black uppercase">Discard</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
