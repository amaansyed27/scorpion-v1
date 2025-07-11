
import React from 'react';

interface SpinnerProps {
    text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text = "Thinking..." }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-slate-400">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-semibold">{text}</p>
        </div>
    );
};

export default Spinner;
