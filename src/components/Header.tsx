
import Button from './Button';
import { ScorpionIcon } from './icons';

const Header = () => {
  return (
    <header className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <ScorpionIcon className="w-8 h-8 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">Scorpion: AI Course Generator</h1>
      </div>
      <Button onClick={() => alert('Sign-in functionality coming soon!')}>
        Sign In
      </Button>
    </header>
  );
};

export default Header;