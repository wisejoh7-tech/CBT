import { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { Exam } from '@/src/types';
import { motion } from 'motion/react';
import { useAuth } from '@/src/context/AuthContext';
import { Button } from '@/lib/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/lib/ui/card';
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  Settings, 
  LogOut, 
  GraduationCap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/lib/ui/badge';
import { Separator } from '@/lib/ui/separator';

export default function ExamDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, logOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchExams() {
      try {
        const q = query(collection(db, 'exams'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const examList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
        setExams(examList);
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchExams();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-white/10 text-white px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 border-b border-white">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white backdrop-blur-md border border-white">
            <GraduationCap className="w-8 h-8 opacity-80" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight leading-none">
              Candidate: <span className="text-white opacity-80">{profile?.displayName}</span>
            </h1>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-2">Unified Examination Center &bull; Live Session</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none mb-1">Status</p>
            <Badge className="bg-white text-primary border-none font-bold text-[10px] uppercase tracking-widest px-3">Verified Candidate</Badge>
          </div>
          <Separator orientation="vertical" className="h-10 bg-white/20 mx-2" />
          <div className="flex gap-2">
            {profile?.role === 'admin' && (
              <Button variant="ghost" onClick={() => navigate('/admin')} className="text-white hover:bg-white/20 font-bold uppercase text-[10px] tracking-widest gap-2">
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={logOut} className="rounded-full text-white/50 hover:text-white hover:bg-white/20">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-8 md:p-12 text-white">
        <div className="mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">Available Assessments</h2>
          <p className="text-white/60 font-medium">Please select an examination to proceed to the secure testing environment.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-72 bg-white/5 rounded-3xl animate-pulse border border-white" />
            ))}
          </div>
        ) : (
          <>
            {exams.length === 0 ? (
              <div className="bg-white/5 border border-white rounded-[40px] p-24 text-center shadow-2xl">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5 rounded-full mb-8">
                  <BookOpen className="w-10 h-10 text-white/30" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">No Active Examinations</h3>
                <p className="text-white/40 font-medium max-w-sm mx-auto">There are currently no examinations scheduled for your department. Please contact the administrator.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {exams.map((exam, index) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group flex flex-col h-full overflow-hidden border border-white shadow-xl bg-white/5 rounded-[32px] hover:bg-white/10 transition-all duration-500">
                      <div className="h-2 bg-white w-full opacity-50" />
                      <CardHeader className="p-8 pb-4">
                        <div className="flex justify-between items-start mb-6">
                          <Badge variant="secondary" className="bg-white text-primary font-black px-4 py-1.5 rounded-lg uppercase tracking-[0.1em] text-[10px] border-none">
                            {exam.subject}
                          </Badge>
                          <div className="flex items-center gap-2 text-white/60 font-mono font-bold text-xs bg-white/10 px-3 py-1 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            {exam.durationMinutes} MIN
                          </div>
                        </div>
                        <CardTitle className="text-2xl font-black text-white leading-tight uppercase group-hover:text-white transition-colors">
                          {exam.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-white/60 mt-3 font-medium leading-relaxed">
                          {exam.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-8 py-4 flex-1">
                        <Separator className="bg-white/20 mb-6" />
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                          <span>Total Items</span>
                          <span className="text-white">{exam.totalQuestions} Questions</span>
                        </div>
                      </CardContent>
                      <CardFooter className="p-8 pt-0">
                        <Button 
                          onClick={() => navigate(`/exam/${exam.id}`)}
                          className="w-full h-16 bg-white hover:bg-white text-primary rounded-2xl font-black uppercase tracking-[0.2em] text-xs gap-3 transition-all border-none"
                        >
                          <PlayCircle className="w-5 h-5" />
                          Access Examination
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
