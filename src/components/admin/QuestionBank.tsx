import React from 'react';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { Exam, Question } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';

interface QuestionBankProps {
  exams: Exam[];
  selectedExamId: string | null;
  questions: Question[];
  setActiveTab: (val: string) => void;
  setShowAddQuestion: (val: boolean) => void;
  handleDeleteQuestion: (id: string) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  exams,
  selectedExamId,
  questions,
  setActiveTab,
  setShowAddQuestion,
  handleDeleteQuestion,
}) => {
  const currentExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setActiveTab('modules')} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-black">{currentExam?.title} Items</h3>
        <Button onClick={() => setShowAddQuestion(true)} className="ml-auto bg-slate-900 text-white font-black text-[9px] uppercase h-10">Add Question</Button>
      </div>
      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-6 rounded-[24px] bg-white shadow-lg relative overflow-hidden group">
            <Badge className="absolute top-6 right-6 bg-slate-50 text-slate-300 border-none font-black text-[8px]">ITEM #{i + 1}</Badge>
            <div className="space-y-4">
              <p className="font-bold text-md leading-relaxed">{q.text}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-xl border font-bold text-xs",
                    idx === q.correctOptionIndex ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-transparent text-slate-500"
                  )}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="text-rose-300 hover:text-rose-500 p-0 font-black text-[8px] uppercase h-auto transition-colors"
              >
                Delete Item
              </button>
            </div>
          </Card>
        ))}
        {questions.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[32px] border-2 border-dashed border-primary/5 opacity-20 font-black uppercase text-sm">
            Bank is empty
          </div>
        )}
      </div>
    </div>
  );
};
