import React, { useState, useEffect, useRef } from 'react';
import { Download, Plus, FileText, Trash2, Activity, HelpCircle } from 'lucide-react';

const EVENT_TYPES = ["Measurement", "Start Eating", "End Eating"];

function App() {
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('glucose_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [glucose, setGlucose] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const menuBarRef = useRef(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist data
  useEffect(() => {
    localStorage.setItem('glucose_data', JSON.stringify(entries));
  }, [entries]);

  // Handle outside click for menus
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target)) {
        setShowFileMenu(false);
        setShowHelpMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddEntry = () => {
    const glucoseValue = parseInt(glucose);
    if (isNaN(glucoseValue) || glucoseValue < 0 || glucoseValue > 400) {
      alert("Please enter a valid glucose reading between 0 and 400.");
      return;
    }

    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: eventType,
      glucose: glucoseValue,
    };

    setEntries([...entries, newEntry]);
    setGlucose('');
  };

  const removeEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const downloadFile = (format) => {
    let content = '';
    let mimeType = '';
    let fileName = `glucose_data_${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      content = "Date,Time,Event Type,Glucose (mg/dL)\n" +
        entries.map(e => {
          const d = new Date(e.timestamp);
          return `${d.toLocaleDateString()},${d.toLocaleTimeString()},${e.type},${e.glucose}`;
        }).join("\n");
      mimeType = 'text/csv';
      fileName += '.csv';
    } else {
      content = JSON.stringify(entries, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setShowFileMenu(false);
  };

  return (
    <div className="min-h-screen bg-dark-black text-white flex flex-col font-sans">
      {/* Apple-style Horizontal Navigation Bar */}
      <header className="border-b border-border-green bg-dark-green/95 backdrop-blur-md sticky top-0 z-20">
        <nav className="flex items-center px-6 py-3 space-x-8" ref={menuBarRef}>
          {/* App Title */}
          <h1 className="text-lg font-semibold tracking-tight text-white">
            <span className="text-accent-green">Ed's</span> Glucose Tracker
          </h1>

          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowFileMenu(!showFileMenu); setShowHelpMenu(false); }}
              className={`text-sm font-medium transition-colors ${showFileMenu ? 'text-accent-green' : 'text-text-green hover:text-white'}`}
            >
              File
            </button>

            {showFileMenu && (
              <div className="absolute top-full left-0 mt-3 w-48 bg-dark-green/95 backdrop-blur-md border border-border-green rounded-lg shadow-2xl py-2 z-30">
                <button
                  onClick={() => downloadFile('csv')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-dark-green-light hover:text-accent-green flex items-center space-x-3 transition-colors"
                >
                  <FileText size={14} />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => downloadFile('json')}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-dark-green-light hover:text-accent-green flex items-center space-x-3 transition-colors"
                >
                  <Download size={14} />
                  <span>Download JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowHelpMenu(!showHelpMenu); setShowFileMenu(false); }}
              className={`text-sm font-medium transition-colors ${showHelpMenu ? 'text-accent-green' : 'text-text-green hover:text-white'}`}
            >
              Help
            </button>

            {showHelpMenu && (
              <div className="absolute top-full left-0 mt-3 w-48 bg-dark-green/95 backdrop-blur-md border border-border-green rounded-lg shadow-2xl py-2 z-30">
                <button
                  onClick={() => { alert('Ed\'s Glucose Tracker v1.0\n\nTrack your glucose readings with ease.'); setShowHelpMenu(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-dark-green-light hover:text-accent-green flex items-center space-x-3 transition-colors"
                >
                  <HelpCircle size={14} />
                  <span>About</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow p-6 flex flex-col items-center w-full space-y-8">
        {/* Stripe-style Centered Entry Form */}
        <section className="w-full max-w-md">
          <div className="stripe-form-card">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-white tracking-tight">Add New Reading</h2>
              <span className="text-sm text-text-green font-mono">
                {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-4">
              {/* Event Type Field - Stripe Style */}
              <div className="stripe-input-group">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="stripe-select"
                >
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label className="stripe-select-label">Event Type</label>
              </div>

              {/* Glucose Reading Field - Stripe Style with Floating Label */}
              <div className="stripe-input-group">
                <input
                  type="number"
                  min="0"
                  max="400"
                  value={glucose}
                  onChange={(e) => setGlucose(e.target.value)}
                  placeholder=" "
                  className={`stripe-input ${glucose ? 'has-value' : ''}`}
                />
                <label className="stripe-label">Glucose Reading (mg/dL)</label>
                <Activity className="absolute right-4 top-1/2 -translate-y-1/2 text-text-green opacity-50" size={18} />
              </div>

              {/* Submit Button - Stripe Style */}
              <button
                onClick={handleAddEntry}
                className="stripe-button mt-2"
              >
                <Plus size={20} />
                <span>Add Record</span>
              </button>
            </div>
          </div>
        </section>

        {/* Data Table - Spreadsheet Style */}
        <section className="w-full max-w-4xl flex flex-col bg-dark-green rounded-xl border border-border-green overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-border-green flex justify-between items-center bg-dark-green-light">
            <h2 className="font-bold text-lg uppercase tracking-wider text-accent-green">Historical Logs</h2>
            <span className="text-xs text-text-green">{entries.length} Records found</span>
          </div>

          <div className="overflow-auto flex-grow max-h-[400px]">
            <table className="spreadsheet-table">
              <thead>
                <tr>
                  <th className="text-xs uppercase tracking-widest text-text-green font-bold text-left">Date</th>
                  <th className="text-xs uppercase tracking-widest text-text-green font-bold text-left">Time</th>
                  <th className="text-xs uppercase tracking-widest text-text-green font-bold text-left">Event</th>
                  <th className="text-xs uppercase tracking-widest text-text-green font-bold text-right">Glucose</th>
                  <th className="text-xs uppercase tracking-widest text-text-green font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-text-green-dim italic py-12">No entries yet. Start by adding your first reading above.</td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const date = new Date(entry.timestamp);
                    return (
                      <tr key={entry.id} className="group">
                        <td className="font-mono text-sm">{date.toLocaleDateString()}</td>
                        <td className="font-mono text-sm text-gray-300">{date.toLocaleTimeString()}</td>
                        <td>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter ${entry.type === 'Measurement' ? 'bg-emerald-900/40 text-emerald-400' :
                            entry.type === 'Start Eating' ? 'bg-green-900/40 text-accent-green' :
                              'bg-lime-900/40 text-lime-400'
                            }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="text-right font-bold text-accent-green">
                          <span className="text-xl">{entry.glucose}</span>
                          <span className="text-[10px] ml-1 text-text-green uppercase">mg/dL</span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="p-2 text-border-green-light hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <footer className="p-6 text-center text-text-green-dim text-[10px] uppercase tracking-[0.2em]">
        &copy; 2025 Ed's Glucose Tracker • Built with Vite &amp; Tailwind
      </footer>
    </div>
  );
}

export default App;
