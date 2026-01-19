
export enum UserRole {
  ADMIN = 'ADMIN',
  EXAMINER = 'EXAMINER',
  STUDENT = 'STUDENT'
}

export enum QuestionType {
  ESSAY = 'ESSAY',
  MCQ = 'MCQ',
  VOICE = 'VOICE'
}

export type AppTheme = 'slate' | 'blue' | 'emerald' | 'rose';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Institute {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  instituteId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  instituteId?: string;
  departmentId?: string;
  isApproved: boolean;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
}

export interface Question {
  id: string;
  text: string;
  maxPoints: number;
  type: QuestionType;
  options?: QuestionOption[];
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  instituteId: string;
  departmentId: string;
  examinerId: string;
  questions: Question[];
  rubric: RubricCriterion[];
  createdAt: string;
}

export interface Answer {
  questionId: string;
  text: string;
  audioData?: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  answers: Answer[];
  submittedAt: string;
  status: 'PENDING' | 'GRADED' | 'REVIEWED';
}

export interface CriterionGrade {
  criterionId: string;
  score: number;
  justification: string;
}

export interface QuestionGrade {
  questionId: string;
  totalScore: number;
  criteriaGrades: CriterionGrade[];
  overallFeedback: string;
  uncertaintyFlag: boolean;
}

export interface GradingResult {
  id: string;
  submissionId: string;
  examId: string;
  questionGrades: QuestionGrade[];
  finalGrade: number;
  isPublished: boolean;
  reviewedBy?: string;
  gradingSource: 'AI' | 'MANUAL';
}
