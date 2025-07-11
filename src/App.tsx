
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-slate-900">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/course" element={<CoursePage />} />
            </Routes>
          </main>
        </div>
      </AppProvider>
    </HashRouter>
  );
};

export default App;
