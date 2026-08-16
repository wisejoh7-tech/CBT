import { useState, useEffect, useCallback } from 'react';
import { Exam, Question, Attempt, Candidate, UserProfile } from '@/src/types';
import { toast } from 'sonner';
import { getApiUrl } from '@/src/lib/api-config';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';

export function useAdminData() {
  const { profile } = useAuth();
  const { socket } = useSocket();
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [offeredSubjects, setOfferedSubjects] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }), []);

  const fetchData = useCallback(async () => {
    const endpoints = [
      ['/analytics/summary', setAnalytics],
      ['/exams', setExams],
      ['/candidates', setCandidates],
      ['/exams/attempts/all', setAttempts],
      ['/center/seats', setSeats],
      ['/analytics/logs', setLogs],
      ['/subjects', setOfferedSubjects]
    ];

    endpoints.forEach(async ([url, setter]: any) => {
      try {
        const res = await fetch(getApiUrl(url), { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          setter(data);
        }
      } catch (err) {
        console.warn(`Soft failure fetching ${url}:`, err);
      } finally {
        if (url === '/analytics/summary' || url === '/exams') {
          setLoading(false);
        }
      }
    });

    const isSuperOrAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
    if (isSuperOrAdmin) {
      (async () => {
        try {
          const res = await fetch(getApiUrl('/auth/staff'), { headers: getHeaders() });
          if (res.ok) setStaff(await res.json());
        } catch (err) {
          console.warn("Failed to fetch staff:", err);
        }
      })();
    }

    // Safety fallback: ensure spinner goes away after 2 seconds
    setTimeout(() => setLoading(false), 2000);
  }, [getHeaders, profile]);

  const fetchQuestions = useCallback(async (examId: string) => {
    const res = await fetch(getApiUrl(`/exams/${examId}`), { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions || []);
    }
  }, [getHeaders]);

  useEffect(() => {
    if (selectedExamId) fetchQuestions(selectedExamId);
  }, [selectedExamId, fetchQuestions]);

  useEffect(() => {
    if (!profile) return;
    fetchData();
  }, [profile, fetchData]);

  return {
    exams, setExams,
    selectedExamId, setSelectedExamId,
    questions, setQuestions,
    candidates, setCandidates,
    staff, setStaff,
    attempts, setAttempts,
    offeredSubjects, setOfferedSubjects,
    analytics, setAnalytics,
    seats, setSeats,
    logs, setLogs,
    loading, setLoading,
    getHeaders,
    fetchData,
    fetchQuestions,
    socket
  };
}
