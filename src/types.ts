
export interface Course {
  id: string;
  title: string;
  description: string;
  sections: Section[];
  sources?: GroundingSource[];
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  status: 'locked' | 'unlocked' | 'completed';
  content?: string;
  quiz?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface UserAnswer {
  questionId: string;
  answer: string;
}

export type Proficiency = 'new' | 'struggling' | 'proficient' | 'mastered';

export interface UserProficiency {
  [lessonId: string]: Proficiency;
}

export enum GroundingStrategy {
  STRICT = 'STRICT',
  GENERAL = 'GENERAL',
  GROUNDED = 'GROUNDED',
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export interface FileData {
    mimeType: string;
    data: string; // base64 encoded
}
