import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { BookOpen, PlusCircle, Search, LogOut, Book, Trash2, X, ArrowLeft, Landmark, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

// Konfigurasi Firebase
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
  const [newBook, setNewBook] = useState({ title: '', author: '', link: '', cover: '', category: 'Cerita Rakyat' });

  // REVISI: Pengetatan Real-time Fetching
  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('title', 'asc'));
    
    // onSnapshot adalah fitur real-time. Jika data di Firebase berubah, 
    // semua browser yang sedang membuka web akan otomatis terupdate.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBooks(data);
      console.log("Data berhasil diupdate: ", data.length, " buku");
    }, (error) => {
      console.error("Gagal mengambil data: ", error);
    });

    return () => unsubscribe();
  }, []);

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
      setNotification("✅ Berhasil Menambah Koleksi!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) { alert("Gagal Simpan"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus buku ini?")) {
      await deleteDoc(doc(db, 'books', id));
      setNotification("🗑️ Buku telah dihapus");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] font-sans text-slate-900">
      {/* Notifikasi Pop-up */}
      {notification && (
        <div className="fixed top-24 right-5 z-[100] bg-green-800 text-yellow-400 px-6 py-3 rounded-xl shadow-2xl font-black border-2 border-yellow-500 animate-bounce">
          {notification}
        </div>
      )}

      {/* Navigasi Bar */}
      <nav className="bg-[#F59E0B] border-b-8 border-[#166534] p-4 sticky top-0 z-40 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-[#166534] p-2 rounded-lg text-yellow-400 shadow-lg">
            <Landmark size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter leading-none uppercase">Wadah Baca</h1>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">Urang Banjar</span>
          </div>
        </div>
        {!isAdmin ? (
          <button onClick={() => { if(prompt("Password Admin:") === 'bjmmajusejahtera') setIsAdmin(true); }} className="bg-[#166534] text-white px-6 py-2 rounded-full font-black text-xs hover:bg-black transition shadow-lg">ADMIN</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-white text-green-800 px-4 py-2 rounded-full font-black text-xs flex items-center gap-1 shadow-lg hover:scale-105 transition">
              <PlusCircle size={16} /> TAMBAH BUKU
            </button>
            <button onClick={() => setIsAdmin(false)} className="bg-red-700 text-white p-2 rounded-full shadow-lg"><LogOut size={16} /></button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="bg-[#166534] text-yellow-400 py-12 px-4 text-center border-b-4 border-yellow-500 relative overflow-hidden">
        <h2 className="text-3xl md:text-5xl font-black mb-4 uppercase drop-shadow-lg">Selamat Datang</h2>
        <p className="text-white max-w-xl mx-auto font-bold mb-8 italic">"Membangun Banua Lewat Literasi"</p>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-6 top-4 text-green-800" size={24} />
          <input 
            type="text" placeholder="Cari judul atau penulis..." 
            className="w-full p-4 pl-16 rounded-2xl text-slate-800 outline-none shadow-2xl border-4 border-yellow-500 focus:ring-4 focus:ring-yellow-300 transition-all font-bold"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Koleksi */}
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(book => (
            <div key={book.id} className="bg-white rounded-[2rem] shadow-xl border-2 border-yellow-100 overflow-hidden flex flex-col hover:border-green-600 transition-all group relative cursor-pointer" onClick={() => setSelectedPdf(book)}>
              {isAdmin && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(book.id); }} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full z-10 shadow-lg hover:scale-110">
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
                  <span className="bg-[#166534] text-yellow-400 text-[9px] px-2 py-1 rounded-full font-black border border-yellow-400 shadow-md uppercase">{book.category}</span>
                </div>
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase line-clamp-2 leading-tight group-hover:text-green-700">{book.title}</h3>
                  <p className="text-slate-500 text-[9px] font-bold uppercase mt-1 italic">{book.author}</p>
                </div>
                <button className="w-full mt-4 bg-yellow-500 text-green-950 py-2 rounded-xl font-black text-[10px] uppercase shadow-[0_3px_0_0_#ca8a04] group-hover:bg-green-700 group-hover:text-white transition-all">
                  BACA BUKU
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Reader Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col animate-in zoom-in duration-300">
          <div className="p-4 flex justify-between items-center text-yellow-400 bg-[#166534] border-b-4 border-yellow-500 shadow-2xl">
            <button onClick={() => setSelectedPdf(null)} className="flex items-center gap-2 bg-yellow-500 text-green-950 px-5 py-2 rounded-full font-black hover:bg-white transition shadow-lg text-xs">
              <ArrowLeft size={18} /> KEMBALI
            </button>
            <h3 className="font-black uppercase truncate text-xs md:text-base pr-4">{selectedPdf.title}</h3>
          </div>
          <div className="flex-1 bg-slate-900 relative">
            <iframe src={selectedPdf.link} className="w-full h-full border-none" title="PDF Reader"></iframe>
          </div>
        </div>
      )}

      {/* Modal Tambah Buku */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddBook} className="bg-white p-6 rounded-[2.5rem] w-full max-w-md shadow-2xl border-8 border-yellow-500 space-y-4">
            <h2 className="text-xl font-black text-green-800 text-center uppercase">Tambah Koleksi</h2>
            <div className="space-y-2">
              <input type="text" placeholder="Judul Buku" required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold" onChange={e => setNewBook({...newBook, title: e.target.value})} />
              <input type="text" placeholder="Penulis" required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold" onChange={e => setNewBook({...newBook, author: e.target.value})} />
              <select className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold" onChange={e => setNewBook({...newBook, category: e.target.value})}>
                <option>Cerita Rakyat</option><option>Sejarah</option><option>Agama</option><option>Sastra</option>
              </select>
              <input type="url" placeholder="Link Google Drive" required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold text-xs" onChange={e => setNewBook({...newBook, link: e.target.value})} />
              <input type="url" placeholder="Link Gambar Sampul" className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold text-xs" onChange={e => setNewBook({...newBook, cover: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-green-700 text-white py-4 rounded-2xl font-black hover:bg-black transition uppercase">SIMPAN</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-red-50 text-red-600 rounded-2xl font-bold text-sm">BATAL</button>
            </div>
          </form>
        </div>
      )}

      <footer className="mt-20 border-t-8 border-yellow-500 bg-green-950 p-12 text-center text-yellow-400">
        <p className="font-black text-2xl tracking-widest uppercase mb-2">WADAH BACA</p>
        <p className="text-[10px] font-bold opacity-60 uppercase">Urang Banjar © 2026</p>
      </footer>
    </div>
  );
}

export default App;