import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { BookOpen, PlusCircle, Search, LogOut, Book, Trash2, X, ArrowLeft, Landmark, Award, ExternalLink } from 'lucide-react';

// Konfigurasi Firebase dari Environment Variables Vercel
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [notification, setNotification] = useState(null);
  const [newBook, setNewBook] = useState({ 
    title: '', author: '', link: '', cover: '', category: 'Cerita Rakyat' 
  });

  // Ambil Data dari Firebase secara Real-time
  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('title'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const showNotif = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = () => {
    const pass = prompt("Masukkan Password Admin:");
    if (pass === 'bjmmajusejahtera') {
      setIsAdmin(true);
      showNotif("Selamat Datang, Admin Riza!");
    } else {
      alert("Password Salah!");
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      let finalLink = newBook.link;
      if (finalLink.includes('drive.google.com')) {
        finalLink = finalLink.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
      }
      await addDoc(collection(db, 'books'), { ...newBook, link: finalLink });
      setShowAddModal(false);
      setNewBook({ title: '', author: '', link: '', cover: '', category: 'Cerita Rakyat' });
      showNotif("✅ Koleksi Berhasil Ditambah!");
    } catch (err) { showNotif("❌ Gagal Menambah"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus buku ini dari perpustakaan?")) {
      await deleteDoc(doc(db, 'books', id));
      showNotif("🗑️ Buku Telah Dihapus");
    }
  };

  const filteredBooks = books.filter(b => 
    (b.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (b.author?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FFFDF0]">
      {/* Notifikasi */}
      {notification && (
        <div className="fixed top-24 right-5 z-[100] bg-green-800 text-yellow-400 px-6 py-3 rounded-2xl shadow-2xl font-black border-2 border-yellow-500 animate-bounce">
          {notification}
        </div>
      )}

      {/* Navbar Banjar */}
      <nav className="bg-[#F59E0B] border-b-8 border-[#166534] p-4 sticky top-0 z-40 shadow-xl">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-[#166534] p-2 rounded-xl text-yellow-400 shadow-lg">
              <Landmark size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#1a2e05] leading-none uppercase">Wadah Baca</h1>
              <span className="text-[10px] font-bold text-[#166534] tracking-[0.3em] uppercase">Urang Banjar</span>
            </div>
          </div>
          {!isAdmin ? (
            <button onClick={handleLogin} className="bg-[#166534] text-white px-6 py-2 rounded-full font-black text-xs hover:bg-black transition shadow-lg">LOGIN</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowAddModal(true)} className="bg-white text-green-800 px-4 py-2 rounded-full font-black text-xs flex items-center gap-1 shadow-lg">
                <PlusCircle size={16} /> TAMBAH
              </button>
              <button onClick={() => setIsAdmin(false)} className="bg-red-700 text-white p-2 rounded-full shadow-lg"><LogOut size={16} /></button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="bg-[#166534] text-yellow-400 py-16 px-4 text-center relative overflow-hidden border-b-4 border-yellow-500">
        <div className="absolute inset-0 opacity-10 flex justify-around items-center pointer-events-none">
          <Award size={150} /><Award size={150} /><Award size={150} />
        </div>
        <h2 className="text-4xl md:text-6xl font-black mb-4 uppercase tracking-tighter">Selamat Datang</h2>
        <p className="text-white font-bold mb-8 italic">"Membaca adalah kunci Banua Sejahtera"</p>
        <div className="max-w-2xl mx-auto relative px-4">
          <Search className="absolute left-10 top-5 text-green-800" size={24} />
          <input 
            type="text" placeholder="Cari Judul Buku atau Penulis..." 
            className="w-full p-5 pl-16 rounded-3xl text-slate-800 outline-none shadow-2xl border-4 border-yellow-500 focus:ring-8 focus:ring-yellow-400/30 font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Grid Koleksi */}
      <main className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-8 border-b-2 border-yellow-200 pb-2">
           <BookOpen className="text-green-700" />
           <h3 className="font-black text-green-800 uppercase tracking-widest">Koleksi Perpustakaan</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-white rounded-[2rem] shadow-xl border-2 border-yellow-100 overflow-hidden flex flex-col hover:border-green-600 transition-all group relative">
              {isAdmin && (
                <button onClick={() => handleDelete(book.id)} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full z-10 shadow-lg hover:scale-110 transition">
                  <Trash2 size={16} />
                </button>
              )}
              <div className="h-60 bg-amber-50 relative overflow-hidden">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-200">
                    <Book size={60} />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-[#166534] text-yellow-400 text-[9px] px-3 py-1 rounded-full font-black uppercase border border-yellow-400 shadow-md">{book.category}</span>
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-sm md:text-base leading-tight uppercase line-clamp-2 mb-1">{book.title}</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-4 italic">Penulis: {book.author}</p>
                </div>
                <button 
                  onClick={() => setSelectedPdf(book)}
                  className="w-full bg-[#F59E0B] text-green-950 py-3 rounded-2xl font-black hover:bg-[#166534] hover:text-white transition-all shadow-[0_4px_0_0_#ca8a04] active:shadow-none active:translate-y-1 text-xs uppercase"
                >
                  Baca Sekarang
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* PDF Reader (Modal) */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#166534] border-b-4 border-yellow-500 shadow-2xl">
            <button onClick={() => setSelectedPdf(null)} className="flex items-center gap-2 bg-yellow-500 text-green-950 px-6 py-2 rounded-full font-black hover:bg-white transition shadow-lg text-sm">
              <ArrowLeft size={20} /> KEMBALI
            </button>
            <h3 className="text-yellow-400 font-black uppercase text-center truncate pr-4">{selectedPdf.title}</h3>
          </div>
          <iframe src={selectedPdf.link} className="flex-1 w-full h-full border-none" title="PDF Reader"></iframe>
        </div>
      )}

      {/* Modal Tambah Buku (Admin Only) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddBook} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border-8 border-yellow-500 space-y-4">
            <h2 className="text-2xl font-black text-green-800 text-center uppercase tracking-tighter">Tambah Koleksi</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Judul Buku" required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-2xl outline-none focus:border-green-600 font-bold" onChange={e => setNewBook({...newBook, title: e.target.value})} />
              <input type="text" placeholder="Penulis" required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-2xl outline-none focus:border-green-600 font-bold" onChange={e => setNewBook({...newBook, author: e.target.value})} />
              <select className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-2xl font-bold" onChange={e => setNewBook({...newBook, category: e.target.value})}>
                <option>Cerita Rakyat</option><option>Sejarah</option><option>Agama</option><option>Sastra</option>
              </select>
              <input type="url" placeholder="Link Google Drive" required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-2xl font-bold text-xs" onChange={e => setNewBook({...newBook, link: e.target.value})} />
              <input type="url" placeholder="Link Gambar Sampul" className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-2xl font-bold text-xs" onChange={e => setNewBook({...newBook, cover: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-green-700 text-white py-4 rounded-2xl font-black hover:bg-black transition uppercase">SIMPAN</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-red-50 text-red-600 rounded-2xl font-bold">BATAL</button>
            </div>
          </form>
        </div>
      )}

      <footer className="mt-20 border-t-8 border-yellow-500 bg-green-950 p-12 text-center text-yellow-400">
        <p className="font-black text-2xl tracking-[0.2em] uppercase mb-2">WADAH BACA</p>
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.3em]">Membangun Banua Lewat Literasi © 2026</p>
      </footer>
    </div>
  );
}

export default App;