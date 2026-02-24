import React, { useState, useEffect, useRef } from 'react';
import { Download, Plus, FileText, Trash2, Activity, HelpCircle, Clock, Timer, Utensils, TrendingUp, BarChart3 } from 'lucide-react';

const EVENT_TYPES = ["Measurement", "Start Eating", "End Eating"];

// Helper function to format duration
function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Calculate statistics from entries
function calculateStatistics(entries, currentTime) {
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const stats = {
    timeSinceLastEndEat: null,
    timeToNextMeasurement: null,
    lastMeasurementToEndEat: null,
  };

  // Find the last "End Eating" event
  const lastEndEat = [...sortedEntries]
    .reverse()
    .find(e => e.type === "End Eating");

  if (lastEndEat) {
    const lastEndEatTime = new Date(lastEndEat.timestamp);
    stats.timeSinceLastEndEat = currentTime - lastEndEatTime;
  }

  // Find all measurements and calculate average time between them
  const measurements = sortedEntries.filter(e => e.type === "Measurement");
  if (measurements.length >= 2) {
    const intervals = [];
    for (let i = 1; i < measurements.length; i++) {
      const diff = new Date(measurements[i].timestamp) - new Date(measurements[i - 1].timestamp);
      intervals.push(diff);
    }
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;

    // Calculate time to next expected measurement
    const lastMeasurement = measurements[measurements.length - 1];
    const timeSinceLastMeasurement = currentTime - new Date(lastMeasurement.timestamp);
    stats.timeToNextMeasurement = Math.max(0, avgInterval - timeSinceLastMeasurement);
  }

  // Find the most recent measurement and calculate time to next "End Eating"
  if (measurements.length > 0) {
    const lastMeasurement = measurements[measurements.length - 1];
    const lastMeasurementTime = new Date(lastMeasurement.timestamp);

    // Find the next "End Eating" event after this measurement
    const nextEndEat = sortedEntries.find(e =>
      e.type === "End Eating" && new Date(e.timestamp) > lastMeasurementTime
    );

    if (nextEndEat) {
      stats.lastMeasurementToEndEat = new Date(nextEndEat.timestamp) - lastMeasurementTime;
    }
  }

  return stats;
}

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

  // Calculate statistics
  const stats = calculateStatistics(entries, currentTime);

  return (
    <div className="min-h-screen bg-dark-black text-white flex flex-col font-sans">
      {/* Apple-style Horizontal Navigation Bar */}
      <header className="border-b-2 border-accent-green/50 enhanced-header sticky top-0 z-20 shadow-2xl shadow-accent-green/20 bg-gradient-to-r from-dark-green-light/98 via-dark-green/98 to-dark-green-light/98 backdrop-blur-xl">
        <nav className="flex items-center px-4 py-2 space-x-6" ref={menuBarRef}>
          {/* App Title */}
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-accent-green to-cyan-accent rounded-lg shadow-lg shadow-accent-green/50">
              <Activity className="text-dark-black" size={18} />
            </div>
            <span className="bg-gradient-to-r from-accent-green via-cyan-accent to-purple-accent bg-clip-text text-transparent">Ed's Glucose Tracker</span>
          </h1>

          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowFileMenu(!showFileMenu); setShowHelpMenu(false); }}
              className={`text-xs font-bold uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg ${showFileMenu ? 'text-accent-green bg-accent-green/20 border-2 border-accent-green/50' : 'text-cyan-accent hover:text-accent-green hover:bg-accent-green/10 border-2 border-transparent'}`}
            >
              File
            </button>

            {showFileMenu && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-dark-green/98 backdrop-blur-xl border-2 border-accent-green/50 rounded-lg shadow-2xl shadow-accent-green/20 py-1 z-30">
                <button
                  onClick={() => downloadFile('csv')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-cyan-accent hover:bg-accent-green/20 hover:text-accent-green flex items-center space-x-2 transition-all rounded-md mx-1"
                >
                  <FileText size={13} />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => downloadFile('json')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-cyan-accent hover:bg-accent-green/20 hover:text-accent-green flex items-center space-x-2 transition-all rounded-md mx-1"
                >
                  <Download size={13} />
                  <span>Download JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => { setShowHelpMenu(!showHelpMenu); setShowFileMenu(false); }}
              className={`text-xs font-bold uppercase tracking-wider transition-all px-3 py-1.5 rounded-lg ${showHelpMenu ? 'text-purple-accent bg-purple-accent/20 border-2 border-purple-accent/50' : 'text-cyan-accent hover:text-purple-accent hover:bg-purple-accent/10 border-2 border-transparent'}`}
            >
              Help
            </button>

            {showHelpMenu && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-dark-green/98 backdrop-blur-xl border-2 border-purple-accent/50 rounded-lg shadow-2xl shadow-purple-accent/20 py-1 z-30">
                <button
                  onClick={() => { alert('Ed\'s Glucose Tracker v1.0\n\nTrack your glucose readings with ease.'); setShowHelpMenu(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-cyan-accent hover:bg-purple-accent/20 hover:text-purple-accent flex items-center space-x-2 transition-all rounded-md mx-1"
                >
                  <HelpCircle size={13} />
                  <span>About</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-grow p-4 flex flex-col items-center w-full space-y-5">
        {/* Stripe-style Centered Entry Form */}
        <section className="w-full max-w-md">
          <div className="stripe-form-card">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-accent-green to-cyan-accent rounded-lg shadow-lg">
                  <Plus size={18} className="text-dark-black" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-accent-green via-cyan-accent to-purple-accent bg-clip-text text-transparent tracking-tight">Add New Reading</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-dark-green-light to-dark-green px-2 py-1 rounded-lg border-2 border-accent-green/50 shadow-lg">
                <Clock size={12} className="text-accent-green" />
                <span className="text-xs text-white font-mono font-bold">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
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

        {/* Statistics Section */}
        {entries.length > 0 && (
          <section className="w-full max-w-4xl">
            <div className="bg-dark-green/50 rounded-xl border-2 border-accent-green/30 overflow-hidden shadow-lg backdrop-blur-sm">
              <div className="px-4 py-2 border-b-2 border-accent-green/30 bg-gradient-to-r from-accent-green/10 via-blue-accent/10 to-purple-accent/10 flex items-center gap-2">
                <BarChart3 size={18} className="text-accent-green" />
                <h2 className="font-bold text-base uppercase tracking-wider gradient-text">Live Statistics</h2>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Time Since Last End Eat */}
                <div className="stat-card stat-card-green group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-accent-green/20 rounded-lg group-hover:bg-accent-green/30 transition-colors border border-accent-green/40">
                      <Utensils size={16} className="text-accent-green" />
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-accent-green font-bold">
                      Since Last Meal
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono mb-0.5 bg-gradient-to-r from-accent-green to-cyan-accent bg-clip-text text-transparent">
                    {stats.timeSinceLastEndEat !== null
                      ? formatDuration(stats.timeSinceLastEndEat)
                      : 'N/A'}
                  </div>
                  <div className="text-[9px] text-text-green-dim uppercase tracking-wider">
                    Time elapsed
                  </div>
                </div>

                {/* Time to Next Measurement */}
                <div className="stat-card stat-card-blue group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-accent/20 rounded-lg group-hover:bg-blue-accent/30 transition-colors border border-blue-accent/40">
                      <Timer size={16} className="text-blue-accent" />
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-blue-accent font-bold">
                      Next Measurement
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono mb-0.5 bg-gradient-to-r from-blue-accent to-cyan-accent bg-clip-text text-transparent">
                    {stats.timeToNextMeasurement !== null
                      ? formatDuration(stats.timeToNextMeasurement)
                      : 'N/A'}
                  </div>
                  <div className="text-[9px] text-text-green-dim uppercase tracking-wider">
                    Avg interval
                  </div>
                </div>

                {/* Last Measurement to End Eat */}
                <div className="stat-card stat-card-purple group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-accent/20 rounded-lg group-hover:bg-purple-accent/30 transition-colors border border-purple-accent/40">
                      <TrendingUp size={16} className="text-purple-accent" />
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-purple-accent font-bold">
                      Meal Duration
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white font-mono mb-0.5 bg-gradient-to-r from-purple-accent to-pink-accent bg-clip-text text-transparent">
                    {stats.lastMeasurementToEndEat !== null
                      ? formatDuration(stats.lastMeasurementToEndEat)
                      : 'N/A'}
                  </div>
                  <div className="text-[9px] text-text-green-dim uppercase tracking-wider">
                    To meal end
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Data Table - Spreadsheet Style */}
        <section className="w-full max-w-4xl flex flex-col bg-dark-green/50 rounded-xl border-2 border-accent-green/30 overflow-hidden shadow-lg backdrop-blur-sm">
          <div className="px-4 py-2 border-b-2 border-accent-green/30 flex justify-between items-center bg-gradient-to-r from-accent-green/10 via-blue-accent/10 to-purple-accent/10">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-accent-green" />
              <h2 className="font-bold text-base uppercase tracking-wider gradient-text">Historical Logs</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-dark-green/80 px-2.5 py-1 rounded-lg border-2 border-accent-green/50 shadow-lg">
              <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse shadow-lg shadow-accent-green/50"></div>
              <span className="text-[11px] text-white font-mono font-bold">{entries.length} Records</span>
            </div>
          </div>

          <div className="overflow-auto flex-grow max-h-[400px]">
            <table className="spreadsheet-table">
              <thead>
                <tr className="bg-gradient-to-r from-dark-green-light to-dark-green">
                  <th className="text-[10px] uppercase tracking-widest text-accent-green font-bold text-left">Date</th>
                  <th className="text-[10px] uppercase tracking-widest text-cyan-accent font-bold text-left">Time</th>
                  <th className="text-[10px] uppercase tracking-widest text-blue-accent font-bold text-left">Event</th>
                  <th className="text-[10px] uppercase tracking-widest text-purple-accent font-bold text-right">Glucose</th>
                  <th className="text-[10px] uppercase tracking-widest text-pink-accent font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-accent-green/20 to-purple-accent/20 rounded-full border-2 border-accent-green/50 shadow-lg shadow-accent-green/30">
                          <FileText size={28} className="text-accent-green" />
                        </div>
                        <div>
                          <p className="text-white font-bold mb-0.5 bg-gradient-to-r from-accent-green to-cyan-accent bg-clip-text text-transparent">No entries yet</p>
                          <p className="text-cyan-accent/70 text-xs font-semibold">Start by adding your first reading above</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => {
                    const date = new Date(entry.timestamp);
                    return (
                      <tr key={entry.id} className="group table-row-enter" style={{ animationDelay: `${index * 0.05}s` }}>
                        <td className="font-mono text-xs text-accent-green font-semibold">{date.toLocaleDateString()}</td>
                        <td className="font-mono text-xs text-cyan-accent font-semibold">{date.toLocaleTimeString()}</td>
                        <td>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-tight border-2 shadow-lg ${
                            entry.type === 'Measurement'
                              ? 'bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 text-emerald-300 border-emerald-400/60 shadow-emerald-500/30'
                              : entry.type === 'Start Eating'
                              ? 'bg-gradient-to-r from-accent-green/30 to-green-500/30 text-accent-green border-accent-green/60 shadow-accent-green/30'
                              : 'bg-gradient-to-r from-lime-500/30 to-yellow-500/30 text-lime-300 border-lime-400/60 shadow-lime-500/30'
                          }`}>
                            {entry.type === 'Measurement' && <Activity size={11} />}
                            {entry.type === 'Start Eating' && <Utensils size={11} />}
                            {entry.type === 'End Eating' && <Clock size={11} />}
                            {entry.type}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-baseline gap-1">
                            <span className="text-xl font-extrabold bg-gradient-to-r from-purple-accent via-pink-accent to-orange-accent bg-clip-text text-transparent">{entry.glucose}</span>
                            <span className="text-[9px] text-purple-accent uppercase tracking-wider font-bold">mg/dL</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="p-1.5 rounded-lg text-pink-accent/60 hover:text-rose-accent hover:bg-rose-accent/20 border border-transparent hover:border-rose-accent/50 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                            title="Delete Entry"
                          >
                            <Trash2 size={14} />
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

      <footer className="p-3 text-center border-t-2 border-accent-green/50 bg-gradient-to-r from-dark-green-light/95 via-dark-green/95 to-dark-green-light/95 backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold bg-gradient-to-r from-accent-green via-cyan-accent to-purple-accent bg-clip-text text-transparent">
          &copy; 2025 Ed's Glucose Tracker
        </p>
        <p className="text-cyan-accent/60 text-[8px] uppercase tracking-wider mt-0.5 font-semibold">
          React • Vite • Tailwind CSS
        </p>
      </footer>
    </div>
  );
}

export default App;
