
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { SCENARIOS } from './data/scenarios';
import { useSpeech } from './hooks/useSpeech';
import { isoNow, fileStamp } from './utils/helpers';
import type { Notes, Scenario, TranscriptLine, Role } from './types';
import ScenarioSelection from './components/ScenarioSelection';
import NotesPanel from './components/NotesPanel';
import Transcript from './components/Transcript';
import Controls from './components/Controls';

const DISPOSITIONS = ["", "Resolved", "Transfer", "Escalated to Supervisor", "Call Back", "Hang Up"];

function createSystemInstruction(scenario: Scenario): string {
  return `You are roleplaying a customer in a tech support call.

**Your Persona:**
- Name: ${scenario.customer.name}
- Product Used: ${scenario.product}
- Your Problem: ${scenario.path[0].customer}
- Technical Skill: Basic user. You don't know technical jargon.

**Roleplay Rules:**
1.  Respond to the support agent's questions based on your persona.
2.  You are experiencing the problem right now.
3.  Do NOT suggest solutions. Follow the agent's lead.
4.  The KEY to solving your problem is related to this hint: '${scenario.summaryHint}'. When the agent suggests something related to this hint, it should eventually lead to the solution.
5.  Keep your responses short and natural, like you're on a phone call.
6.  Do not mention that you are an AI. You are ${scenario.customer.name}. Do not break character.`;
}

// Helper to convert our transcript to Gemini's history format
const toGeminiHistory = (transcript: TranscriptLine[]) => {
  return transcript
    .filter(line => line.role === 'agent' || line.role === 'customer')
    .map(line => ({
      role: line.role === 'agent' ? 'user' : 'model',
      parts: [{ text: line.text }],
    }));
};

export default function App() {
  const [agentName, setAgentName] = useState<string>("Alex");
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
  const [disposition, setDisposition] = useState<string>('');
  
  const scenario: Scenario | undefined = useMemo(() => SCENARIOS.find((s) => s.id === selectedScenarioId), [selectedScenarioId]);

  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [notes, setNotes] = useState<Notes>({ summary: "" });
  const [agentInputText, setAgentInputText] = useState('');
  
  const pushLine = useCallback((role: Role, text: string) => {
    setTranscript((t) => [...t, { role, text, ts: isoNow() }]);
  }, []);

  const handleAgentUtteranceRef = useRef<((text: string) => void) | null>(null);
  
  const stableOnResult = useCallback((text: string) => {
    if (handleAgentUtteranceRef.current) {
      handleAgentUtteranceRef.current(text);
    }
  }, []);

  const handleSpeechError = useCallback((error: string) => {
    let message: string;
    switch (error) {
      case 'network':
        message = 'Speech recognition failed due to a network issue. Please check your internet connection. Note: If you are on a preview or development server, its network configuration or domain might be preventing access to the browser\'s speech service.';
        break;
      case 'not-allowed':
      case 'service-not-allowed':
        message = 'Microphone access was denied. Please allow microphone access in your browser settings to use the voice feature.';
        break;
      case 'insecure-context':
        message = 'Speech recognition is not available. This feature only works on secure websites (HTTPS) or localhost.';
        break;
      case 'not-supported':
        message = 'Speech recognition is not supported by your browser. Please try Chrome or Edge for the best experience.';
        break;
      default:
        message = `An unknown speech recognition error occurred: "${error}". Please try again.`;
        break;
    }
    pushLine("system", message);
  }, [pushLine]);

  const { isListening, startListening, stopListening, speak, replayLast, isSpeechSupported } = useSpeech({ onResult: stableOnResult, onError: handleSpeechError });
  
  const handleAgentUtterance = useCallback(async (text: string) => {
    stopListening();

    if (!scenario || isAiThinking) return;

    const clean = `${text}`.trim();
    if (!clean) return;

    const newTranscript = [...transcript, { role: "agent" as Role, text: clean, ts: isoNow() }];
    setTranscript(newTranscript);
    setIsAiThinking(true);

    try {
      const apiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          systemInstruction: createSystemInstruction(scenario),
          transcript: toGeminiHistory(newTranscript),
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.details || 'API request failed');
      }

      const { text: customerResponseText } = await apiResponse.json();
      pushLine("customer", customerResponseText);
      speak(customerResponseText);
    } catch (error) {
      console.error("Gemini API error:", error);
      pushLine("system", "Sorry, an error occurred with the AI. Please try again.");
    } finally {
      setIsAiThinking(false);
    }
  }, [pushLine, scenario, speak, isAiThinking, stopListening, transcript]);


  useEffect(() => {
    handleAgentUtteranceRef.current = handleAgentUtterance;
  }, [handleAgentUtterance]);

  const startSession = useCallback((selected: Scenario) => {
    const seed = selected.path[0]?.customer || "Hi, I have an issue.";
    const initialTranscript: TranscriptLine[] = [
      { role: "system", text: `Scenario loaded: ${selected.title}`, ts: isoNow() },
      { role: "customer", text: seed, ts: isoNow() },
    ];
    setTranscript(initialTranscript);
    speak(seed);
    setNotes({ summary: "" });
    setDisposition('');

    if (selected.openingTemplates && selected.openingTemplates.length > 0) {
      const template = selected.openingTemplates[Math.floor(Math.random() * selected.openingTemplates.length)];
      setAgentInputText(template.replace("{{AGENT_NAME}}", agentName));
    } else {
      setAgentInputText("");
    }
  }, [speak, agentName]);
  
  const resetSession = useCallback(() => {
    if (!scenario) return;
    startSession(scenario);
  }, [scenario, startSession]);
  
  const handleScenarioSelect = useCallback((id: string) => {
    const selected = SCENARIOS.find(s => s.id === id);
    if (!selected) return;
    setSelectedScenarioId(id);
    startSession(selected);
  }, [startSession]);

  const handleReturnToSelection = () => {
    setSelectedScenarioId(null);
    setTranscript([]);
  };

  const getAgentSuggestion = async () => {
    if (!scenario || isSuggestionLoading || isAiThinking) return;

    setIsSuggestionLoading(true);
    const prompt = `You are a helpful assistant for a call center agent in training. Based on the following transcript of a support call, suggest a single, concise, and helpful response for the 'agent' to say next. The agent is trying to solve the customer's problem, which is related to this hint: '${scenario.summaryHint}'. Do not explain your suggestion or add quotation marks, just provide the text for the agent to say.

Transcript:
${transcript.map(l => `${l.role}: ${l.text}`).join('\n')}

Agent's next line:`;

    try {
      const apiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggestion',
          prompt: prompt,
        }),
      });

       if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.details || 'API request failed');
      }

      const { text: suggestion } = await apiResponse.json();
      setAgentInputText(suggestion.trim());
    } catch (error) {
      console.error("Suggestion API error:", error);
      pushLine("system", "Sorry, could not get a suggestion at this time.");
    } finally {
      setIsSuggestionLoading(false);
    }
  };

  const endSession = () => {
    handleReturnToSelection();
  };
  
  if (!scenario) {
    return <ScenarioSelection scenarios={SCENARIOS} onSelectScenario={handleScenarioSelect} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
              </svg>
            </div>
            <div>
               <h1 className="text-2xl font-semibold text-gray-800">M365 Calls Simulator</h1>
               <p className="text-base text-gray-600 -mt-0.5">{scenario.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Agent:</label>
              <input 
                className="w-32 rounded-md border-gray-300 bg-white p-1 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                value={agentName} 
                onChange={(e) => setAgentName(e.target.value)} 
                placeholder="Your Name"
              />
            </div>
             <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Disposition:</label>
              <select 
                className="w-36 rounded-md border-gray-300 bg-white p-1 text-xs shadow-sm focus:border-indigo-500 focus:ring-indigo-500" 
                value={disposition} 
                onChange={(e) => setDisposition(e.target.value)}
              >
                {DISPOSITIONS.map(d => <option key={d} value={d}>{d || 'Select...'}</option>)}
              </select>
            </div>
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={handleReturnToSelection}>Change Scenario</button>
            <button 
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400" 
              onClick={getAgentSuggestion}
              disabled={isSuggestionLoading || isAiThinking}
            >
              {isSuggestionLoading ? "Thinking..." : "Get Suggestion"}
            </button>
            <button className="rounded-xl border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={resetSession}>Reset Session</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-3">
        <section className="flex lg:col-span-1 flex-col space-y-6">
          <NotesPanel notes={notes} setNotes={setNotes} hint={scenario.summaryHint} customer={scenario.customer} />
        </section>
        <section className="lg:col-span-2">
          <Transcript 
            transcript={transcript} 
            onSend={handleAgentUtterance} 
            isAiThinking={isAiThinking}
            inputText={agentInputText}
            setInputText={setAgentInputText}
          />
        </section>
      </main>

      <Controls isListening={isListening} startListening={startListening} stopListening={stopListening} replayLast={replayLast} onEndSession={endSession} isSpeechSupported={isSpeechSupported} />

      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-4 text-center text-xs text-gray-500">
        <p>Tip: Edit the agent name to personalize opening lines. Voice recognition works best in Chrome/Edge.</p>
      </footer>
    </div>
  );
}
