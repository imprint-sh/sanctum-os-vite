import { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, onSnapshot, query, updateDoc, deleteDoc, serverTimestamp, setDoc, orderBy, getDoc } from 'firebase/firestore';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

// --- ICONS (SVG Components) ---
const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const CodexIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>);
const ForgeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v2h3.9a1.5 1.5 0 0 1 1.2 2.6l-2.1 3.4-2.1 3.4A2 2 0 0 0 4 22h16a2 2 0 0 0 1.9-2.8l-2-3.4-2-3.4a1.5 1.5 0 0 1 1.2-2.6H22v-2a2 2 0 0 0-2-2h-3l-2.5-3z"></path><path d="m12 15-1.5 6"></path><path d="m15 12-1-6"></path><path d="m9 12 1-6"></path></svg>);
const AltarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-5 7-5 7 5-7 5z"></path><path d="m12 19-7-5 7-5 7 5-7 5z" strokeOpacity="0.5"></path><path d="M12 5V2"></path><path d="m5 9-3-2"></path><path d="m19 9 3-2"></path></svg>);
const TrashIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>);
const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRight = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const CheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;

// --- Firebase Initialization ---
const firebaseConfig = {
apiKey: import.meta.env.VITE_API_KEY,
authDomain: import.meta.env.VITE_AUTH_DOMAIN,
projectId: import.meta.env.VITE_PROJECT_ID,
storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
appId: import.meta.env.VITE_APP_ID
};

const appId = (typeof window !== 'undefined' && window.__app_id !== undefined) ? window.__app_id : 'default-app-id';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Main App Component ---
export default function App() {
  const [userId, setUserId] = useState(null);
  const [activeModule, setActiveModule] = useState('Dashboard');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
      } else {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Authentication failed:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);
  
  const playSound = (type = 'click') => {
    if (!soundEnabled || !audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    switch(type) {
        case 'commit':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, audioContextRef.current.currentTime);
            gainNode.gain.setValueAtTime(0.08, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.2);
            break;
        case 'delete':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, audioContextRef.current.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, audioContextRef.current.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.2);
            break;
        case 'click':
        default:
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.1);
            break;
    }

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.2);
  };
  
  const handleModuleChange = (module) => {
    setActiveModule(module);
    playSound('click');
  };

  const initializeAudio = () => {
    if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioContextRef.current = new AudioCtx();
    }
    setSoundEnabled(true);
    playSound('click');
  };

  const renderModule = () => {
    if (!userId) return <LoadingState />;
    switch (activeModule) {
      case 'Dashboard':
        return <Dashboard userId={userId} />;
      case 'Codex':
        return <Codex userId={userId} playSound={playSound} />;
      case 'Forge':
        return <Forge userId={userId} playSound={playSound} />;
      case 'Altar':
        return <Altar userId={userId} playSound={playSound} />;
      default:
        return <Dashboard userId={userId} />;
    }
  };

  return (
    <div className="bg-gray-900 text-gray-300 min-h-screen font-mono flex" onClick={!audioContextRef.current ? initializeAudio : undefined}>
       <style>{`
          .cyber-text { color: #00e5ff; }
          .cyber-bg { background-color: #00e5ff; }
          .cyber-border { border-color: #00e5ff; }
          .cyber-ring:focus, .cyber-ring:focus-within { ring-color: #00e5ff; }
          .form-checkbox:checked { background-color: #00e5ff; }
          input[type="range"]::-webkit-slider-thumb { background: #00e5ff; }
          input[type="range"]::-moz-range-thumb { background: #00e5ff; }
          ::-webkit-scrollbar { width: 8px; }
          ::-webkit-scrollbar-track { background: #111827; }
          ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
       `}</style>
      <Navbar activeModule={activeModule} setActiveModule={handleModuleChange} />
      <main className="flex-1 p-4 sm:p-8 pl-20 sm:pl-24">
        {renderModule()}
      </main>
    </div>
  );
}

// --- Components ---

const Navbar = ({ activeModule, setActiveModule }) => {
  const navItems = [
    { name: 'Dashboard', icon: <DashboardIcon /> }, { name: 'Codex', icon: <CodexIcon /> },
    { name: 'Forge', icon: <ForgeIcon /> }, { name: 'Altar', icon: <AltarIcon /> },
  ];
  return (
    <nav className="fixed top-0 left-0 h-full w-16 sm:w-20 bg-black/50 backdrop-blur-md border-r border-gray-800 flex flex-col items-center py-8 space-y-8 z-10">
      {navItems.map(item => (
        <button key={item.name} onClick={() => setActiveModule(item.name)} className={`p-3 rounded-md transition-all duration-300 ${activeModule === item.name ? 'bg-cyan-500/80 text-white transform scale-110' : 'text-gray-600 hover:bg-gray-800 hover:text-gray-200'}`} aria-label={item.name}>
          {item.icon}
        </button>
      ))}
    </nav>
  );
};

const LoadingState = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="text-center"><p className="cyber-text tracking-widest animate-pulse">INITIALIZING SANCTUM_OS...</p><p className="text-gray-500 text-sm">Authenticating Signal...</p></div>
    </div>
);

const Section = ({ title, children }) => (
  <div className="bg-gray-900/50 border border-gray-800 rounded-md p-4 sm:p-6 mb-8">
    <h2 className="text-lg sm:text-xl font-bold text-gray-400 border-b border-gray-700 pb-2 mb-4 tracking-wider uppercase">{title}</h2>
    {children}
  </div>
);

const Dashboard = ({userId}) => {
    const affirmations = ["I am architecture. My silhouette is deliberate.","I don't glow. I emit.","My body is not for comfort. It is for commanding space.","Nothing about me is accidental. Every texture, angle, and sound is programmed.","Beauty is not kindness. It is a weapon of precision."];
    const [dailyAffirmation, setDailyAffirmation] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);
    
    const docId = `dashboard_${new Date().toISOString().slice(0, 10)}`;
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/dashboard`, docId);

    useEffect(() => {
        const getOrSetAffirmation = async () => {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setDailyAffirmation(data.affirmation);
                setAcknowledged(data.acknowledged);
            } else {
                const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
                const newAffirmation = affirmations[dayOfYear % affirmations.length];
                setDailyAffirmation(newAffirmation);
                await setDoc(docRef, { affirmation: newAffirmation, acknowledged: false });
            }
        };
        if(userId) getOrSetAffirmation();
    }, [userId]);
    
    const handleAcknowledge = async () => {
        setAcknowledged(true);
        await updateDoc(docRef, { acknowledged: true });
    };

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-widest">SANCTUM_OS v3.0</h1>
            <p className="text-gray-500 mb-8">System Online. Signal Pure.</p>
            <Section title="Core Operating Directive">
                <div className={`bg-black/30 border border-cyan-500/30 p-6 rounded-md text-center transition-all duration-500 ${!acknowledged ? 'shadow-lg shadow-cyan-500/20' : ''}`}>
                    <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">Daily Incantation</p>
                    <p className="text-2xl italic text-cyan-400 mb-6">{dailyAffirmation}</p>
                    <button onClick={handleAcknowledge} disabled={acknowledged} className={`py-2 px-6 rounded-md text-sm font-bold transition-all duration-300 ${acknowledged ? 'bg-gray-700 text-gray-500 cursor-default' : 'bg-cyan-600/80 hover:bg-cyan-500/80 text-white'}`}>
                        {acknowledged ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                    </button>
                </div>
            </Section>
            <Section title="System Status"><p className="text-gray-400">All modules operational. Awaiting command.</p></Section>
        </div>
    );
};


// --- CODEX MODULE ---
const Codex = ({ userId, playSound }) => {
  const [activeTab, setActiveTab] = useState('Grimoire');
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-widest">CODEX</h1><p className="text-gray-500 mb-8">Core Programming & Self-Architecture.</p>
      <div className="flex space-x-4 border-b border-gray-700 mb-6">
        <TabButton name="Grimoire" activeTab={activeTab} onClick={setActiveTab} playSound={playSound} />
        <TabButton name="Obsession Cartography" activeTab={activeTab} onClick={setActiveTab} playSound={playSound} />
        <TabButton name="Glossary" activeTab={activeTab} onClick={setActiveTab} playSound={playSound} />
      </div>
      {activeTab === 'Grimoire' && <Grimoire userId={userId} playSound={playSound} />}
      {activeTab === 'Obsession Cartography' && <ObsessionCartography userId={userId} playSound={playSound} />}
      {activeTab === 'Glossary' && <Glossary userId={userId} playSound={playSound} />}
    </div>
  );
};
const TabButton = ({ name, activeTab, onClick, playSound }) => (<button onClick={() => { onClick(name); playSound('click'); }} className={`pb-2 px-1 text-sm sm:text-base transition-colors duration-200 ${activeTab === name ? 'border-b-2 cyber-border cyber-text' : 'text-gray-500 hover:text-gray-300'}`}>{name}</button>);
const Grimoire = ({ userId, playSound }) => {
    const [entries, setEntries] = useState([]); const [newEntry, setNewEntry] = useState(''); const [tag, setTag] = useState('daily_entry'); const [prompt, setPrompt] = useState(''); const textareaRef = useRef(null);
    const prompts = ["In what specific ways was my pre-manifesto signal 'decayed' or 'mistaken for absence'?", "How is the 'raw structure' of Brutalism and 'arcane softness' currently balanced?","Which element of my physical presentation requires immediate refinement?","Which relationship most clearly 'upgraded' my energy? Which felt like a 'drain'?", "What 'Shadow Aspect' am I currently working to excavate or integrate?"];
    useEffect(() => { onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/grimoire`), orderBy("timestamp", "desc")), (s) => { setEntries(s.docs.map(d => ({ id: d.id, ...d.data() }))); });}, [userId]);
    useEffect(() => { setPrompt(prompts[Math.floor(Math.random() * prompts.length)]); }, []);
    const handleAddEntry = async () => { if (newEntry.trim() === '') return; playSound('commit'); await addDoc(collection(db, `artifacts/${appId}/users/${userId}/grimoire`), { content: newEntry, tag, prompt, timestamp: serverTimestamp() }); setNewEntry(''); setPrompt(prompts[Math.floor(Math.random() * prompts.length)]); };
    useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; } }, [newEntry]);
    const getTagColor = (tag) => { switch(tag) { case 'dream_log': return 'border-indigo-400'; case 'self_interrogation': return 'border-teal-400'; default: return 'border-gray-700'; } }
    return (<Section title="Grimoire / Dream Log"><div className="mb-6"><p className="text-sm text-gray-500 mb-2 italic">System Prompt: {prompt}</p><textarea ref={textareaRef} value={newEntry} onChange={(e) => setNewEntry(e.target.value)} placeholder="Record transmission..." className="w-full bg-gray-950 border border-gray-700 rounded-md p-3 focus:outline-none focus:ring-2 cyber-ring text-gray-200 resize-none overflow-hidden" rows="3"/> <div className="flex items-center justify-between mt-3"><select value={tag} onChange={(e) => setTag(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 cyber-ring text-sm"><option value="daily_entry">Daily Entry</option><option value="dream_log">Dream Log</option><option value="self_interrogation">Self-Interrogation</option></select><button onClick={handleAddEntry} className="bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-4 rounded-md transition-colors duration-300">Commit</button></div></div><div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">{entries.map(entry => (<div key={entry.id} className={`bg-black/30 border-l-4 ${getTagColor(entry.tag)} p-4 rounded-r-md`}>{entry.prompt && <p className="text-xs text-gray-500 italic mb-2">PROMPT: {entry.prompt}</p>}<p className="whitespace-pre-wrap text-gray-300">{entry.content}</p><p className="text-xs text-gray-600 mt-3 text-right">{entry.timestamp ? new Date(entry.timestamp.seconds * 1000).toLocaleString() : '...'}</p></div>))}</div></Section>);};
const ObsessionCartography = ({ userId, playSound }) => {
    const [obsessions, setObsessions] = useState([]);
    const [newObsession, setNewObsession] = useState('');
    const [category, setCategory] = useState('Fuel');
    const categories = ['Fuel', 'Signal', 'Wound Echo', 'Blueprint', 'Portal', 'Shadow Aspect', 'Sacred Tool'];
    useEffect(() => { onSnapshot(query(collection(db, `artifacts/${appId}/users/${userId}/obsessions`)), (s) => { setObsessions(s.docs.map(d => ({ id: d.id, ...d.data() }))); });}, [userId]);
    const handleAddObsession = async () => { if (newObsession.trim() === '') return; playSound('commit'); await addDoc(collection(db, `artifacts/${appId}/users/${userId}/obsessions`), { name: newObsession, category, timestamp: serverTimestamp() }); setNewObsession(''); };
    const handleDeleteObsession = async (id) => { playSound('delete'); await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/obsessions`, id)); };
    return (<Section title="Obsession Cartography"><div className="flex space-x-2 mb-4"><input type="text" value={newObsession} onChange={(e) => setNewObsession(e.target.value)} placeholder="New Obsession..." className="flex-grow bg-gray-950 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 cyber-ring text-gray-200" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 cyber-ring text-sm">{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><button onClick={handleAddObsession} className="bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-4 rounded-md">Plot</button></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">{categories.map(cat => (<div key={cat} className="bg-black/20 border border-gray-800 rounded-md p-3"><h3 className="cyber-text font-bold mb-2 text-center border-b border-cyan-500/20 pb-1">{cat}</h3><ul className="space-y-1 text-sm">{obsessions.filter(o => o.category === cat).map(obsession => (<li key={obsession.id} className="flex justify-between items-center group bg-gray-900/50 p-1.5 rounded-md"><span className="text-gray-400">{obsession.name}</span><button onClick={() => handleDeleteObsession(obsession.id)} className="text-gray-700 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button></li>))}</ul></div>))}</div></Section>);};
const Glossary = ({ userId, playSound }) => {
    const defaultTerms = [{ term: 'Signal', definition: 'The totality of one\'s transmitted presence...' }, { term: 'Flesh-Architecture', definition: 'The conscious, strategic sculpting of the physical body...' }, { term: 'Sanctum', definition: 'The living space, encoded to be an externalized manifestation...' },];
    const [userTerms, setUserTerms] = useState([]); const [searchTerm, setSearchTerm] = useState(''); const [newTerm, setNewTerm] = useState(''); const [newDef, setNewDef] = useState('');
    const glossaryCollection = collection(db, `artifacts/${appId}/users/${userId}/glossary`);
    useEffect(() => { onSnapshot(query(glossaryCollection), (s) => setUserTerms(s.docs.map(d => ({id: d.id, ...d.data()})))); }, [userId]);
    const handleAddTerm = async (e) => { e.preventDefault(); if(newTerm.trim() === '' || newDef.trim() === '') return; playSound('commit'); await addDoc(glossaryCollection, { term: newTerm, definition: newDef }); setNewTerm(''); setNewDef(''); };
    const allTerms = [...defaultTerms, ...userTerms].sort((a,b) => a.term.localeCompare(b.term));
    const filteredTerms = allTerms.filter(t => t.term.toLowerCase().includes(searchTerm.toLowerCase()));
    return (<Section title="Encrypted Lexicon"><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Codex..." className="w-full bg-gray-950 border border-gray-700 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 cyber-ring" /><div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 mb-6">{filteredTerms.map(t => (<div key={t.term}><h3 className="font-bold cyber-text text-lg">{t.term}</h3><p className="text-gray-400">{t.definition}</p></div>))}</div><form onSubmit={handleAddTerm} className="border-t border-gray-700 pt-4 space-y-2"><h3 className="text-gray-400 font-bold">Add New Term</h3><input type="text" value={newTerm} onChange={e=>setNewTerm(e.target.value)} placeholder="Term..." className="w-full bg-gray-950 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring"/><textarea value={newDef} onChange={e=>setNewDef(e.target.value)} placeholder="Definition..." rows="2" className="w-full bg-gray-950 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring" /><button type="submit" className="w-full bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-4 rounded-md">Encode</button></form></Section>);};

// --- FORGE MODULE ---
const Forge = ({ userId, playSound }) => {
    const [activeTab, setActiveTab] = useState('Ritual Planner');
    return (<div><h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-widest">THE FORGE</h1><p className="text-gray-500 mb-8">Ritual & System Management.</p><div className="flex space-x-4 border-b border-gray-700 mb-6"><TabButton name="Ritual Planner" activeTab={activeTab} onClick={setActiveTab} playSound={playSound}/><TabButton name="Lunar OS" activeTab={activeTab} onClick={setActiveTab} playSound={playSound}/><TabButton name="Hyper-Sculpt" activeTab={activeTab} onClick={setActiveTab} playSound={playSound}/></div>
    {activeTab === 'Ritual Planner' && <RitualPlanner userId={userId} playSound={playSound} />} {activeTab === 'Lunar OS' && <LunarOS userId={userId} playSound={playSound} />} {activeTab === 'Hyper-Sculpt' && <HyperSculpt playSound={playSound} />} </div>);};

const ritualDatabase = {
    daily: [ { name: "Hydration Protocol: Void Activation", time: "06:00" }, { name: "Mirror Invocation: Silhouette & Stillness", time: "06:05" }, { name: "Incantation: Core Code Implantation", time: "06:10" }, { name: "Hyper-Sculpt: Flesh-Architecture Forging", time: "06:30" }, { name: "Armor Selection: Signal Transmission", time: "07:30" }, { name: "Digital Sunset: Signal Purity Protocol", time: "21:00" }, { name: "Grimoire Entry: Data Download & Prophecy Logging", time: "21:30" }, { name: "Sanctum Reset: Environmental Encoding", time: "22:00" }, { name: "Final Affirmation: Void Descent", time: "22:10" } ],
    weekly: [ { name: "Financial Audit: Energetic Current Review" }, { name: "Sanctum Cleanse: Physical & Energetic" }, { name: "Obsession Cartography Review" }, { name: "Shadow Alchemy: Projection Log Analysis" }, { name: "Deep Study Session: Intellectual Armament" }, { name: "Legacy Artifact Construction" }, { name: "Body Maintenance Protocol: Mask & Repair" } ],
    monthly: [ { name: "Full System Audit: Core Self-Interrogation" }, { name: "Boundary Framework Assessment" }, { name: "Digital Footprint Purge & Reconstruction" }, { name: "Temporal Shift Contemplation" }, { name: "Ritual Design & Decommissioning" }, { name: "The Void Descent: A Day of Silence" } ]
};
const RitualPlanner = ({ userId, playSound }) => {
    const [rituals, setRituals] = useState([]); const [newRitual, setNewRitual] = useState(''); const [schedule, setSchedule] = useState('daily'); const [time, setTime] = useState(''); const [committing, setCommitting] = useState(null);
    const ritualCollection = collection(db, `artifacts/${appId}/users/${userId}/rituals`);
    useEffect(() => { const unsubscribe = onSnapshot(query(ritualCollection), (snapshot) => { if (snapshot.empty) { prePopulateRituals(); } else { setRituals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); } }); return unsubscribe; }, [userId]);
    const prePopulateRituals = async () => { for (const schedule_type in ritualDatabase) { for (const ritual of ritualDatabase[schedule_type]) { await addDoc(ritualCollection, { name: ritual.name, time: ritual.time || null, schedule: schedule_type, completed: false, timestamp: serverTimestamp() }); } } };
    const handleAddRitual = async () => { if (newRitual.trim() === '') return; playSound('commit'); await addDoc(ritualCollection, { name: newRitual, time, schedule, completed: false, timestamp: serverTimestamp() }); setNewRitual(''); setTime(''); };
    const handleCommit = async (id, currentStatus) => { playSound('commit'); setCommitting(id); await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/rituals`, id), { completed: !currentStatus }); setTimeout(() => setCommitting(null), 500); };
    const handleDelete = async (id) => { playSound('delete'); await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/rituals`, id)); };
    const renderRitualList = (filter) => { const sortedRituals = rituals.filter(r => r.schedule === filter).sort((a,b) => (a.time || "23:59").localeCompare(b.time || "23:59")); return sortedRituals.map(ritual => (<div key={ritual.id} className="flex items-center justify-between bg-black/30 p-3 rounded-md group"><div><span className={`transition-colors ${ritual.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>{ritual.name}</span>{ritual.time && <span className="ml-2 text-xs text-cyan-400/70">{ritual.time}</span>}</div><div className="flex items-center space-x-2"><button onClick={() => handleCommit(ritual.id, ritual.completed)} className={`px-3 py-1 text-xs rounded-md transition-all duration-300 ${ritual.completed ? 'bg-gray-700 text-gray-400' : 'bg-cyan-600/80 hover:bg-cyan-500/80 text-white'}`}>{committing === ritual.id ? '...' : (ritual.completed ? 'Undo' : 'Commit')}</button><button onClick={() => handleDelete(ritual.id)} className="text-gray-700 group-hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon /></button></div></div>));};
    return (<Section title="Ritual Planner"><div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4"><input type="text" value={newRitual} onChange={e => setNewRitual(e.target.value)} placeholder="New Ritual..." className="md:col-span-2 flex-grow bg-gray-950 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 cyber-ring" /><input type="time" value={time} onChange={e => setTime(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 cyber-ring text-sm" /><select value={schedule} onChange={e => setSchedule(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 cyber-ring text-sm"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><button onClick={handleAddRitual} className="md:col-span-4 w-full bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-4 rounded-md">Add</button></div><div className="grid md:grid-cols-3 gap-6">{['daily', 'weekly', 'monthly'].map(s => (<div key={s}><h3 className="cyber-text font-bold mb-2 capitalize">{s}</h3><div className="space-y-2">{renderRitualList(s)}</div></div>))}</div></Section>);};

const LunarOS = ({ userId, playSound }) => {
    const [log, setLog] = useState([]); const [entry, setEntry] = useState({ energy: 5, creative: 5, social: 5, mood: 'Focused', notes: '' });
    const logCollection = collection(db, `artifacts/${appId}/users/${userId}/lunar_os`);
    useEffect(() => { onSnapshot(query(logCollection, orderBy("date")), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); setLog(data); }); }, [userId]);
    const handleLog = async () => { playSound('commit'); const today = new Date().toISOString().slice(0, 10); const existingLog = log.find(l => l.date === today); const logData = { date: today, ...entry, timestamp: serverTimestamp() }; if (existingLog) await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/lunar_os`, existingLog.id), logData); else await addDoc(logCollection, logData); setEntry({...entry, notes: ''}); };
    const handleChange = (field, value) => { setEntry(prev => ({ ...prev, [field]: value })); };
    return (<Section title="Lunar OS Sync"><div className="grid md:grid-cols-2 gap-8"><div><h3 className="cyber-text font-bold mb-2">Log Today's Cycle</h3><div className="space-y-4">{['Energy', 'Creative Output', 'Social Inclination'].map(label => (<div key={label}><label className="block text-sm text-gray-400">{label} ({entry[label.split(' ')[0].toLowerCase()]})</label><input type="range" min="1" max="10" value={entry[label.split(' ')[0].toLowerCase()]} onChange={e => handleChange(label.split(' ')[0].toLowerCase(), Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" /></div>))}<div><label className="block text-sm text-gray-400">Mood</label><select value={entry.mood} onChange={e => handleChange('mood', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 cyber-ring"><option>Focused</option><option>Creative</option><option>Withdrawn</option><option>Expansive</option><option>Irritable</option><option>Calm</option></select></div><div><label className="block text-sm text-gray-400">Notes / Physical Sensations</label><textarea value={entry.notes} onChange={e => handleChange('notes', e.target.value)} rows="3" className="w-full bg-gray-800 border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 cyber-ring"></textarea></div><button onClick={handleLog} className="w-full bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-4 rounded-md">Log Cycle</button></div></div><div><h3 className="cyber-text font-bold mb-2">Cycle Pattern</h3><div className="h-80 bg-black/30 p-2 rounded-md"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={log.slice(-30)} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="1 1" stroke="#4A5568" strokeOpacity={0.3}/><XAxis dataKey="date" tick={{ fontSize: 10, fill: '#A0AEC0' }} tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} /><YAxis tick={{ fontSize: 12, fill: '#A0AEC0' }} domain={[0, 10]}/><Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #00e5ff' }}/><Legend wrapperStyle={{fontSize: "12px"}}/><Line type="monotone" dataKey="energy" name="Energy" stroke="#00e5ff" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} /><Line type="monotone" dataKey="creative" name="Creative" stroke="#f472b6" strokeWidth={1} strokeDasharray="3 3" dot={false}/><Line type="monotone" dataKey="social" name="Social" stroke="#a78bfa" strokeWidth={1} strokeDasharray="3 3" dot={false}/></ComposedChart></ResponsiveContainer></div></div></div></Section>);};

const hyperSculptRoutines = {
    "Gluteal Ignition (Heavy Lift Focus)": [ { name: "Glute Bridge", reps: "3x12", function: "Primary glute activation. Wakes the neural pathways to the 'throne' before heavier work.", how: "Lie on back, knees bent. Drive through heels, lift hips until body is a straight line from shoulders to knees. Squeeze glutes at the top for 2 seconds. Lower slowly." }, { name: "Bodyweight Squats (Deep)", reps: "3x15", function: "Full-range compound movement for overall leg and glute development. Establishes core stability.", how: "Feet shoulder-width apart. Sit back as if into a chair, keeping chest up. Go as low as possible while maintaining a straight back. Drive up through heels." }, { name: "Single-Leg Glute Bridge", reps: "3x10 per leg", function: "Isolates each glute, correcting imbalances and increasing unilateral strength.", how: "Same as glute bridge, but with one leg extended straight. Keep hips level throughout the movement. Focus on the working glute." }, { name: "Reverse Lunges", reps: "3x12 per leg", function: "Targets glutes and quads while challenging balance and stability.", how: "Step one foot straight back, lowering both knees to 90-degree angles. Push off the back foot to return to standing. Keep torso upright." }, { name: "Plank", reps: "3x 60s hold", function: "Builds isometric core strength, essential for maintaining posture and power transfer.", how: "Hold a push-up position on forearms. Body in a straight line from head to heels. Engage core and glutes." }, ],
    "Posterior Chain Forging (Hamstring & Glute)": [ { name: "Good Mornings (Bodyweight)", reps: "3x15", function: "Teaches the hip-hinge pattern. Stretches and strengthens hamstrings and lower back.", how: "Stand with feet shoulder-width apart, hands behind head. Keeping legs nearly straight, hinge at the hips, lowering torso until parallel to floor. Rise by squeezing glutes." }, { name: "Frog Pumps", reps: "3x20", function: "Targets the gluteus medius and minimus for a rounder shape through external rotation.", how: "Lie on back, soles of feet together, knees out wide. Drive heels together and lift hips. Squeeze at the top." }, { name: "Donkey Kicks", reps: "3x15 per leg", function: "Glute isolation that targets the upper part of the muscle for lift and shape.", how: "On all fours. Keeping knee bent, lift one leg, driving heel towards the ceiling. Squeeze the glute of the working leg." }, { name: "Fire Hydrants", reps: "3x15 per leg", function: "Another gluteus medius activator for hip stability and shape.", how: "On all fours. Keeping knee bent, lift one leg out to the side. Keep core tight." }, { name: "Side Plank", reps: "3x 45s per side", function: "Builds oblique and deep core strength for waist definition and stability.", how: "Lie on your side, supported by one forearm. Hips lifted, body in a straight line. Hold." }, ],
    "Asymmetrical Warfare (Unilateral Sculpt)": [ { name: "Bulgarian Split Squats", reps: "3x12 per leg", function: "The ultimate unilateral leg and glute sculptor. Creates deep muscle engagement.", how: "Place rear foot on a low surface (chair). Front foot forward. Lower until front thigh is parallel to floor. Drive up through front heel." }, { name: "Pistol Squat Negatives", reps: "3x5 per leg", function: "Builds strength and control for the full pistol squat. Intense eccentric focus.", how: "Stand on one leg, extend other forward. Slowly lower yourself as far as you can with control. Use hands to help get back up." }, { name: "Single-Leg RDL", reps: "3x12 per leg", function: "Challenges balance, hamstring flexibility, and glute stability.", how: "Stand on one leg. Hinge at the hip, extending the other leg straight back as you lower your torso. Keep back straight. Return to start." }, { name: "Hollow Body Hold", reps: "3x 45s hold", function: "Foundational gymnastics core exercise for deep abdominal strength.", how: "Lie on back. Lift shoulders and legs off floor, keeping lower back pressed into the ground. Find the lowest point you can hold form." }, { name: "Bird-Dog", reps: "3x15 per side", function: "Improves core stability and coordination by linking opposite limbs.", how: "On all fours. Extend right arm forward and left leg back simultaneously. Keep back flat. Return to center and switch." }, ],
    "Core Matrix (Brutalist Abs & Obliques)": [ { name: "Leg Raises", reps: "3x15", function: "Targets lower abdominals for a sculpted core.", how: "Lie on back, hands under hips for support. Keeping legs straight, slowly lower them towards the floor without touching. Raise back up." }, { name: "Russian Twists", reps: "3x20 per side", function: "Builds rotational strength in the obliques for a defined waist.", how: "Sit on floor, knees bent, feet slightly off ground. Lean back. Twist torso from side to side, touching floor beside you." }, { name: "Heel Taps", reps: "3x20 per side", function: "Targets obliques and lower abdominals with constant tension.", how: "Lie on back, knees bent, feet flat. Lift head and shoulders slightly. Reach down to tap your right heel with your right hand, then left heel with left hand." }, { name: "Dead Bug", reps: "3x10 per side (slow)", function: "Enhances deep core stability and coordination without straining the back.", how: "Lie on back, knees at 90 degrees over hips, arms to ceiling. Slowly lower right arm and left leg towards floor. Return and switch." }, { name: "Flutter Kicks", reps: "3x 45s", function: "Builds endurance in the lower abdominals.", how: "Lie on back, legs straight. Lift heels a few inches off floor. Perform small, rapid up-and-down scissor-like kicks." } ],
    "High-Intensity Metabolic Rite (Full Body Burn)": [ { name: "Burpees (No Push-up)", reps: "3x10", function: "Full-body metabolic conditioning. Builds endurance and power.", how: "From standing, drop into a squat, place hands on floor, kick feet back to a plank, immediately jump feet back to squat, then explode up into a jump." }, { name: "Jumping Lunges", reps: "3x12 per leg", function: "Plyometric exercise for explosive leg power and cardiovascular conditioning.", how: "Start in a lunge position. Jump up, switching legs in mid-air to land in a lunge with the opposite foot forward." }, { name: "High Knees", reps: "3x 45s", function: "Cardio drill to increase heart rate and improve coordination.", how: "Run in place, driving knees up towards your chest as high and fast as possible." }, { name: "Mountain Climbers", reps: "3x 45s", function: "Full-body exercise that targets core, shoulders, and cardiovascular system.", how: "From a plank position, drive one knee towards your chest, then switch, 'running' your legs in place." }, { name: "Plank Jacks", reps: "3x 45s", function: "Combines a plank with a jumping jack motion to challenge core stability.", how: "From a plank position, jump your feet wide apart and then back together. Keep hips stable." } ]
};

const HyperSculpt = ({ playSound }) => {
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    if (selectedRoutine) {
        const routine = hyperSculptRoutines[selectedRoutine];
        const exercise = routine[currentExerciseIndex];

        const handleNext = () => {
            playSound('click');
            if (currentExerciseIndex < routine.length - 1) setCurrentExerciseIndex(currentExerciseIndex + 1);
        };
        const handlePrev = () => {
            playSound('click');
            if (currentExerciseIndex > 0) setCurrentExerciseIndex(currentExerciseIndex - 1);
        };
        const handleFinish = () => {
            playSound('commit');
            setSelectedRoutine(null);
            setCurrentExerciseIndex(0);
        };

        return (
            <Section title={`HYPER-SCULPT: ${selectedRoutine}`}>
                <div className="bg-black/30 p-6 rounded-md border border-gray-800">
                    <div className="text-center mb-4">
                        <p className="text-gray-500 text-sm">Exercise {currentExerciseIndex + 1} / {routine.length}</p>
                        <h3 className="text-2xl cyber-text font-bold my-2">{exercise.name}</h3>
                        <p className="text-xl text-white">{exercise.reps}</p>
                    </div>
                    <div className="my-6">
                        <h4 className="font-bold text-gray-400 uppercase tracking-widest text-sm mb-1">Function:</h4>
                        <p className="text-gray-400">{exercise.function}</p>
                    </div>
                    <div className="my-6">
                        <h4 className="font-bold text-gray-400 uppercase tracking-widest text-sm mb-1">Execution:</h4>
                        <p className="text-gray-400">{exercise.how}</p>
                    </div>
                    <div className="flex justify-between items-center mt-8">
                        <button onClick={handlePrev} disabled={currentExerciseIndex === 0} className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50"><ChevronLeft /></button>
                        {currentExerciseIndex === routine.length - 1 ? (
                            <button onClick={handleFinish} className="bg-green-500/80 hover:bg-green-400/80 text-white font-bold py-2 px-6 rounded-md flex items-center space-x-2">
                                <span>Finish Rite</span><CheckCircle />
                            </button>
                        ) : (
                            <button onClick={handleNext} className="bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-6 rounded-md">Next</button>
                        )}
                        <button onClick={handleNext} disabled={currentExerciseIndex === routine.length - 1} className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50"><ChevronRight /></button>
                    </div>
                </div>
                 <button onClick={() => { setSelectedRoutine(null); playSound('delete'); }} className="text-gray-500 hover:text-red-500 text-sm mt-4 block mx-auto">Abort Rite</button>
            </Section>
        );
    }

    return (
        <Section title="Hyper-Sculpt Rite Selection">
            <p className="text-gray-400 mb-4">Select today's forging protocol.</p>
            <div className="grid md:grid-cols-2 gap-4">
                {Object.keys(hyperSculptRoutines).map(routineName => (
                    <button key={routineName} onClick={() => {setSelectedRoutine(routineName); playSound('commit');}} className="text-left bg-black/30 p-4 rounded-md border border-gray-800 hover:border-cyan-500 transition-colors duration-300">
                        <h3 className="font-bold cyber-text">{routineName}</h3>
                        <p className="text-xs text-gray-500">{hyperSculptRoutines[routineName].map(e => e.name).join(', ')}</p>
                    </button>
                ))}
            </div>
        </Section>
    );
};


// --- ALTAR MODULE ---
const Altar = ({ userId, playSound }) => {
    const [transactions, setTransactions] = useState([]);
    const [form, setForm] = useState({ description: '', amount: '', category: 'Ritual & Aesthetic', type: 'expense', justification: '' });
    
    const transactionCollection = collection(db, `artifacts/${appId}/users/${userId}/finances`);
    const categories = ['Stability', 'Exit Plan/Evolution', 'Ritual & Aesthetic', 'Sacred Hoarding', 'Flow', 'Offering'];
    useEffect(() => { onSnapshot(query(transactionCollection, orderBy("timestamp", "desc")), (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})))); }, [userId]);
    const handleChange = e => setForm({...form, [e.target.name]: e.target.value});
    const handleAddTransaction = async (e) => { e.preventDefault(); if(form.description.trim() === '' || form.amount.trim() === '') return; playSound('commit'); await addDoc(transactionCollection, { ...form, amount: Number(form.amount) * (form.type === 'expense' ? -1 : 1), category: form.type === 'income' ? 'Income' : form.category, timestamp: serverTimestamp() }); setForm({ description: '', amount: '', category: 'Ritual & Aesthetic', type: 'expense', justification: '' }); };
    const balance = transactions.reduce((acc, t) => acc + t.amount, 0);
    const needsJustification = form.type === 'expense' && (form.category === 'Ritual & Aesthetic' || form.category === 'Flow');

    return(
        <div><h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-widest">THE ALTAR</h1><p className="text-gray-500 mb-8">Asset & Environmental Curation.</p>
            <Section title="Financial System: Energetic Current"><div className="text-center mb-6"><p className="text-gray-500 text-sm uppercase tracking-widest">Net Current</p><p className={`text-4xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{balance.toFixed(2)}</p></div>
                <form onSubmit={handleAddTransaction} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 items-start">
                     <div className="col-span-2 md:col-span-4"><label className="block text-sm text-gray-400">Description</label><input name="description" value={form.description} onChange={handleChange} type="text" className="w-full bg-gray-950 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring" /></div>
                     <div><label className="block text-sm text-gray-400">Amount</label><input name="amount" value={form.amount} onChange={handleChange} type="number" step="0.01" className="w-full bg-gray-950 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring" /></div>
                     <div><label className="block text-sm text-gray-400">Type</label><select name="type" value={form.type} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring"><option value="expense">Expense</option><option value="income">Income</option></select></div>
                     <div className={`col-span-2 ${form.type === 'income' ? 'invisible' : ''}`}><label className="block text-sm text-gray-400">Category</label><select name="category" value={form.category} onChange={handleChange} className="w-full bg-gray-800 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring">{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                     <div className={`col-span-full ${needsJustification ? 'block' : 'hidden'}`}><label className="block text-sm text-gray-400">Signal Amplification Justification</label><input type="text" name="justification" value={form.justification} onChange={handleChange} className="w-full bg-gray-950 border border-gray-700 rounded p-2 focus:outline-none focus:ring-1 cyber-ring"/></div>
                     <div className="col-span-full"><button type="submit" className="w-full bg-cyan-600/80 hover:bg-cyan-500/80 text-white font-bold py-2 px-4 rounded-md">Log Current</button></div>
                </form>
                <h3 className="cyber-text font-bold mb-2">Recent Flow:</h3>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {transactions.map(t => (<div key={t.id} className="bg-black/30 p-3 rounded-md text-sm"><div className="grid grid-cols-3 gap-2"><div className="col-span-2"><p className="font-bold text-gray-300">{t.description}</p><p className="text-xs text-gray-500">{t.category}</p></div><p className={`text-right font-bold ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>{t.amount.toFixed(2)}</p></div>{t.justification && <p className="text-gray-500 italic text-xs mt-1 border-t border-gray-800 pt-1">Justification: {t.justification}</p>}</div>))}
                </div>
            </Section>
        </div>
    );
};
