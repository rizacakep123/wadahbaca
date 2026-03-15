import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc, arrayUnion, query, orderBy } from 'firebase/firestore';
import { BookOpen, Plus, Trash2, Eye, Book as BookIcon, X, Maximize2, ShieldCheck, User, Search, Map, Star, MessageSquare, Send, Lock } from 'lucide-react';

// Konfigurasi Firebase
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'perpustakaan-banjar-002';

export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [books, setBooks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePdf, setActivePdf] = useState(null);
  const [newBook, setNewBook] = useState({ title: '', url: '', author: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State untuk komentar & rating baru
  const [newComment, setNewComment] = useState('');
  const [tempRating, setTempRating] = useState(5);

  // Auth Effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error(err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Effect
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'books');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manual berdasarkan waktu dibuat terbaru
      setBooks(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    }, (err) => setLoading(false));
    return () => unsubscribe();
  }, [user]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (loginCreds.username === 'rizacakep' && loginCreds.password === 'bjmmajusejahtera') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginCreds({ username: '', password: '' });
    } else {
      alert('Username atau Password salah, sanak!');
    }
  };

  const getThumbnailUrl = (url) => {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    if (match && url.includes('drive.google.com')) {
      return `https://drive.google.com/thumbnail?id=${match[0]}&sz=w600`;
    }
    return null;
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!isAdmin || !newBook.title || !newBook.url) return;
    
    let finalUrl = newBook.url;
    if (finalUrl.includes('drive.google.com')) {
      finalUrl = finalUrl.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'books'), {
        title: newBook.title,
        url: finalUrl,
        author: newBook.author || 'Anonim',
        createdAt: new Date().toISOString(),
        thumbnail: getThumbnailUrl(newBook.url),
        ratings: [],
        comments: []
      });
      setNewBook({ title: '', url: '', author: '' });
      setIsModalOpen(false);
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activePdf) return;

    try {
      const bookRef = doc(db, 'artifacts', appId, 'public', 'data', 'books', activePdf.id);
      const commentObj = {
        text: newComment,
        rating: tempRating,
        userName: `Pembaca-${user.uid.substring(0, 4)}`,
        date: new Date().toISOString()
      };
      
      await updateDoc(bookRef, {
        comments: arrayUnion(commentObj),
        ratings: arrayUnion(tempRating)
      });

      // Update local state for the viewer
      setActivePdf({
        ...activePdf,
        comments: [...(activePdf.comments || []), commentObj],
        ratings: [...(activePdf.ratings || []), tempRating]
      });
      
      setNewComment('');
      setTempRating(5);
    } catch (err) { console.error(err); }
  };

  const deleteBook = async (id) => {
    if (!isAdmin) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'books', id)); } 
    catch (err) { console.error(err); }
  };

  const getAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFFDF5] font-sans text-slate-800 selection:bg-yellow-200">
      {/* Sasirangan Top Bar */}
      <div className="h-4 bg-repeat-x w-full sticky top-0 z-[100] shadow-sm" 
           style={{ backgroundImage: 'linear-gradient(90deg, #064E3B 0%, #064E3B 25%, #F59E0B 25%, #F59E0B 50%, #B91C1C 50%, #B91C1C 75%, #047857 75%, #047857 100%)', backgroundSize: '80px 100%' }}>
      </div>

      {/* Header */}
      <header className="relative bg-white border-b-4 border-yellow-400 pt-8 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
          <svg width="300" height="300" viewBox="0 0 100 100" fill="currentColor" className="text-emerald-900">
             <path d="M50 0 L100 50 L50 100 L0 50 Z" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10 text-center">
          <div className="bg-yellow-100 text-yellow-700 px-4 py-1 rounded-full text-xs font-black mb-4 tracking-widest uppercase border border-yellow-200">
            Pustaka Digital Banua
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-emerald-950 mb-2 leading-none">
            WADAH <span className="text-yellow-500 italic">BACA</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm md:text-base mb-8 italic">"Himung mambaca cerita datu nini kita."</p>

          <div className="w-full max-w-2xl flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Cari judul cerita Banjar..." 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-yellow-400 outline-none transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {!isAdmin ? (
              <button onClick={() => setShowLoginModal(true)} className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg">
                <Lock size={18} /> Login Admin
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg">
                  <Plus size={18} /> Tambah
                </button>
                <button onClick={() => setIsAdmin(false)} className="px-6 py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg">Keluar</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Grid Buku */}
      <main className="max-w-7xl mx-auto p-6 -mt-8 relative z-20">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-emerald-800 font-black">MEMUAT CERITA...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div key={book.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col group relative">
                <div className="h-56 relative bg-emerald-50 overflow-hidden">
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-emerald-200"><BookIcon size={60} /></div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1">
                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-emerald-900 flex items-center gap-1 shadow-sm">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" /> {getAverageRating(book.ratings)}
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-xs font-bold text-emerald-600 mb-4 tracking-wide uppercase">Oleh: {book.author}</p>
                  
                  <div className="mt-auto flex gap-2">
                    <button onClick={() => setActivePdf(book)} className="flex-grow py-3 bg-yellow-400 hover:bg-yellow-500 text-emerald-950 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2">
                      <Eye size={14} /> BACA CERITA
                    </button>
                    {isAdmin && (
                      <button onClick={() => deleteBook(book.id)} className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* PDF Viewer + Comments Panel */}
      {activePdf && (
        <div className="fixed inset-0 bg-black/95 z-[150] flex flex-col md:flex-row animate-in fade-in duration-300">
          {/* Main Viewer */}
          <div className="flex-grow flex flex-col h-2/3 md:h-full relative border-r border-slate-800">
            <div className="bg-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center"><BookOpen size={20} className="text-emerald-900"/></div>
                <h2 className="font-black text-emerald-900 truncate max-w-[200px] md:max-w-sm">{activePdf.title}</h2>
              </div>
              <div className="flex gap-2">
                <a href={activePdf.url} target="_blank" className="p-2 bg-slate-100 rounded-lg"><Maximize2 size={20}/></a>
                <button onClick={() => setActivePdf(null)} className="p-2 bg-red-600 text-white rounded-lg md:hidden"><X size={20}/></button>
              </div>
            </div>
            <iframe src={activePdf.url} className="w-full h-full border-none bg-slate-100" />
          </div>

          {/* Comments Panel */}
          <div className="w-full md:w-96 bg-[#F8FAFC] flex flex-col h-1/3 md:h-full">
            <div className="p-4 border-b bg-white flex justify-between items-center">
              <h3 className="font-black text-emerald-900 flex items-center gap-2 uppercase text-sm tracking-widest">
                <MessageSquare size={18} /> Kesan Pembaca
              </h3>
              <button onClick={() => setActivePdf(null)} className="hidden md:block text-slate-400 hover:text-red-600 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {(!activePdf.comments || activePdf.comments.length === 0) ? (
                <p className="text-center text-slate-400 text-xs py-10 font-bold italic">Balum ada komentar. Jadi nang pertama mambari kesan!</p>
              ) : (
                activePdf.comments.map((c, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-emerald-800 text-xs uppercase">{c.userName}</span>
                      <div className="flex text-yellow-400"><Star size={10} className="fill-current"/> <span className="text-[10px] ml-1 text-slate-500 font-bold">{c.rating}</span></div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{c.text}</p>
                    <p className="text-[9px] text-slate-300 mt-2 font-bold uppercase">{new Date(c.date).toLocaleDateString('id-ID')}</p>
                  </div>
                ))
              )}
            </div>

            {/* Form Input Komentar */}
            <form onSubmit={handleAddComment} className="p-4 bg-white border-t space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bari Rating:</span>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(num => (
                    <button key={num} type="button" onClick={() => setTempRating(num)}>
                      <Star size={18} className={`${tempRating >= num ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Tulis kesan pian..."
                  className="w-full bg-slate-50 rounded-xl p-3 pr-12 text-sm border border-slate-100 focus:outline-none focus:border-yellow-400 resize-none h-20"
                />
                <button type="submit" className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 transition-all">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-emerald-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-8 text-center border-b border-slate-100">
                <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Lock className="text-emerald-900" size={30}/></div>
                <h2 className="text-xl font-black text-emerald-900 tracking-tight">AKSES ADMIN</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Khusus Pengelola Pustaka</p>
             </div>
             <form onSubmit={handleAdminLogin} className="p-8 space-y-4">
                <input 
                  type="text" 
                  placeholder="Username" 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-yellow-400 font-bold"
                  value={loginCreds.username}
                  onChange={(e) => setLoginCreds({...loginCreds, username: e.target.value})}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-yellow-400 font-bold"
                  value={loginCreds.password}
                  onChange={(e) => setLoginCreds({...loginCreds, password: e.target.value})}
                />
                <button type="submit" className="w-full py-4 bg-emerald-700 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">MASUK</button>
                <button type="button" onClick={() => setShowLoginModal(false)} className="w-full text-slate-400 font-bold text-xs uppercase tracking-widest">Batal</button>
             </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BUKU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border-t-[10px] border-yellow-400">
             <div className="p-6 flex justify-between items-center border-b">
                <h2 className="font-black text-emerald-900 uppercase tracking-widest text-sm">Upload Buku Hanyar</h2>
                <button onClick={() => setIsModalOpen(false)}><X/></button>
             </div>
             <form onSubmit={handleAddBook} className="p-6 space-y-4">
                <input required placeholder="Judul Buku" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-emerald-600 font-bold"
                  value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                <input placeholder="Penulis" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-emerald-600 font-bold"
                  value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                <input required type="url" placeholder="Link Google Drive PDF" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 outline-none focus:border-emerald-600 font-bold text-xs"
                  value={newBook.url} onChange={e => setNewBook({...newBook, url: e.target.value})} />
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg">SIMPAN KE PUSTAKA</button>
             </form>
          </div>
        </div>
      )}

      <footer className="mt-20 py-16 px-6 bg-emerald-950 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FACC15 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(12)].map((_, i) => <div key={i} className={`w-3 h-3 ${i % 2 === 0 ? 'bg-yellow-400' : 'bg-red-600'} rotate-45`}></div>)}
          </div>
          <h2 className="text-white font-black text-2xl tracking-tighter mb-2 italic underline decoration-yellow-400">WADAH BACA BANJAR</h2>
          <p className="text-emerald-300 font-bold text-xs uppercase tracking-widest mb-8">Pustaka Digital Cerita Rakyat & Kisah Banua</p>
          <div className="flex justify-center gap-4 text-white/20">
             <Map size={30} /> <BookOpen size={30} /> <Star size={30} />
          </div>
        </div>
      </footer>
    </div>
  );
}