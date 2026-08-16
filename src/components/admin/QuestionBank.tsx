import React from 'react';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { ArrowLeft, Trash2, PlusCircle, FileText } from 'lucide-react';
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
    <div className="space-y-6 text-sm font-medium max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-6">
          <button onClick={() => setActiveTab('modules')} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-slate-50 shadow-sm border border-primary/5 transition-all text-slate-400 hover:text-primary">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h3 className="text-2xl font-black tracking-tighter uppercase text-slate-800">{currentExam?.title}</h3>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">{questions.length} Question bank</p>
          </div>
        </div>
        <Button onClick={() => setShowAddQuestion(true)} className="h-12 px-6 rounded-2xl bg-slate-900 text-white font-black tracking-widest uppercase text-[11px] shadow-xl hover:bg-black transition-all">
          <PlusCircle className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </div>

      <div className="space-y-4 pb-20">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-10 rounded-[32px] bg-white shadow-2xl relative overflow-hidden group border border-primary/5 hover:border-primary/20 transition-all">
            <Badge className="absolute top-10 right-10 bg-slate-50 text-slate-400 border-none font-black text-[10px] px-4 py-1.5 rounded-full tracking-[0.2em] uppercase">ITEM #{i + 1}</Badge>

            <div className="space-y-8">
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0"><FileText className="w-5 h-5" /></div>
                 <p className="font-bold text-lg leading-relaxed text-slate-800 pr-16">{q.text}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={cn(
                    "p-6 rounded-2xl border-2 font-bold text-sm transition-all duration-300 relative",
                    idx === q.correctOptionIndex
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-emerald-100"
                      : "bg-slate-50 border-slate-100 text-slate-500"
                  )}>
                    <span className={cn(
                      "inline-flex w-7 h-7 rounded-lg items-center justify-center mr-3 font-black text-xs shadow-sm",
                      idx === q.correctOptionIndex ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                  </div>
                ))}
              </div>

              <div className="pt-8 border-t border-primary/5 flex justify-between items-center">
                 <div className="flex gap-3">
                   {q.topic && <Badge variant="outline" className="bg-primary/5 text-primary border-none font-black text-[10px] px-4 py-1.5 rounded-full tracking-widest uppercase">{q.topic}</Badge>}
                   <Badge variant="outline" className="bg-slate-100 text-slate-500 border-none font-black text-[10px] px-4 py-1.5 rounded-full tracking-widest uppercase">Type: MCQ</Badge>
                 </div>

                 <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="text-rose-400 hover:text-rose-600 font-black text-[11px] tracking-widest flex items-center gap-2 px-6 py-2.5 rounded-xl hover:bg-rose-50 transition-all uppercase"
                >
                  <Trash2 className="w-4 h-4" /> Purge Item
                </button>
              </div>
            </div>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="py-40 text-center bg-white rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <PlusCircle className="w-10 h-10" />
            </div>
            <p className="text-xl font-black text-slate-300 tracking-[0.5em] uppercase">No Assessment Data</p>
          </div>
        )}
      </div>
    </div>
  );
};
