
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import { ArrowRightIcon, BookOpenIcon, CheckCircleIcon, LinkIcon, LockIcon, ScorpionIcon, SendIcon } from '../components/icons';
import { useApp } from '../context/AppContext';
import Spinner from '../context/Spinner';
import { Course, Lesson } from '../types';

const CoursePage: React.FC = () => {
    const { course, isLoading, error, activeLesson, selectLesson } = useApp();
    const navigate = useNavigate();

    useEffect(() => {
        if (!course) {
            navigate('/');
        } else if (!activeLesson && !isLoading) {
            let firstUnlockedLesson: Lesson | null = null;
            for (const section of course.sections) {
                firstUnlockedLesson = section.lessons.find(l => l.status === 'unlocked') || null;
                if (firstUnlockedLesson) break;
            }
            if (firstUnlockedLesson) {
                selectLesson(firstUnlockedLesson);
            }
        }
    }, [course, navigate, activeLesson, isLoading, selectLesson]);

    if (!course) {
        return <div className="flex items-center justify-center h-screen"><Spinner text="Loading Course..." /></div>;
    }

    return (
        <div className="flex h-[calc(100vh-68px)]">
            <CourseSidebar course={course} onSelectLesson={selectLesson} activeLesson={activeLesson} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-slate-900">
                {isLoading && !activeLesson?.content && <Spinner text="Generating Lesson..." />}
                {error && <Card className="border-rose-500/50 bg-rose-500/10 text-rose-300"><h3 className="font-bold text-rose-200">Error</h3><p>{error}</p></Card>}

                {!activeLesson && !isLoading && !error && <WelcomeMessage />}

                {activeLesson && <LessonView />}
            </main>
        </div>
    );
};

const CourseSidebar: React.FC<{ course: Course, onSelectLesson: (lesson: Lesson) => void, activeLesson: Lesson | null }> = ({ course, onSelectLesson, activeLesson }) => {
    return (
        <aside className="w-1/3 max-w-sm bg-slate-800 p-6 overflow-y-auto border-r border-slate-700 hidden md:block">
            <h2 className="text-2xl font-bold text-white mb-1">{course.title}</h2>
            <p className="text-sm text-slate-400 mb-6">{course.description}</p>

            {course.sources && course.sources.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold text-primary mb-3 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> References</h3>
                    <ul className="space-y-2 text-sm">
                        {course.sources.map(source => (
                            <li key={source.uri}>
                                <a
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-300 hover:text-primary transition-colors block truncate"
                                    title={source.title}
                                >
                                    {source.title || source.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <hr className="border-slate-700 my-6" />
                </div>
            )}

            <div className="space-y-6">
                {course.sections.map(section => (
                    <div key={section.id}>
                        <h3 className="font-bold text-primary mb-3">{section.title}</h3>
                        <ul className="space-y-2">
                            {section.lessons.map(lesson => (
                                <li key={lesson.id}>
                                    <button
                                        onClick={() => onSelectLesson(lesson)}
                                        disabled={lesson.status === 'locked'}
                                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${lesson.id === activeLesson?.id ? 'bg-primary text-white' : 'bg-slate-700 hover:bg-slate-600'
                                            } ${lesson.status === 'locked' ? 'text-slate-500 cursor-not-allowed' : 'text-slate-200'}`}
                                    >
                                        {lesson.status === 'completed' ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <BookOpenIcon className="w-5 h-5" />}
                                        <span className="flex-1">{lesson.title}</span>
                                        {lesson.status === 'locked' && <LockIcon className="w-4 h-4 text-slate-500" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </aside>
    );
};

const WelcomeMessage = () => (
    <Card className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
        <BookOpenIcon className="w-24 h-24 text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-white">Welcome to your course!</h2>
        <p className="text-slate-400 mt-2">Select a lesson from the sidebar to begin your learning journey.</p>
    </Card>
);

const LessonView = () => {
    const { activeLesson, submitQuiz, nextLessonId, goToNextLesson } = useApp();
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
    const [showQuiz, setShowQuiz] = useState(false);

    useEffect(() => {
        // Reset quiz state when lesson changes
        setShowQuiz(false);
        setUserAnswers({});
    }, [activeLesson?.id]);

    if (!activeLesson) return null;

    const handleQuizSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitQuiz(userAnswers);
    }

    const handleAnswerChange = (questionId: string, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    }

    const isQuizAnswered = activeLesson.quiz ? Object.keys(userAnswers).length === activeLesson.quiz.length : false;

    return (
        <div className="max-w-4xl mx-auto animate-slide-in-up">
            <h1 className="text-4xl font-extrabold text-white mb-4">{activeLesson.title}</h1>

            <div className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white mb-8">
                {activeLesson.content?.split('\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>

            {activeLesson.quiz && activeLesson.quiz.length > 0 && !showQuiz && activeLesson.status !== 'completed' && (
                <Button onClick={() => setShowQuiz(true)}>
                    Ready for a Quiz? <ArrowRightIcon className="w-4 h-4" />
                </Button>
            )}

            {showQuiz && activeLesson.quiz && activeLesson.status !== 'completed' && (
                <Card className="mt-8 bg-slate-800/50">
                    <h2 className="text-2xl font-bold mb-4 text-white">Check your understanding</h2>
                    <form onSubmit={handleQuizSubmit}>
                        <div className="space-y-6">
                            {activeLesson.quiz.map(q => (
                                <div key={q.id}>
                                    <p className="font-semibold text-slate-200 mb-2">{q.question}</p>
                                    <div className="space-y-2">
                                        {q.options.map(opt => (
                                            <label key={opt} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700 cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-white transition-colors">
                                                <input type="radio" name={q.id} value={opt} required onChange={() => handleAnswerChange(q.id, opt)} className="w-4 h-4 text-primary bg-slate-600 border-slate-500 focus:ring-primary" />
                                                <span>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button type="submit" disabled={!isQuizAnswered} className="mt-6">Submit Answers</Button>
                    </form>
                </Card>
            )}

            {activeLesson.status === 'completed' && (
                <Card className="mt-8 border-green-500/50 bg-green-500/10">
                    <div className="flex items-center gap-4">
                        <CheckCircleIcon className="w-12 h-12 text-green-400" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Lesson Complete!</h2>
                            {nextLessonId ? (
                                <p className="text-green-300">Great job! Ready for the next challenge?</p>
                            ) : (
                                <p className="text-green-300">Congratulations! You've completed the entire course!</p>
                            )}
                        </div>
                        {nextLessonId && (
                            <Button onClick={goToNextLesson} className="ml-auto">
                                Go to Next Lesson <ArrowRightIcon className="w-4 h-4" />
                            </Button>
                        )}
                        {!nextLessonId && (
                            <div className="ml-auto">
                                <ScorpionIcon className="w-8 h-8 text-primary" />
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <ChatInterface />
        </div>
    )
}

const ChatInterface = () => {
    const { sendMessage, lessonChat, isLoading } = useApp();
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lessonChat]);

    const handleSend = () => {
        if (input.trim()) {
            sendMessage(input);
            setInput('');
        }
    };

    return (
        <Card className="mt-12">
            <h3 className="text-lg font-bold text-white mb-4">Ask about this lesson</h3>
            <div className="h-64 overflow-y-auto bg-slate-900 rounded-lg p-4 space-y-4 mb-4">
                {lessonChat.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-slate-900 font-bold">AI</div>}
                        <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-200'}`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && lessonChat[lessonChat.length - 1]?.sender === 'user' && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-slate-900 font-bold">AI</div>
                        <div className="max-w-md p-3 rounded-lg bg-slate-700 text-slate-200">
                            <div className="flex gap-1.5 items-center">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse " style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    <SendIcon className="w-5 h-5" />
                </Button>
            </div>
        </Card>
    );
};


export default CoursePage;