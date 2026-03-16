import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { BookOpen, PlusCircle, Search, LogOut, Book, Trash2, X, ArrowLeft, Landmark, ChevronLeft, ChevronRight } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';

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
  const [loading, setLoading] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', link: '', cover: '', category: 'Cerita Rakyat' });

  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalLink = newBook.link;
      if (finalLink.includes('drive.google.com')) {
        finalLink = finalLink.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
      }
      
      await addDoc(collection(db, 'books'), { ...newBook, link: finalLink });
      
      // Notifikasi & Tutup Modal Otomatis
      setNotification("✅ Buku Berhasil Ditambahkan ke Wadah Baca!");
      setShowAddModal(false); 
      setNewBook({ title: '', author: '', link: '', cover: '', category: 'Cerita Rakyat' });
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification("❌ Gagal menambah buku. Cek koneksi.");
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF0] font-sans text-slate-900">
      {/* Notifikasi Pop-up */}
      {notification && (
        <div className="fixed top-5 right-5 z-[100] bg-green-800 text-yellow-400 px-6 py-4 rounded-2xl shadow-2xl font-black border-2 border-yellow-500 animate-in fade-in slide-in-from-top-4 duration-300">
          {notification}
        </div>
      )}

      {/* Navigasi */}
      <nav className="bg-[#F59E0B] border-b-8 border-[#166534] p-4 sticky top-0 z-40 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-[#166534] p-2 rounded-lg text-yellow-400 shadow-lg"><Landmark size={28} /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase leading-none">Wadah Baca</h1>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-80">Urang Banjar</span>
          </div>
        </div>
        {!isAdmin ? (
          <button onClick={() => { if(prompt("Password Admin:") === 'bjmmajusejahtera') setIsAdmin(true); }} className="bg-[#166534] text-white px-6 py-2 rounded-full font-black text-xs hover:bg-black transition shadow-lg uppercase">Login Admin</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowAddModal(true)} className="bg-white text-green-800 px-4 py-2 rounded-full font-black text-xs flex items-center gap-1 shadow-lg hover:scale-105 transition uppercase">
              <PlusCircle size={16} /> Tambah Buku
            </button>
            <button onClick={() => setIsAdmin(false)} className="bg-red-700 text-white p-2 rounded-full shadow-lg"><LogOut size={16} /></button>
          </div>
        )}
      </nav>

      {/* Search Section */}
      <div className="bg-[#166534] py-12 px-4 text-center border-b-4 border-yellow-500">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-6 top-4 text-green-800" size={24} />
          <input 
            type="text" placeholder="Cari Koleksi Buku..." 
            className="w-full p-4 pl-16 rounded-2xl text-slate-800 outline-none shadow-2xl border-4 border-yellow-500 focus:ring-4 focus:ring-yellow-300 font-bold"
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
                <button onClick={(e) => { e.stopPropagation(); if(confirm('Hapus buku ini?')) deleteDoc(doc(db, 'books', book.id)); }} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full z-10 shadow-lg hover:scale-110">
                  <Trash2 size={16} />
                </button>
              )}
              <div className="h-64 bg-amber-50 relative overflow-hidden">
                {book.cover ? (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" onError={(e) => e.target.src='https://placehold.co/400x600?text=Sampul+Tidak+Ada'} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-200"><Book size={60} /></div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="bg-[#166534] text-yellow-400 text-[9px] px-2 py-1 rounded-full font-black border border-yellow-400 shadow-md uppercase">{book.category}</span>
                </div>
              </div>
              <div className="p-4 flex-grow">
                <h3 className="font-black text-slate-800 text-sm uppercase line-clamp-2 leading-tight group-hover:text-green-700">{book.title}</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase mt-1 italic">{book.author}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Interactive Page Flip Reader */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-2 animate-in zoom-in duration-300">
          <div className="w-full max-w-6xl flex justify-between items-center mb-4 text-yellow-400 bg-[#166534] p-4 rounded-2xl border-b-4 border-yellow-500 shadow-2xl">
            <button onClick={() => setSelectedPdf(null)} className="flex items-center gap-2 bg-yellow-500 text-green-950 px-6 py-2 rounded-full font-black hover:bg-white transition shadow-lg text-xs uppercase">
              <ArrowLeft size={18} /> Kembali
            </button>
            <h3 className="font-black uppercase truncate text-sm md:text-xl pr-4">{selectedPdf.title}</h3>
          </div>
          
          <div className="relative w-full max-w-5xl h-[75vh] md:h-[85vh] bg-white rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Karena PDF Google Drive bersifat iframe, efek membalik halaman asli (Page Flip) 
               hanya bisa bekerja maksimal jika PDF dikonversi ke gambar. 
               Namun, kita buat bingkai ini agar terasa seperti membuka lembaran buku besar.
            */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[4px] bg-black/20 z-10 shadow-xl hidden md:block"></div>
            <iframe src={selectedPdf.link} className="w-full h-full border-none" title="Reader"></iframe>
          </div>
        </div>
      )}

      {/* Modal Tambah Buku */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleAddBook} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border-8 border-yellow-500 space-y-4 relative">
            <button type="button" onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-red-600 hover:rotate-90 transition duration-300"><X size={32}/></button>
            <h2 className="text-2xl font-black text-green-800 text-center uppercase">Input Buku Baru</h2>
            <div className="space-y-3">
              <div className="group">
                <label className="text-[10px] font-black text-green-700 uppercase ml-2">Judul Buku</label>
                <input type="text" placeholder="Masukkan judul..." required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold focus:border-green-600 outline-none" onChange={e => setNewBook({...newBook, title: e.target.value})} />
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-green-700 uppercase ml-2">Penulis / Pengarang</label>
                <input type="text" placeholder="Nama penulis..." required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold focus:border-green-600 outline-none" onChange={e => setNewBook({...newBook, author: e.target.value})} />
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-green-700 uppercase ml-2">Kategori Koleksi</label>
                <select className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold focus:border-green-600 outline-none" onChange={e => setNewBook({...newBook, category: e.target.value})}>
                  <option>Cerita Rakyat</option><option>Sejarah</option><option>Agama</option><option>Sastra</option>
                </select>
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-green-700 uppercase ml-2">Link PDF (Google Drive)</label>
                <input type="url" placeholder="Paste link drive di sini..." required className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold text-xs outline-none focus:border-green-600" onChange={e => setNewBook({...newBook, link: e.target.value})} />
              </div>
              <div className="group">
                <label className="text-[10px] font-black text-green-700 uppercase ml-2">Link Gambar Sampul</label>
                <input type="url" placeholder="https://.../gambar.jpg" className="w-full p-3 bg-amber-50 border-2 border-yellow-100 rounded-xl font-bold text-xs outline-none focus:border-green-600" onChange={e => setNewBook({...newBook, cover: e.target.value})} />
                <p className="text-[9px] text-slate-500 mt-1">*Pastikan link berakhiran .jpg atau .png agar muncul</p>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full ${loading ? 'bg-slate-400' : 'bg-green-700'} text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black transition uppercase mt-4`}
            >
              {loading ? 'Sabar, Sedang Menyimpan...' : 'Simpan Koleksi'}
            </button>
          </form>
        </div>
      )}

      <footer className="mt-20 border-t-8 border-yellow-500 bg-green-950 p-12 text-center text-yellow-400">
        <p className="font-black text-2xl tracking-widest uppercase mb-2">Wadah Baca Urang Banjar</p>
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.3em]">Melestarikan Literasi Banua © 2026</p>
      </footer>
    </div>
  );
}

export default App;