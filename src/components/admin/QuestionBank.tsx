import React from 'react';
import { Button } from '@/lib/ui/button';
import { Card } from '@/lib/ui/card';
import { Badge } from '@/lib/ui/badge';
import { ArrowLeft, Trash2, PlusCircle, FileText, Edit2 } from 'lucide-react';
import { Exam, Question } from '@/src/types';
import { cn } from '@/src/lib/utils/utils';

interface QuestionBankProps {
  exams: Exam[];
  selectedExamId: string | null;
  questions: Question[];
  setActiveTab: (val: string) => void;
  setShowAddQuestion: (val: boolean) => void;
  handleDeleteQuestion: (id: string) => void;
  onEditQuestion?: (question: Question) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  exams,
  selectedExamId,
  questions,
  setActiveTab,
  setShowAddQuestion,
  handleDeleteQuestion,
  onEditQuestion,
}) => {
  const currentExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-3 text-xs font-medium max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-primary/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('modules')} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-50 shadow-sm border border-primary/5 transition-all text-slate-400 hover:text-primary">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-800">{currentExam?.title}</h3>
            <p className="text-[11px] font-bold text-slate-500">{questions.length} Question bank</p>
          </div>
        </div>
        <Button onClick={() => setShowAddQuestion(true)} className="h-8 px-3 sm:px-4 rounded-lg bg-slate-900 text-white font-black tracking-wider uppercase text-[9px] sm:text-[10px] shadow-md hover:bg-black transition-all">
          <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Question
        </Button>
      </div>

      <div className="space-y-2.5 pb-16">
        {questions.map((q, i) => (
          <Card key={q.id} className="p-4 sm:p-5 rounded-xl bg-white shadow-md relative overflow-hidden group border border-primary/5 hover:border-primary/20 transition-all">
            <Badge className="absolute top-4 right-4 bg-slate-50 text-slate-400 border-none font-black text-[8px] px-2.5 py-0.5 rounded-full tracking-[0.15em] uppercase">ITEM #{i + 1}</Badge>

            <div className="space-y-3">
              <div className="flex gap-2.5">
                 <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary shrink-0"><FileText className="w-3.5 h-3.5" /></div>
                 <div className="space-y-2 pr-12 flex-1">
                   <p className="font-semibold text-xs leading-relaxed text-slate-800">{q.text}</p>
                   {q.imageUrl && (
                     <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 p-1.5 max-w-sm">
                       <img src={q.imageUrl} alt="Question Attachment" className="max-h-36 object-contain rounded-md" />
                     </div>
                   )}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, idx) => (
                  <div key={idx} className={cn(
                    "p-2.5 rounded-lg border-2 font-medium text-[11px] transition-all duration-300 relative flex items-center",
                    idx === q.correctOptionIndex
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-emerald-100"
                      : "bg-slate-50 border-slate-100 text-slate-500"
                  )}>
                    <span className={cn(
                      "inline-flex w-5 h-5 rounded-md items-center justify-center mr-2 font-black text-[9px] shrink-0 shadow-sm",
                      idx === q.correctOptionIndex ? "bg-emerald-500 text-white" : "bg-white text-slate-400"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="break-words">{opt}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2.5 border-t border-primary/5 flex justify-between items-center">
                 <div className="flex gap-1.5">
                   {q.topic && <Badge variant="outline" className="bg-primary/5 text-primary border-none font-black text-[8px] px-2.5 py-0.5 rounded-full tracking-wider uppercase">{q.topic}</Badge>}
                   <Badge variant="outline" className="bg-slate-100 text-slate-500 border-none font-black text-[8px] px-2.5 py-0.5 rounded-full tracking-wider uppercase">Type: MCQ</Badge>
                 </div>

                 <div className="flex items-center gap-2">
                   {onEditQuestion && (
                     <button
                       onClick={() => onEditQuestion(q)}
                       className="text-amber-500 hover:text-amber-700 font-black text-[9px] tracking-wider flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all uppercase"
                     >
                       <Edit2 className="w-3 h-3" /> Edit Item
                     </button>
                   )}
                   <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-rose-400 hover:text-rose-600 font-black text-[9px] tracking-wider flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all uppercase"
                  >
                    <Trash2 className="w-3 h-3" /> Purge Item
                  </button>
                 </div>
              </div>
            </div>
          </Card>
        ))}

        {questions.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-3">
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
               <PlusCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-300">No Assessment Data</p>
          </div>
        )}
      </div>
    </div>
  );
};
