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
    <div className="space-y-4 text-xs font-medium max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('modules')} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-50 shadow-sm border border-primary/5 transition-all text-slate-400 hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-800">{currentExam?.title}</h3>
            <p className="text-xs font-bold text-slate-500">{questions.length} Question bank</p>
          </div>
        </div>
        <Button onClick={() => setShowAddQuestion(true)} className="h-9 px-4 rounded-xl bg-slate-900 text-white font-black tracking-wider uppercase text-[10px] shadow-md hover:bg-black transition-all">
          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Question
        </Button>
      </div>

      <div className="space-y-3 pb-16">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-6 rounded-2xl bg-white shadow-lg relative overflow-hidden group border border-primary/5 hover:border-primary/20 transition-all">
            <Badge className="absolute top-6 right-6 bg-slate-50 text-slate-400 border-none font-black text-[9px] px-3 py-1 rounded-full tracking-[0.15em] uppercase">ITEM #{i + 1}</Badge>

            <div className="space-y-5">
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0"><FileText className="w-4 h-4" /></div>
                 <div className="space-y-3 pr-14 flex-1">
                   <p className="font-semibold text-sm leading-relaxed text-slate-800">{q.text}</p>
                   {q.imageUrl && (
                     <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 max-w-md">
                       <img src={q.imageUrl} alt="Question Attachment" className="max-h-44 object-contain rounded-lg" />
                     </div>
                   )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={cn(
                    "p-3.5 rounded-xl border-2 font-semibold text-xs transition-all duration-300 relative flex items-center",
                    idx === q.correctOptionIndex
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-emerald-100"
                      : "bg-slate-50 border-slate-100 text-slate-500"
                  )}>
                    <span className={cn(
                      "inline-flex w-6 h-6 rounded-md items-center justify-center mr-2.5 font-black text-[10px] shrink-0 shadow-sm",
                      idx === q.correctOptionIndex ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-primary/5 flex justify-between items-center">
                 <div className="flex gap-2">
                   {q.topic && <Badge variant="outline" className="bg-primary/5 text-primary border-none font-black text-[9px] px-3 py-1 rounded-full tracking-wider uppercase">{q.topic}</Badge>}
                   <Badge variant="outline" className="bg-slate-100 text-slate-500 border-none font-black text-[9px] px-3 py-1 rounded-full tracking-wider uppercase">Type: MCQ</Badge>
                 </div>

                 <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="text-rose-400 hover:text-rose-600 font-black text-[10px] tracking-wider flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-rose-50 transition-all uppercase"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Item
                </button>
              </div>
            </div>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <PlusCircle className="w-8 h-8" />
            </div>
            <p className="text-base font-black text-slate-300">No Assessment Data</p>
          </div>
        )}
      </div>
    </div>
  );
};
