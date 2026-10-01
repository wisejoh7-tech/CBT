export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  fullName?: string;
  photoURL?: string;
  faceUrl?: string;
  waecResultUrl?: string;
  examNumber?: string;
  dateOfBirth?: string;
  role: 'student' | 'super_admin' | 'reg_admin' | 'admin';
  loginMethod?: string;
  thumbprinted?: boolean;
  subjectCombination?: string[];
  stateOfOrigin?: string;
  lga?: string;
  schoolAttended?: string;
  address?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  examNumber: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  status: 'active' | 'suspended';
  stateOfOrigin?: string;
  lga?: string;
  schoolAttended?: string;
  address?: string;
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
  examVenue?: string;
  examDate?: string;
  examTime?: string;
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
  topic?: string;
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
  isReleased?: boolean;
  releasedAt?: any;
}
