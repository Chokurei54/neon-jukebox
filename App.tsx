
import React, { useState, useEffect } from 'react';
import { VideoTrack } from './types';
import TrackItem from './components/TrackItem';
import VideoPlayer from './components/VideoPlayer';
import { getAIGeneratedTop10 } from './services/geminiService';

const App: React.FC = () => {
  const emptyTracks = (): VideoTrack[] => Array.from({ length: 10 }, (_, i) => ({
    id: crypto.randomUUID(),
    rank: i + 1,
    title: '',
    artist: '',
    youtubeUrl: '',
    description: ''
  }));

  const [tracks, setTracks] = useState<VideoTrack[]>(emptyTracks);
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'' | 'saving' | 'saved' | 'error'>('');

  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<VideoTrack | null>(null);
  const [aiTheme, setAiTheme] = useState('Hits Italiane 2024');
  const [isGenerating, setIsGenerating] = useState(false);

  const getPw = () => localStorage.getItem('jukebox_admin_pw') || '';

  // Carica la classifica pubblica (la vedono tutti) e controlla se sei già admin
  useEffect(() => {
    (async () => {
      let list: VideoTrack[] = emptyTracks();
      try {
        const res = await fetch('/api/tracks');
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          list = Array.from({ length: 10 }, (_, i) => data.tracks[i] || { ...emptyTracks()[i] });
        }
      } catch (e) {
        console.error(e);
      }
      setTracks(list);
      setCurrentTrackId(list[0].id);
      setLoaded(true);

      if (getPw()) {
        try {
          const r = await fetch('/api/tracks', { method: 'POST', headers: { 'x-admin-password': getPw() } });
          if (r.ok) setIsAdmin(true);
          else localStorage.removeItem('jukebox_admin_pw');
        } catch (e) {
          console.error(e);
        }
      }
    })();
  }, []);

  // Salvataggio automatico (solo admin, solo dopo una modifica)
  useEffect(() => {
    if (!isAdmin || !loaded || !dirty) return;
    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/tracks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-admin-password': getPw() },
          body: JSON.stringify({ tracks })
        });
        if (!res.ok) throw new Error('save failed');
        setSaveStatus('saved');
        setDirty(false);
      } catch (e) {
        console.error(e);
        setSaveStatus('error');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [tracks, dirty, isAdmin, loaded]);

  const changeTracks = (updater: (prev: VideoTrack[]) => VideoTrack[]) => {
    setTracks(updater);
    setDirty(true);
  };

  const handleLogin = async () => {
    const pw = window.prompt('Password admin:');
    if (!pw) return;
    try {
      const r = await fetch('/api/tracks', { method: 'POST', headers: { 'x-admin-password': pw } });
      if (r.ok) {
        localStorage.setItem('jukebox_admin_pw', pw);
        setIsAdmin(true);
      } else {
        alert('Password errata.');
      }
    } catch (e) {
      alert('Errore di connessione.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jukebox_admin_pw');
    setIsAdmin(false);
    setSaveStatus('');
  };

  const currentTrack = tracks.find(t => t.id === currentTrackId);

  const handleUpdateTrack = (updated: VideoTrack) => {
    changeTracks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTrack(null);
  };

  const handleUrlChange = (newUrl: string) => {
    if (!currentTrackId) return;
    const cleanedUrl = newUrl.trim();
    changeTracks(prev => prev.map(t => 
      t.id === currentTrackId ? { ...t, youtubeUrl: cleanedUrl } : t
    ));
  };

  const handleMagicFill = async () => {
    setIsGenerating(true);
    try {
      const suggestions = await getAIGeneratedTop10(aiTheme);
      const newTracks = [...tracks];
      suggestions.slice(0, 10).forEach((s, i) => {
        newTracks[i] = {
          ...newTracks[i],
          title: s.title || newTracks[i].title || `Canzone ${i + 1}`,
          artist: s.artist || newTracks[i].artist || 'Artista Ignoto',
          description: s.description || '',
          youtubeUrl: (s.youtubeUrl || '').trim()
        };
      });
      changeTracks(() => newTracks);
    } catch (err) {
      console.error(err);
      alert("Errore durante la generazione AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-pink-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center font-retro text-xl font-black text-white shadow-lg shadow-pink-600/20">
              J
            </div>
            <h1 className="text-xl font-bold tracking-tight">Neon <span className="text-pink-500">Jukebox</span></h1>
          </div>
          
          {isAdmin && (
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={aiTheme}
              onChange={(e) => setAiTheme(e.target.value)}
              placeholder="Tema AI (es: Rock 90s)"
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 w-48 md:w-64"
            />
            <button 
              onClick={handleMagicFill}
              disabled={isGenerating}
              className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all shadow-lg shadow-pink-600/20 whitespace-nowrap"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              )}
              AI Classifica
            </button>
          </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8">
        
        {/* Left Side: Video Player & Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="sticky top-24 space-y-4">
            <VideoPlayer url={currentTrack?.youtubeUrl || null} title={currentTrack?.title || "Jukebox"} />
            
            {isAdmin && (
            <>
            {/* QUICK LINK INPUT */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
               <label className="block text-xs font-retro tracking-widest text-pink-500 uppercase mb-2">
                 Inserisci Link YouTube per Posizione #{currentTrack?.rank}
               </label>
               <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input 
                      type="text"
                      value={currentTrack?.youtubeUrl || ''}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      placeholder="Incolla qui il link di YouTube..."
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    />
                  </div>
               </div>
            </div>

            </>
            )}

            <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
              {currentTrack && (currentTrack.title || currentTrack.artist) ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                     <span className="bg-pink-600/20 text-pink-400 px-3 py-1 rounded-full text-xs font-retro tracking-widest uppercase">
                        Ranking #{currentTrack.rank}
                     </span>
                  </div>
                  <h2 className="text-3xl font-bold mb-1">{currentTrack.title || "Senza Titolo"}</h2>
                  <p className="text-xl text-slate-400 mb-4">{currentTrack.artist || "Artista Sconosciuto"}</p>
                  <div className="h-px bg-slate-800 w-full mb-4" />
                  <p className="text-slate-300 leading-relaxed italic">
                    {currentTrack.description || (isAdmin ? "Puoi modificare titolo e descrizione cliccando l'icona matita sulla destra." : "")}
                  </p>
                </>
              ) : (
                <div className="text-center py-12">
                   <h2 className="text-2xl font-bold text-slate-600">{isAdmin ? "Inizia la tua Top 10" : "Top 10 in arrivo"}</h2>
                   <p className="text-slate-500">{isAdmin ? "Seleziona una posizione e incolla un link sopra, oppure usa l'AI in alto." : "La classifica non è ancora stata pubblicata."}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Top 10 List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="font-retro text-lg tracking-widest text-slate-400 uppercase">La Classifica</h2>
            <span className="text-xs text-slate-500">10 Posizioni</span>
          </div>
          <div className="space-y-3">
            {tracks.map(track => (
              <TrackItem 
                key={track.id} 
                track={track} 
                isActive={currentTrackId === track.id}
                onSelect={(t) => setCurrentTrackId(t.id)}
                onEdit={isAdmin ? (t) => setEditingTrack(t) : undefined}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded-2xl shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 font-retro tracking-tight">
              <span className="text-pink-500">EDIT</span> POSITION #{editingTrack.rank}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Titolo Brano</label>
                <input 
                  type="text" 
                  value={editingTrack.title}
                  onChange={e => setEditingTrack({...editingTrack, title: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
                  placeholder="Inserisci titolo..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Artista</label>
                <input 
                  type="text" 
                  value={editingTrack.artist}
                  onChange={e => setEditingTrack({...editingTrack, artist: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
                  placeholder="Inserisci artista..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1 ml-1">Curiosità</label>
                <textarea 
                  value={editingTrack.description}
                  onChange={e => setEditingTrack({...editingTrack, description: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all h-24 resize-none text-sm"
                  placeholder="Qualcosa di interessante su questo brano..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setEditingTrack(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-xl font-semibold transition-colors text-sm"
              >
                Chiudi
              </button>
              <button 
                onClick={() => handleUpdateTrack(editingTrack)}
                className="flex-1 bg-pink-600 hover:bg-pink-500 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-pink-600/20 text-sm"
              >
                Salva Modifiche
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-4 text-center text-slate-500 text-sm">
        <p>&copy; 2024 Neon Jukebox - Top 10 Video Ranking</p>
        <div className="mt-3 text-xs text-slate-600 flex items-center justify-center gap-3">
          {isAdmin ? (
            <>
              <span>
                {saveStatus === 'saving' && 'Salvataggio...'}
                {saveStatus === 'saved' && 'Salvato per tutti ✓'}
                {saveStatus === 'error' && 'Errore nel salvataggio'}
                {saveStatus === '' && 'Modalità admin'}
              </span>
              <button onClick={handleLogout} className="underline hover:text-slate-400">Esci</button>
            </>
          ) : (
            <button onClick={handleLogin} className="underline hover:text-slate-400">Area admin</button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
