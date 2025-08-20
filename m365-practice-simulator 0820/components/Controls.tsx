import React from 'react';

interface ControlsProps {
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  replayLast: () => void;
  onEndSession: () => void;
  isSpeechSupported: boolean;
}

const Controls: React.FC<ControlsProps> = ({ isListening, startListening, stopListening, replayLast, onEndSession, isSpeechSupported }) => {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex items-center gap-2 rounded-2xl border bg-white/80 p-2 shadow-lg backdrop-blur-md">
        <button 
          className={`w-24 rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors ${isListening ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"} disabled:cursor-not-allowed disabled:bg-gray-400`} 
          onClick={() => (isListening ? stopListening() : startListening())} 
          title={!isSpeechSupported ? "Speech recognition is not supported in your browser" : (isListening ? "Stop listening for your voice" : "Start listening for your voice")}
          disabled={!isSpeechSupported}
        >
          {isListening ? "Stop" : "Talk"}
        </button>
        <button 
          className="rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100" 
          onClick={replayLast} 
          title="Replay last spoken line from customer"
        >
          Replay
        </button>
        <button 
          className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700" 
          onClick={onEndSession} 
          title="End this session and return to the scenario selection screen"
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default Controls;