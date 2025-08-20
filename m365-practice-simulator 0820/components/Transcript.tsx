import React, { useEffect, useRef } from 'react';
import type { TranscriptLine, Role } from '../types';

interface RoleBadgeProps {
  role: Role;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const baseClasses = "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium";
  const styles = {
    agent: "bg-blue-100 text-blue-800",
    customer: "bg-emerald-100 text-emerald-800",
    system: "bg-gray-100 text-gray-600",
  };
  return <span className={`${baseClasses} ${styles[role]}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
};


interface TranscriptProps {
  transcript: TranscriptLine[];
  onSend: (text: string) => void;
  isAiThinking: boolean;
  inputText: string;
  setInputText: (text: string) => void;
}

const Transcript: React.FC<TranscriptProps> = ({ transcript, onSend, isAiThinking, inputText, setInputText }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleSend = () => {
    if (isAiThinking) return;
    const value = inputText.trim();
    if (value) {
        onSend(value);
        setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex-shrink-0 text-lg font-semibold text-gray-800">Call Flow & Transcript</h2>
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border p-3">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border p-3">
          <ul className="space-y-4">
            {transcript.map((line, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="pt-0.5"><RoleBadge role={line.role} /></div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-gray-700">{line.text}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{new Date(line.ts).toLocaleTimeString()}</p>
                </div>
              </li>
            ))}
            <div ref={chatEndRef} />
          </ul>
        </div>
        <div className="mt-3 flex flex-shrink-0 items-center gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl border-gray-300 p-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100"
            placeholder={isAiThinking ? "Customer is speaking..." : "Type and press Enter (or use Talk button)"}
            onKeyDown={handleKeyDown}
            disabled={isAiThinking}
          />
          <button
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
            onClick={handleSend}
            disabled={isAiThinking}
          >
            {isAiThinking ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Transcript;