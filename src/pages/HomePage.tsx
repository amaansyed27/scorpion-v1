
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { GroundingStrategy, FileData } from '../types';
import Button from '../components/Button';
import { SparklesIcon, BookOpenIcon, UploadCloudIcon, ArrowRightIcon, XCircleIcon } from '../components/icons';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { course } = useApp();

  if (course) {
    return <DashboardView />;
  }

  return <CourseCreationView />;
};

const DashboardView = () => {
    const { course, clearCourse } = useApp();
    const navigate = useNavigate();

    if(!course) return null;

    return (
        <div className="p-4 sm:p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-100 mb-2">Welcome Back!</h2>
            <p className="text-slate-400 mb-8">Continue your learning journey.</p>
            <Card className="max-w-2xl mx-auto">
                <div className="flex items-start gap-6">
                    <div className="bg-primary/20 text-primary p-3 rounded-lg">
                        <BookOpenIcon className="w-8 h-8"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{course.title}</h3>
                        <p className="text-slate-300 mt-1 mb-4">{course.description}</p>
                        <div className="flex gap-4">
                            <Button onClick={() => navigate('/course')}>
                                Continue Course <ArrowRightIcon className="w-4 h-4" />
                            </Button>
                            <Button variant="secondary" onClick={clearCourse}>
                                Create New Course
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};


const CourseCreationView = () => {
  const [content, setContent] = useState('');
  const [strategy, setStrategy] = useState<GroundingStrategy>(GroundingStrategy.STRICT);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const { createCourse, isLoading, error } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setFileName(file.name);
    setContent(''); // Clear textarea content
    setFileData(null);
    
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl.split(',')[1];
        setFileData({
            mimeType: file.type,
            data: base64Data
        });
        setIsParsing(false);
      };
      reader.onerror = () => {
        console.error("Error reading file");
        setIsParsing(false);
        setFileName(null);
      }
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error setting up file reader:", err);
      setFileName(null);
      setIsParsing(false);
    } finally {
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFileName(null);
    setContent('');
    setFileData(null);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if(e.target.value.trim()) {
      setFileName(null);
      setFileData(null);
    }
  }

  const handleGenerate = () => {
    if (fileData) {
        createCourse(fileData, strategy);
    } else if (content.trim()) {
      createCourse(content, strategy);
    }
  };

  const canGenerate = (content.trim() !== '' || fileData !== null) && !isLoading && !isParsing;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 animate-fade-in">
      <div className="text-center mb-8">
        <SparklesIcon className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-4xl font-extrabold text-white">Create Your AI-Powered Course</h2>
        <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
          Just paste your topic content or upload a document, and Scorpion will build a personalized learning path for you.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-6">
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-2">
              Paste your content here
            </label>
            <textarea
              id="content"
              rows={10}
              value={content}
              onChange={handleContentChange}
              placeholder="e.g., paste an article about photosynthesis, a chapter from a book, or your study notes..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary transition"
              disabled={isParsing || !!fileData}
            />
          </div>

          <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-600" />
              </div>
              <div className="relative flex justify-center">
                  <span className="bg-slate-800 px-2 text-sm text-slate-400">Or</span>
              </div>
          </div>
          
            {!fileName ? (
                <button
                    onClick={handleUploadClick}
                    disabled={isParsing || isLoading}
                    className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 hover:border-slate-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <UploadCloudIcon className="w-10 h-10 mb-2" />
                    <span className="font-semibold">
                        {isParsing ? 'Processing File...' : 'Upload PDF or other document'}
                    </span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.txt,.md"
                        className="hidden"
                    />
                </button>
            ) : (
                <div className="flex items-center justify-between p-3 pl-4 bg-slate-900 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3 text-slate-200 overflow-hidden">
                        <BookOpenIcon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-medium truncate" title={fileName}>{fileName}</span>
                    </div>
                    <button onClick={clearFile} className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded-full ml-2">
                        <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
            )}

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">AI Knowledge Strategy</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setStrategy(GroundingStrategy.STRICT)}
                className={`p-2 rounded-md text-sm font-semibold transition text-center w-full ${
                  strategy === GroundingStrategy.STRICT 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Strictly My Content
              </button>
              <button
                onClick={() => setStrategy(GroundingStrategy.GENERAL)}
                className={`p-2 rounded-md text-sm font-semibold transition text-center w-full ${
                  strategy === GroundingStrategy.GENERAL 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Use General Knowledge
              </button>
              <button
                onClick={() => setStrategy(GroundingStrategy.GROUNDED)}
                className={`p-2 rounded-md text-sm font-semibold transition text-center w-full ${
                  strategy === GroundingStrategy.GROUNDED 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Enhance with Google Search
              </button>
            </div>
             <p className="text-xs text-slate-500 mt-2 text-center">
                {
                  {
                    [GroundingStrategy.STRICT]: "AI will only use the content you provide.",
                    [GroundingStrategy.GENERAL]: "AI will use your content and its general knowledge.",
                    [GroundingStrategy.GROUNDED]: "AI will enhance your content with Google Search for the latest info."
                  }[strategy]
                }
              </p>
          </div>

          <div>
            <Button onClick={handleGenerate} isLoading={isLoading} disabled={!canGenerate} className="w-full text-lg">
              <SparklesIcon className="w-5 h-5" />
              Generate Course
            </Button>
            {error && <p className="text-rose-400 text-sm mt-2 text-center">{error}</p>}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;