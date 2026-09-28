'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, BookOpen, Calendar, CheckCircle2, 
  ChevronRight, Clock, Heart, Home, MessageSquare, Plus, 
  ShieldAlert, Sparkles, UserCheck, Users, X, Send, Award, Filter
} from 'lucide-react';

const CHILD_ID = '6abaa8074d399b7bd373cb2a';

export default function NeuroAIDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Data States
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any>({ avgIntensity: 0, triggers: [], locations: [], totalEpisodes: 0 });
  const [routines, setRoutines] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([
    { sender: 'ai', text: 'Hello! I am your NeuroAI Assistant. How can I help you support Alex today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Meltdown Log Form State
  const [logForm, setLogForm] = useState({
    childId: CHILD_ID,
    ts: new Date().toISOString().substring(0, 16),
    location: 'Home',
    activity: 'Transitioning to lunch',
    sensoryEnvironment: 'Loud',
    sleepHours: 8,
    hungerLevel: 'Moderate',
    trigger: 'Sudden Noise',
    behaviors: ['Covering ears', 'Crying'],
    intensity: 3,
    durationMinutes: 15,
    response: 'Moved to quiet room',
    recoveryMinutes: 20,
    calmingInterventions: ['Weighted Blanket', 'Noise Canceling Headphones'],
    postEpisodeBehavior: 'Calm but fatigued'
  });

  useEffect(() => {
    fetchTimeline();
    fetchPatterns();
    fetchRoutines();
    fetchActivities();
  }, []);

  const fetchTimeline = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/children/${CHILD_ID}/timeline`);
      const data = await res.json();
      if (Array.isArray(data)) setTimelineEvents(data);
    } catch (e) {
      console.error('Failed to fetch timeline', e);
    }
  };

  const fetchPatterns = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/children/${CHILD_ID}/patterns`);
      const data = await res.json();
      setPatterns(data);
    } catch (e) {
      console.error('Failed to fetch patterns', e);
    }
  };

  const fetchRoutines = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/children/${CHILD_ID}/routines`);
      const data = await res.json();
      if (Array.isArray(data)) setRoutines(data);
    } catch (e) {
      console.error('Failed to fetch routines', e);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/activities`);
      const data = await res.json();
      if (Array.isArray(data)) setActivities(data);
    } catch (e) {
      console.error('Failed to fetch activities', e);
    }
  };

  const submitEpisodeLog = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logForm)
      });
      if (res.ok) {
        setIsLogModalOpen(false);
        setWizardStep(1);
        fetchTimeline();
        fetchPatterns();
      }
    } catch (e) {
      console.error('Failed to save episode', e);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    try {
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, childId: CHILD_ID })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting right now.' }]);
    }
  };

  const submitActivityFeedback = async (activityId: string, rating: string) => {
    try {
      await fetch(`http://localhost:5000/api/activities/${activityId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: CHILD_ID, rating })
      });
      alert(`Feedback recorded: ${rating}`);
    } catch (e) {
      console.error('Failed to record activity feedback', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            🧠
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-teal-600 bg-clip-text text-transparent">
              NeuroAI
            </span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium ml-2 border border-indigo-100">
              Care Suite
            </span>
          </div>
        </div>

        {/* Active Profile */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-slate-700">Alex Jenkins (Age 6)</span>
          </div>

          <button 
            onClick={() => setIsLogModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Event</span>
          </button>

          <button 
            onClick={() => setIsEmergencyOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 shadow-sm animate-bounce"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency SOS</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-1 hidden lg:block">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'logger', label: 'Meltdown Logger', icon: AlertTriangle },
            { id: 'routines', label: 'Routines & Checklist', icon: Calendar },
            { id: 'insights', label: 'Pattern Analytics', icon: Activity },
            { id: 'activities', label: 'Activity Engine', icon: Award },
            { id: 'therapist', label: 'Therapist Portal', icon: Users },
          ].map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                  active 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Episode Intensity</div>
                  <div className="text-3xl font-extrabold text-slate-800 mt-2">{patterns.avgIntensity || '0'}<span className="text-lg text-slate-400 font-normal">/5</span></div>
                  <div className="text-xs text-emerald-600 mt-2 font-medium">↓ 12% lower than last week</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Episodes Logged</div>
                  <div className="text-3xl font-extrabold text-slate-800 mt-2">{patterns.totalEpisodes || '0'}</div>
                  <div className="text-xs text-slate-500 mt-2">Recorded in past 30 days</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Primary Trigger</div>
                  <div className="text-xl font-bold text-indigo-600 mt-2 truncate">{patterns.triggers?.[0] || 'None Identified'}</div>
                  <div className="text-xs text-slate-500 mt-2">Correlated with sensory overload</div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Routine Success Rate</div>
                  <div className="text-3xl font-extrabold text-teal-600 mt-2">85%</div>
                  <div className="text-xs text-teal-600 mt-2 font-medium">↑ High consistency this week</div>
                </div>
              </div>

              {/* AI Insight Highlight Banner */}
              <div className="bg-gradient-to-r from-indigo-500 to-teal-600 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span className="font-bold text-sm tracking-wide uppercase text-indigo-100">AI Pattern Recognition</span>
                  </div>
                  <p className="text-lg font-medium">
                    Observed Correlation: 66% of sensory meltdowns occurred near 2:00 PM during transition to lunch.
                  </p>
                </div>
                <button onClick={() => setActiveTab('insights')} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm transition">
                  View Analysis
                </button>
              </div>

              {/* Live Timeline Feed */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
                  <span>Child Activity Timeline</span>
                  <button className="text-sm text-indigo-600 hover:underline flex items-center space-x-1">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </h3>

                <div className="space-y-4">
                  {timelineEvents.length === 0 ? (
                    <p className="text-slate-400 text-sm italic">No events logged yet.</p>
                  ) : (
                    timelineEvents.map((evt, idx) => (
                      <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
                        <div className={`p-2.5 rounded-xl text-white font-bold text-xs ${
                          evt.type === 'episode' ? 'bg-rose-500' :
                          evt.type === 'note' ? 'bg-indigo-500' :
                          evt.type === 'progress' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}>
                          {evt.type.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-800">{evt.title}</h4>
                            <span className="text-xs text-slate-400">{new Date(evt.ts).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{evt.details}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MELTDOWN LOGGER PAGE */}
          {activeTab === 'logger' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-bold text-slate-800">Behavioral Episode Logger</h2>
                <p className="text-slate-500 text-sm">Structured Before → During → After episode logging system.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* STEP 1 */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
                  <span className="text-xs font-bold text-indigo-600 uppercase">Step 1: Before</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">Triggers & Context</p>
                  <ul className="text-xs text-slate-600 mt-2 space-y-1">
                    <li>• Environment: {logForm.sensoryEnvironment}</li>
                    <li>• Sleep: {logForm.sleepHours} Hours</li>
                    <li>• Trigger: {logForm.trigger}</li>
                  </ul>
                </div>

                {/* STEP 2 */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                  <span className="text-xs font-bold text-rose-600 uppercase">Step 2: During</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">Behaviors & Severity</p>
                  <ul className="text-xs text-slate-600 mt-2 space-y-1">
                    <li>• Intensity: {logForm.intensity}/5</li>
                    <li>• Duration: {logForm.durationMinutes} mins</li>
                    <li>• Action: {logForm.response}</li>
                  </ul>
                </div>

                {/* STEP 3 */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <span className="text-xs font-bold text-emerald-600 uppercase">Step 3: After</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">De-escalation & Recovery</p>
                  <ul className="text-xs text-slate-600 mt-2 space-y-1">
                    <li>• Recovery: {logForm.recoveryMinutes} mins</li>
                    <li>• Calming: {logForm.calmingInterventions.join(', ')}</li>
                  </ul>
                </div>
              </div>

              <button 
                onClick={() => setIsLogModalOpen(true)} 
                className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition"
              >
                Open Full Meltdown Logging Wizard
              </button>
            </div>
          )}

          {/* TAB 3: ROUTINES & CHECKLIST */}
          {activeTab === 'routines' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Daily Routines & Schedules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routines.length === 0 ? (
                  <p className="text-slate-400 text-sm">No routines configured yet.</p>
                ) : (
                  routines.map((r, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg">{r.name}</h3>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium">
                          {r.time || 'Daily'}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {r.steps?.map((step: string, idx: number) => (
                          <label key={idx} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" />
                            <span className="text-sm font-medium text-slate-700">{step}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PATTERN ANALYTICS */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Pattern Recognition Engine</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800">Identified Triggers</h3>
                  <div className="flex flex-wrap gap-2">
                    {patterns.triggers?.map((trig: string, i: number) => (
                      <span key={i} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-rose-100">
                        ⚠️ {trig}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800">Primary Locations</h3>
                  <div className="flex flex-wrap gap-2">
                    {patterns.locations?.map((loc: string, i: number) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-indigo-100">
                        📍 {loc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PERSONALIZED ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800">Personalized Activity Engine</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activities.map((act, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md font-semibold">
                        {act.category || 'Sensory'}
                      </span>
                      <h3 className="font-bold text-slate-800 text-lg mt-2">{act.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{act.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase">Log Outcome</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => submitActivityFeedback(act._id, 'Completed')} 
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold py-2 rounded-lg transition"
                        >
                          ✓ Completed
                        </button>
                        <button 
                          onClick={() => submitActivityFeedback(act._id, 'Too Difficult')} 
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold py-2 rounded-lg transition"
                        >
                          ✕ Too Hard
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: THERAPIST PORTAL */}
          {activeTab === 'therapist' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Therapist & Caregiver Collaboration</h2>
                  <p className="text-sm text-slate-500">Shared clinical notes, grants, and PDF clinical export.</p>
                </div>
                <button onClick={() => alert('PDF report export initialized')} className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl">
                  Export 30-Day PDF Report
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-800">Authorized Specialists</h3>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      DA
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Dr. Aris (Occupational Therapist)</h4>
                      <span className="text-xs text-slate-500">Access granted for timeline and activity feedback</span>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">Active</span>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FLOATING AI CHAT FAB */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition z-40 flex items-center space-x-2"
      >
        <Sparkles className="w-6 h-6" />
        <span className="font-bold text-sm hidden md:inline">NeuroAI Assistant</span>
      </button>

      {/* AI CHAT SLIDE-OVER DRAWER */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col">
          <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span className="font-bold">NeuroAI Assistant</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                  msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 flex space-x-2">
            <input 
              type="text" 
              value={chatInput} 
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
              placeholder="Ask about routines, sensory tips..." 
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-600"
            />
            <button onClick={sendChatMessage} className="bg-indigo-600 text-white p-2 rounded-xl">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MELTDOWN LOGGER MULTI-STEP WIZARD MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-800">
                Episode Logger — Step {wizardStep} of 3
              </h3>
              <button onClick={() => setIsLogModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* STEP 1: BEFORE */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 text-sm uppercase">Step 1: Before (Context & Triggers)</h4>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Location</label>
                  <input type="text" value={logForm.location} onChange={(e) => setLogForm({...logForm, location: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Primary Trigger</label>
                  <input type="text" value={logForm.trigger} onChange={(e) => setLogForm({...logForm, trigger: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2 text-sm mt-1" />
                </div>
              </div>
            )}

            {/* STEP 2: DURING */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <h4 className="font-bold text-rose-600 text-sm uppercase">Step 2: During (Behaviors & Intensity)</h4>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Intensity Level (1-5)</label>
                  <input type="range" min="1" max="5" value={logForm.intensity} onChange={(e) => setLogForm({...logForm, intensity: Number(e.target.value)})} className="w-full accent-rose-600 mt-2" />
                  <span className="text-sm font-bold text-rose-600">{logForm.intensity} / 5</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Duration (Minutes)</label>
                  <input type="number" value={logForm.durationMinutes} onChange={(e) => setLogForm({...logForm, durationMinutes: Number(e.target.value)})} className="w-full border border-slate-300 rounded-xl p-2 text-sm mt-1" />
                </div>
              </div>
            )}

            {/* STEP 3: AFTER */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <h4 className="font-bold text-emerald-600 text-sm uppercase">Step 3: After (De-escalation & Recovery)</h4>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Recovery Time (Minutes)</label>
                  <input type="number" value={logForm.recoveryMinutes} onChange={(e) => setLogForm({...logForm, recoveryMinutes: Number(e.target.value)})} className="w-full border border-slate-300 rounded-xl p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Post-Episode Behavior</label>
                  <input type="text" value={logForm.postEpisodeBehavior} onChange={(e) => setLogForm({...logForm, postEpisodeBehavior: e.target.value})} className="w-full border border-slate-300 rounded-xl p-2 text-sm mt-1" />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
              {wizardStep > 1 ? (
                <button onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold">
                  Back
                </button>
              ) : <div />}

              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(s => s + 1)} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  Next
                </button>
              ) : (
                <button onClick={submitEpisodeLog} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  Save Episode Log
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY SOS MODAL */}
      {isEmergencyOpen && (
        <div className="fixed inset-0 bg-rose-950/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border-2 border-rose-500 w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between text-rose-600">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
                <h3 className="font-bold text-xl">Emergency De-Escalation</h3>
              </div>
              <button onClick={() => setIsEmergencyOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">Quick De-Escalation Steps:</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Reduce sensory stimuli (Dim lights, eliminate background noise).</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Offer deep-pressure therapy (Weighted blanket or firm hug).</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>Use minimal clear language; avoid demanding responses.</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <a href="tel:911" className="bg-rose-600 text-white py-3 rounded-xl font-bold text-center block">
                Call Emergency (911)
              </a>
              <button onClick={() => alert('Therapist alerted')} className="bg-indigo-600 text-white py-3 rounded-xl font-bold">
                Alert Therapist
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}