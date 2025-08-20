
import React from 'react';
import type { Scenario } from '../types';

interface ScenarioPickerProps {
  scenarios: Scenario[];
  scenarioId: string;
  setScenarioId: (id: string) => void;
  agentName: string;
  setAgentName: (name: string) => void;
}

const ScenarioPicker: React.FC<ScenarioPickerProps> = ({ scenarios, scenarioId, setScenarioId, agentName, setAgentName }) => {
  const scenario = scenarios.find((s) => s.id === scenarioId) || scenarios[0];

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-800">Scenario Configuration</h2>
      <select
        className="w-full rounded-xl border-gray-300 p-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={scenarioId}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setScenarioId(e.target.value)}
      >
        {scenarios.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
      </select>
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Agent Name</label>
          <input
            className="mt-1 w-full rounded-xl border-gray-300 p-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={agentName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value)}
            placeholder="{{AGENT_NAME}}"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Product</label>
          <input
            className="mt-1 w-full rounded-xl border-gray-300 bg-gray-100 p-2.5 text-sm text-gray-600 shadow-sm"
            value={scenario.product}
            readOnly
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Customer Profile</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="font-medium text-gray-500">Name:</span> <span className="text-gray-800 text-right">{scenario.customer.name}</span></div>
          <div className="flex justify-between"><span className="font-medium text-gray-500">Email:</span> <span className="text-gray-800 text-right truncate">{scenario.customer.email}</span></div>
          <div className="flex justify-between"><span className="font-medium text-gray-500">Location:</span> <span className="text-gray-800 text-right">{scenario.customer.location}</span></div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPicker;