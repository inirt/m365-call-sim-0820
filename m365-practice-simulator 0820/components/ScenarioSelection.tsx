
import React, { useState, useMemo } from 'react';
import type { Scenario } from '../types';

interface ScenarioSelectionProps {
  scenarios: Scenario[];
  onSelectScenario: (id: string) => void;
}

const ScenarioCard: React.FC<{ scenario: Scenario; onSelect: () => void; }> = ({ scenario, onSelect }) => (
  <div 
    className="flex h-full transform cursor-pointer flex-col rounded-2xl border bg-white p-6 shadow-sm transition-transform duration-200 hover:scale-105 hover:shadow-lg"
    onClick={onSelect}
  >
    <h3 className="text-lg font-semibold text-gray-800">{scenario.title}</h3>
    <p className="my-2 font-medium text-indigo-600">{scenario.product}</p>
    <div className="mt-auto text-sm text-gray-500">
      <p><strong>Customer:</strong> {scenario.customer.name}</p>
      <p><strong>Location:</strong> {scenario.customer.location}</p>
    </div>
    <button className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      Start Practice
    </button>
  </div>
);

const productOrder = ["MS Online Subscription", "MS Teams", "OneDrive", "SharePoint", "Exchange"];

const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ scenarios, onSelectScenario }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedScenarios = useMemo(() => {
    return scenarios
      .filter(s => {
        const query = searchQuery.toLowerCase();
        if (!query) return true;
        return (
          s.title.toLowerCase().includes(query) ||
          s.product.toLowerCase().includes(query) ||
          s.customer.name.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const productAIndex = productOrder.indexOf(a.product);
        const productBIndex = productOrder.indexOf(b.product);
        
        // Handle cases where product might not be in the order list
        const effectiveAIndex = productAIndex === -1 ? Infinity : productAIndex;
        const effectiveBIndex = productBIndex === -1 ? Infinity : productBIndex;

        if (effectiveAIndex !== effectiveBIndex) {
            return effectiveAIndex - effectiveBIndex;
        }
        
        return a.title.localeCompare(b.title);
      });
  }, [scenarios, searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="border-b bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">M365 Calls Simulator</h1>
            <p className="text-sm text-gray-500">Practice scenarios with voice recognition and guided call flows.</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">Select a Scenario</h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">Choose a customer support case to begin your practice session.</p>
        </div>

        <div className="relative mx-auto mt-8 max-w-2xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by title, product, or customer..."
            className="w-full rounded-xl border-gray-300 py-3 pl-10 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedScenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} onSelect={() => onSelectScenario(scenario.id)} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default ScenarioSelection;
