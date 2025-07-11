import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Course, GroundingStrategy, UserProficiency, Lesson, ChatMessage, Proficiency, FileData } from '../types';
import { generateCourseOutline, generateLessonContent, askQuestionAboutLesson } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface AppContextType {
  course: Course | null;
  userProficiency: UserProficiency;
  isLoading: boolean;
  error: string | null;
  activeLesson: Lesson | null;
  lessonChat: ChatMessage[];
  nextLessonId: string | null;
  createCourse: (content: string | FileData, strategy: GroundingStrategy) => Promise<void>;
  selectLesson: (lesson: Lesson) => Promise<void>;
  clearCourse: () => void;
  submitQuiz: (answers: Record<string, string>) => void;
  sendMessage: (message: string) => Promise<void>;
  goToNextLesson: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [userProficiency, setUserProficiency] = useState<UserProficiency>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonChat, setLessonChat] = useState<ChatMessage[]>([]);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const navigate = useNavigate();

  const createCourse = async (content: string | FileData, strategy: GroundingStrategy) => {
    setIsLoading(true);
    setError(null);
    try {
      const newCourse = await generateCourseOutline(content, strategy);
      setCourse(newCourse);
      const initialProficiency: UserProficiency = {};
      newCourse.sections.forEach(section => {
        section.lessons.forEach(lesson => {
          initialProficiency[lesson.id] = 'new';
        });
      });
      setUserProficiency(initialProficiency);
      navigate('/course');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate course: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const selectLesson = async (lesson: Lesson) => {
    if (lesson.id === activeLesson?.id) return;

    setIsLoading(true);
    setError(null);
    setNextLessonId(null); // Clear next lesson when selecting a new one
    setActiveLesson(lesson);
    setLessonChat([]); // Reset chat for new lesson

    try {
      if (!lesson.content) { // Only fetch if content is not already there
        const proficiency = userProficiency[lesson.id] || 'new';
        const { lessonPart, quiz } = await generateLessonContent(lesson.title, course?.title || 'Course', proficiency);
        const updatedLesson = { ...lesson, content: lessonPart, quiz, status: 'unlocked' as 'unlocked' };
        
        const updatedCourse = course ? { ...course, sections: course.sections.map(s => ({
            ...s,
            lessons: s.lessons.map(l => l.id === lesson.id ? updatedLesson : l)
        }))} : null;

        setCourse(updatedCourse);
        setActiveLesson(updatedLesson);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to load lesson content: ${errorMessage}`);
      console.error(e);
      setActiveLesson(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const submitQuiz = (answers: Record<string, string>) => {
    if (!activeLesson || !activeLesson.quiz || !course) return;

    let correctCount = 0;
    activeLesson.quiz.forEach(q => {
        if(answers[q.id] === q.correctAnswer) {
            correctCount++;
        }
    });

    const score = correctCount / activeLesson.quiz.length;
    let newProficiency: Proficiency = 'struggling';
    if(score > 0.8) newProficiency = 'mastered';
    else if (score > 0.5) newProficiency = 'proficient';
    
    setUserProficiency(prev => ({...prev, [activeLesson.id]: newProficiency}));

    const updatedLesson = { ...activeLesson, status: 'completed' as 'completed' };

    let nextLessonFound: Lesson | null = null;
    const newSections = course.sections.map(section => ({
        ...section,
        lessons: section.lessons.map(l => l) 
    }));

    const currentSectionIndex = newSections.findIndex(s => s.lessons.some(l => l.id === activeLesson.id));
    if (currentSectionIndex === -1) return;
    
    const currentSection = newSections[currentSectionIndex];
    const currentLessonIndex = currentSection.lessons.findIndex(l => l.id === activeLesson.id);

    // Try to find and unlock next lesson in the same section
    if (currentLessonIndex + 1 < currentSection.lessons.length) {
        const nextLesson = currentSection.lessons[currentLessonIndex + 1];
        if (nextLesson.status === 'locked') {
            const unlockedNextLesson = { ...nextLesson, status: 'unlocked' as const };
            currentSection.lessons[currentLessonIndex + 1] = unlockedNextLesson;
            nextLessonFound = unlockedNextLesson;
        } else {
             nextLessonFound = nextLesson;
        }
    }

    // If no next lesson in section, try first lesson of next section
    else if (currentSectionIndex + 1 < newSections.length) {
        const nextSection = newSections[currentSectionIndex + 1];
        if (nextSection.lessons.length > 0) {
            const nextLesson = nextSection.lessons[0];
             if (nextLesson.status === 'locked') {
                const unlockedNextLesson = { ...nextLesson, status: 'unlocked' as const };
                nextSection.lessons[0] = unlockedNextLesson;
                nextLessonFound = unlockedNextLesson;
             } else {
                nextLessonFound = nextLesson;
             }
        }
    }
    
    setNextLessonId(nextLessonFound?.id || null);

    newSections[currentSectionIndex].lessons[currentLessonIndex] = updatedLesson;
    
    const updatedCourse = { ...course, sections: newSections };
    setCourse(updatedCourse);
    setActiveLesson(updatedLesson);
  };

  const goToNextLesson = () => {
    if (!nextLessonId || !course) return;

    for (const section of course.sections) {
      const lesson = section.lessons.find(l => l.id === nextLessonId);
      if (lesson) {
        selectLesson(lesson);
        break;
      }
    }
  };
  
  const sendMessage = async (message: string) => {
    if (!activeLesson || !activeLesson.content) return;
    
    setLessonChat(prev => [...prev, { sender: 'user', text: message }]);
    setIsLoading(true);
    try {
        const aiResponse = await askQuestionAboutLesson(message, activeLesson.content);
        setLessonChat(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Sorry, I couldn't process that. Please try again.";
        setLessonChat(prev => [...prev, { sender: 'ai', text: `Error: ${errorMessage}` }]);
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const clearCourse = () => {
    setCourse(null);
    setUserProficiency({});
    setActiveLesson(null);
    setNextLessonId(null);
    navigate('/');
  };

  return (
    <AppContext.Provider value={{ course, userProficiency, isLoading, error, createCourse, clearCourse, activeLesson, selectLesson, submitQuiz, lessonChat, sendMessage, nextLessonId, goToNextLesson }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
