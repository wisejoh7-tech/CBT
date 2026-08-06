export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  faceUrl?: string;
  examNumber?: string;
  dateOfBirth?: string;
  role: 'student' | 'super_admin' | 'reg_admin' | 'admin';
  thumbprinted?: boolean;
  subjectCombination?: string[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  examNumber: string;
  fullName: string;
  email?: string;
  dateOfBirth?: string;
  status: 'active' | 'suspended';
  thumbprinted: boolean;
  thumbprintData?: string;
  faceUrl?: string;
  waecResultUrl?: string;
  subjectCombination: string[];
  registrationDate: string;
  createdAt: string;
  pin?: string;
  assignedIp?: string;
  assignedSeatNumber?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subject: string;
  durationMinutes: number;
  totalQuestions: number;
  createdBy: string;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface Attempt {
  id: string;
  userId: string;
  examId: string;
  score: number;
  totalPossible: number;
  answers: Record<string, number>;
  flagged?: string[];
  timeLeft?: number;
  currentQuestionIndex?: number;
  startedAt: any;
  completedAt?: any;
  status: 'in-progress' | 'completed';
  proctoringSnaps?: string[];
  trustScore?: number;
  isIdentityVerified?: boolean;
  violationLogs?: any[];
  results?: any;
  released?: boolean;
  releasedAt?: any;
}
