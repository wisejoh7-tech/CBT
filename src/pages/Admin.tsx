import React, { useState, useEffect } from 'react';
import { db } from '@/src/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy, updateDoc } from 'firebase/firestore';
import { Exam, Question } from '@/src/types';
import { Button } from '@/lib/ui/button';
import { Input } from '@/lib/ui/input';
import { Label } from '@/lib/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/lib/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/tabs';
import { ScrollArea } from '@/lib/ui/scroll-area';
import { Badge } from '@/lib/ui/badge';
import { Separator } from '@/lib/ui/separator';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  ChevronRight,
  ArrowLeft,
  Users,
  Search,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils/utils';
import { Candidate } from '@/src/types';

export default function Admin() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form states for new exam
  const [newExam, setNewExam] = useState({ title: '', subject: '', description: '', durationMinutes: 30 });
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  // Form states for new question
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOptionIndex: 0 });
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Form states for candidate
  const [newCandidate, setNewCandidate] = useState({ fullName: '', examNumber: '' });
  const [activeTab, setActiveTab] = useState<'exams' | 'candidates'>('exams');

  useEffect(() => {
    fetchExams();
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    try {
      const q = query(collection(db, 'candidates'), orderBy('createdAt', 'desc'));
      const qSnap = await getDocs(q);
      setCandidates(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate)));
    } catch (e) {
      toast.error("Failed to load candidates");
    }
  }

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.fullName || !newCandidate.examNumber) {
      toast.error("Full Name and Exam Number are required.");
      return;
    }
    try {
      await addDoc(collection(db, 'candidates'), {
        ...newCandidate,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      toast.success("Candidate Registered!");
      setNewCandidate({ fullName: '', examNumber: '' });
      fetchCandidates();
    } catch (e) {
      toast.error("Registration failed.");
    }
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm("Remove this candidate?")) return;
    try {
      await deleteDoc(doc(db, 'candidates', id));
      toast.success("Candidate removed.");
      fetchCandidates();
    } catch (e) {
      toast.error("Delete failed.");
    }
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
      const exam = exams.find(e => e.id === selectedExamId);
      if (exam) {
        setNewExam({ 
          title: exam.title, 
          subject: exam.subject, 
          description: exam.description || '', 
          durationMinutes: exam.durationMinutes 
        });
        setEditingExamId(exam.id);
      }
    } else {
      setQuestions([]);
      setNewExam({ title: '', subject: '', description: '', durationMinutes: 30 });
      setEditingExamId(null);
    }
  }, [selectedExamId, exams]);

  async function fetchExams() {
    setLoading(true);
    try {
      const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
      const qSnap = await getDocs(q);
      const examList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
      setExams(examList);
    } catch (e) {
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuestions(examId: string) {
    try {
      const qSnap = await getDocs(collection(db, 'exams', examId, 'questions'));
      setQuestions(qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    } catch (e) {
      toast.error("Failed to load questions");
    }
  }

  const handleCreateOrUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExamId) {
        await updateDoc(doc(db, 'exams', editingExamId), {
          ...newExam,
          updatedAt: serverTimestamp(),
        });
        toast.success("Exam updated!");
      } else {
        await addDoc(collection(db, 'exams'), {
          ...newExam,
          totalQuestions: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Exam created!");
      }
      setNewExam({ title: '', subject: '', description: '', durationMinutes: 30 });
      setEditingExamId(null);
      setSelectedExamId(null);
      fetchExams();
    } catch (e) {
      toast.error("Error saving exam");
    }
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm("Are you sure? All questions will be lost.")) return;
    try {
      await deleteDoc(doc(db, 'exams', id));
      toast.success("Exam deleted");
      if (selectedExamId === id) setSelectedExamId(null);
      fetchExams();
    } catch (e) {
      toast.error("Error deleting exam");
    }
  };

  const handleAddOrUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    try {
      if (editingQuestionId) {
        await updateDoc(doc(db, 'exams', selectedExamId, 'questions', editingQuestionId), newQuestion);
        toast.success("Question updated!");
      } else {
        await addDoc(collection(db, 'exams', selectedExamId, 'questions'), newQuestion);
        // Update exam question count
        await updateDoc(doc(db, 'exams', selectedExamId), {
          totalQuestions: questions.length + 1
        });
        toast.success("Question added!");
      }
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0 });
      setEditingQuestionId(null);
      fetchQuestions(selectedExamId);
    } catch (e) {
      toast.error("Error saving question");
    }
  };

  const startEditQuestion = (q: Question) => {
    setNewQuestion({
      text: q.text,
      options: [...q.options],
      correctOptionIndex: q.correctOptionIndex
    });
    setEditingQuestionId(q.id);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-white">
      <header className="bg-white/10 border-b border-white p-6 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Admin Console</h1>
        </div>
        <div className="flex gap-2 bg-white/10 p-1 rounded-2xl border border-white/20">
          <Button 
            variant={activeTab === 'exams' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('exams')}
            className={cn("rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] border-none", activeTab === 'exams' ? "bg-white text-primary" : "text-white/40 hover:text-white")}
          >
            <BookOpen className="w-3 h-3 mr-2" />
            Exams Manager
          </Button>
          <Button 
            variant={activeTab === 'candidates' ? 'default' : 'ghost'} 
            onClick={() => setActiveTab('candidates')}
            className={cn("rounded-xl px-6 font-bold uppercase tracking-widest text-[10px] border-none", activeTab === 'candidates' ? "bg-white text-primary" : "text-white/40 hover:text-white")}
          >
            <Users className="w-3 h-3 mr-2" />
            Candidates List
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {activeTab === 'exams' ? (
          <>
            {/* Left: Exams List */}
            <aside className="w-full md:w-96 bg-white/5 border-r border-white flex flex-col shrink-0">
          <div className="p-6 border-b border-white">
            <h2 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">
              {editingExamId ? 'Edit Examination' : 'Exam Collections'}
            </h2>
            <form onSubmit={handleCreateOrUpdateExam} className="space-y-3">
              <Input 
                placeholder="Title (e.g. JAMB Physics)" 
                value={newExam.title} 
                onChange={e => setNewExam({...newExam, title: e.target.value})}
                required
                className="bg-white/10 border border-white/20 rounded-xl h-11 text-xs font-bold text-white placeholder:text-white/30"
              />
              <Input 
                placeholder="Subject" 
                value={newExam.subject} 
                onChange={e => setNewExam({...newExam, subject: e.target.value})}
                required
                className="bg-white/10 border border-white/20 rounded-xl h-11 text-xs font-bold text-white placeholder:text-white/30"
              />
              <Input 
                placeholder="Brief Description" 
                value={newExam.description} 
                onChange={e => setNewExam({...newExam, description: e.target.value})}
                className="bg-white/10 border border-white/20 rounded-xl h-11 text-xs font-bold text-white placeholder:text-white/30"
              />
              <Input 
                type="number"
                placeholder="Duration (min)" 
                value={newExam.durationMinutes} 
                onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})}
                required
                className="bg-white/10 border border-white/20 rounded-xl h-11 text-xs font-bold text-white placeholder:text-white/30"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 h-11 bg-white text-primary rounded-xl font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-white/90 border-none">
                  <PlusCircle className="w-3.5 h-3.5" />
                  {editingExamId ? 'Update Exam' : 'Add New Exam'}
                </Button>
                {editingExamId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setSelectedExamId(null); setEditingExamId(null); setNewExam({ title: '', subject: '', description: '', durationMinutes: 30 }); }}
                    className="h-11 rounded-xl border-white text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3">
              {exams.map(exam => (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={`w-full text-left p-4 rounded-2xl mb-2 transition-all group ${
                    selectedExamId === exam.id ? 'bg-white text-primary' : 'hover:bg-white/5 text-white/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${selectedExamId === exam.id ? 'text-primary' : 'text-white'}`}>{exam.title}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${selectedExamId === exam.id ? 'text-primary/60' : 'text-white/40'}`}>
                        {exam.subject} &bull; {exam.durationMinutes}M
                      </p>
                    </div>
                    {selectedExamId === exam.id ? (
                      <Trash2 
                        className="w-4 h-4 text-primary hover:opacity-70 cursor-pointer" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id); }}
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Right: Questions Manager */}
        <section className="flex-1 overflow-y-auto p-8">
          {!selectedExamId ? (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-xs space-y-4">
                <div className="w-16 h-16 bg-white/5 border border-white rounded-2xl flex items-center justify-center mx-auto">
                  <BookOpen className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Exam Selected</h3>
                <p className="text-white/40 text-sm font-medium">Select an exam from the left panel to manage its questions and settings.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Edit Questions</h2>
                  <p className="text-white/60 font-medium">Manage assessment content for {exams.find(e => e.id === selectedExamId)?.title}</p>
                </div>
                <Badge variant="outline" className="h-8 rounded-full border-white text-white font-bold px-4">{questions.length} Total Questions</Badge>
              </div>

              {/* Add Question Form */}
              <Card className="rounded-[32px] border border-white overflow-hidden bg-white/5 backdrop-blur-xl">
                <CardHeader className="bg-white text-primary p-8">
                  <CardTitle className="text-lg uppercase tracking-widest font-black flex items-center gap-3">
                    <Plus className={cn("w-5 h-5", editingQuestionId && "rotate-45")} />
                    {editingQuestionId ? 'Edit Question' : 'New Question'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Question Text</Label>
                    <textarea 
                      className="w-full flex min-h-[100px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium focus:border-white outline-none transition-all text-white placeholder:text-white/20"
                      placeholder="Type the question content here..."
                      value={newQuestion.text}
                      onChange={e => setNewQuestion({...newQuestion, text: e.target.value})}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {newQuestion.options.map((opt, i) => (
                      <div key={i} className="space-y-2">
                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex justify-between">
                          Option {String.fromCharCode(65 + i)}
                          {newQuestion.correctOptionIndex === i && <span className="text-white">Correct Answer</span>}
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            value={opt} 
                            onChange={e => {
                              const opts = [...newQuestion.options];
                              opts[i] = e.target.value;
                              setNewQuestion({...newQuestion, options: opts});
                            }}
                            className="rounded-xl bg-white/10 border border-white/20 h-12 text-white placeholder:text-white/20"
                            placeholder={`Enter option ${String.fromCharCode(65 + i)}`}
                            required
                          />
                          <Button 
                            type="button"
                            variant={newQuestion.correctOptionIndex === i ? 'default' : 'outline'}
                            onClick={() => setNewQuestion({...newQuestion, correctOptionIndex: i})}
                            className={cn("rounded-xl h-12 shrink-0 px-4 border-white", newQuestion.correctOptionIndex === i ? "bg-white text-primary" : "text-white hover:bg-white/10")}
                          >
                            {newQuestion.correctOptionIndex === i ? '✓' : ''}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleAddOrUpdateQuestion} className="flex-1 h-14 bg-white text-primary hover:bg-white/90 rounded-[20px] font-bold uppercase tracking-widest transition-all border-none">
                      {editingQuestionId ? 'Update Question' : 'Save Question to Database'}
                    </Button>
                    {editingQuestionId && (
                      <Button 
                        variant="outline" 
                        onClick={() => { setEditingQuestionId(null); setNewQuestion({ text: '', options: ['', '', '', ''], correctOptionIndex: 0 }); }}
                        className="h-14 rounded-[20px] px-8 font-bold border-white text-white hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Current Questions List */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Existing Questions</h3>
                {questions.map((q, idx) => (
                  <Card key={q.id} className="rounded-3xl border border-white/20 bg-white/5 hover:bg-white/10 transition-all cursor-pointer overflow-hidden" onClick={() => startEditQuestion(q)}>
                    <CardContent className="p-6">
                      <div className="flex justify-between gap-4">
                        <div className="flex-1 text-white">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge className="bg-white/10 text-white font-bold border-none">Q{idx + 1}</Badge>
                            {editingQuestionId === q.id && <Badge className="bg-white text-primary border-none">Currently Editing</Badge>}
                          </div>
                          <p className="font-bold mb-4">{q.text}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`p-2 rounded-lg text-xs font-medium border ${q.correctOptionIndex === i ? 'bg-white text-primary border-none' : 'bg-white/5 text-white/60 border-white/10'}`}>
                                {String.fromCharCode(65 + i)}) {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if(!confirm("Delete question?")) return;
                            await deleteDoc(doc(db, 'exams', selectedExamId, 'questions', q.id));
                            // Update exam question count
                            await updateDoc(doc(db, 'exams', selectedExamId), {
                              totalQuestions: questions.length - 1
                            });
                            fetchQuestions(selectedExamId);
                          }}
                          className="rounded-full text-white/20 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-tight">Candidate <br /> Management</h2>
                  <p className="text-white/60 font-medium">Register and manage students for examinations.</p>
                </div>
                <Badge variant="outline" className="h-8 rounded-full border-white text-white font-bold px-4">{candidates.length} Registered Candidates</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Registration Form */}
                <Card className="rounded-[32px] border border-white bg-white/5 backdrop-blur-xl overflow-hidden h-fit">
                  <CardHeader className="bg-white text-primary p-8">
                    <CardTitle className="text-lg uppercase tracking-widest font-black flex items-center gap-3">
                      <UserPlus className="w-5 h-5" />
                      Register New
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <form onSubmit={handleCreateCandidate} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Full Legal Name</Label>
                        <Input 
                          placeholder="John Doe"
                          value={newCandidate.fullName}
                          onChange={e => setNewCandidate({...newCandidate, fullName: e.target.value})}
                          className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Exam Number</Label>
                        <Input 
                          placeholder="ET-2024-001"
                          value={newCandidate.examNumber}
                          onChange={e => setNewCandidate({...newCandidate, examNumber: e.target.value})}
                          className="h-12 rounded-xl bg-white/10 border-white/20 font-black uppercase tracking-widest text-white placeholder:text-white/20"
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full h-12 bg-white text-primary hover:bg-white/90 rounded-xl font-bold uppercase tracking-widest text-[10px] border-none">
                        Register Candidate
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Candidate Table */}
                <Card className="md:col-span-2 rounded-[32px] border border-white bg-white/5 backdrop-blur-xl overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center gap-x-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/20">
                      <Search className="w-5 h-5 text-white/40" />
                      <input 
                        type="text" 
                        placeholder="Search by name or number..."
                        className="bg-transparent border-none outline-none text-sm font-medium w-full text-white placeholder:text-white/20"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {candidates.map(candidate => (
                        <div key={candidate.id} className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white transition-all">
                          <div className="flex items-center gap-4 text-white">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-white/40 group-hover:bg-white group-hover:text-primary transition-colors uppercase">
                              {candidate.fullName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold group-hover:text-white transition-colors leading-tight">{candidate.fullName}</h4>
                              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{candidate.examNumber}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-white text-primary border-none font-bold uppercase tracking-widest text-[8px]">{candidate.status}</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => deleteCandidate(candidate.id)}
                              className="h-8 w-8 text-white/20 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {candidates.length === 0 && (
                        <div className="py-20 text-center text-white/20 font-medium italic">No candidates registered yet.</div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
