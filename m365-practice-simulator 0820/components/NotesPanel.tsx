import React, { useState, useMemo, useEffect } from 'react';
import type { Notes, Customer } from '../types';

interface NotesPanelProps {
  notes: Notes;
  setNotes: React.Dispatch<React.SetStateAction<Notes>>;
  hint: string;
  customer: Customer;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ notes, setNotes, hint, customer }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const checklistItems = useMemo(() => {
    return hint
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(itemString => {
        const match = itemString.match(/\*\*(.*?):\*\*\s*(.*)/);
        if (match && match.length === 3) {
          return { full: itemString, bold: match[1].trim(), regular: match[2].trim() };
        }
        // Fallback for old format or malformed strings
        return { full: itemString, bold: itemString, regular: '' };
      });
  }, [hint]);

  useEffect(() => {
    const initialCheckedState = checklistItems.reduce((acc, item) => {
      acc[item.full] = false;
      return acc;
    }, {} as Record<string, boolean>);
    setCheckedItems(initialCheckedState);
  }, [checklistItems]);

  const handleCheckChange = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleNoteChange = (value: string) => {
    setNotes(prevNotes => ({ ...prevNotes, summary: value }));
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50/50 p-3">
        <h3 className="mb-2 text-base font-semibold text-gray-700">Customer Profile</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="font-medium text-gray-500">Name:</span> <span className="text-gray-800 text-right">{customer.name}</span></div>
          <div className="flex justify-between"><span className="font-medium text-gray-500">Email:</span> <span className="text-gray-800 text-right truncate">{customer.email}</span></div>
          <div className="flex justify-between"><span className="font-medium text-gray-500">Location:</span> <span className="text-gray-800 text-right">{customer.location}</span></div>
        </div>
      </div>
      
      <div className="mb-4 rounded-xl border bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-gray-700">Troubleshooting Checklist</h3>
        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <label key={index} className="flex items-start text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                checked={checkedItems[item.full] || false}
                onChange={() => handleCheckChange(item.full)}
              />
              <span className={`ml-2 leading-relaxed ${checkedItems[item.full] ? 'text-gray-400 line-through' : ''}`}>
                <strong className="font-semibold text-gray-900">{item.bold}:</strong> {item.regular}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-3 shadow-sm">
        <h3 className="mb-2 text-base font-semibold text-gray-700">Call Summary Notes</h3>
        <textarea
          className="h-40 w-full resize-none rounded-lg border-gray-300 bg-white p-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Key points, next steps, and confirmation outcomes."
          value={notes.summary}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNoteChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default NotesPanel;