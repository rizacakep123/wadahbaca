import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { BookOpen, PlusCircle, Search, LogIn, LogOut, Book } from 'lucide-react';

// Konfigurasi Firebase diambil dari Environment Variables Vercel
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', link: '', category: 'Cerita Rakyat' });

  // Ambil data buku dari Firebase
  useEffect(() => {
    const q = query(collection(db, 'books'), orderBy('title'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBooks(booksData);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = () => {
    const user = prompt("Username Admin:");
    const pass = prompt("Password:");
    if (user === 'rizacakep' && pass === 'bjmmajusejahtera') {
      setIsAdmin(true);
      alert("Selamat datang Admin Riza!");
    } else {
      alert("Akses ditolak!");
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'books'), newBook);
      setNewBook({ title: '', author: '', link: '', category: 'Cerita Rakyat' });
      setShowAddModal(false);
      alert("Buku berhasil ditambah!");
    } catch (err) {
      alert("Gagal menambah buku");
    }
  };

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <nav className="bg-emerald-700 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={28} />
            <h1 className="text-2xl font-bold tracking-tight">WADAH BACA</h1>
          </div>
          <div className="flex gap-4">
            {!isAdmin ? (
              <button onClick={handleLogin} className="flex items-center gap-1 hover:text-emerald-200 transition">
                <LogIn size={20} /> <span className="hidden md:inline">Admin</span>
              </button>
            ) : (
              <div className="flex gap-4 items-center">
                <button onClick={() => setShowAddModal(true)} className="bg-white text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-emerald-50">
                  <PlusCircle size={20} /> Tambah Buku
                </button>
                <button onClick={() => setIsAdmin(false)} className="hover:text-red-300"><LogOut size={20} /></button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-emerald-600 text-white py-12 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Perpustakaan Digital Banjar</h2>
        <p className="text-emerald-100 max-w-2xl mx-auto">Membaca buku cerita dan sejarah Banjar lebih mudah, kapan saja dan di mana saja.</p>
        
        <div className="mt-8 max-w-md mx-auto relative">
          <Search className="absolute left-3 top-3 text-emerald-600" size={20} />
          <input 
            type="text" 
            placeholder="Cari judul buku atau penulis..." 
            className="w-full p-3 pl-10 rounded-full text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-300 shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition border border-slate-100 group">
              <div className="p-6">
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center text-emerald-700 mb-4 group-hover:scale-110 transition">
                  <Book size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{book.title}</h3>
                <p className="text-slate-500 text-sm mb-4">Penulis: {book.author}</p>
                <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded mb-4 font-semibold uppercase">{book.category}</span>
                <a 
                  href={book.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-emerald-700 text-white py-2 rounded-lg font-bold hover:bg-emerald-800 transition"
                >
                  Baca Sekarang
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {filteredBooks.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-xl italic">Buku yang pian cari belum ada...</p>
          </div>
        )}
      </main>

      {/* Modal Tambah Buku */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-emerald-700">Tambah Koleksi Baru</h2>
            <form onSubmit={handleAddBook} className="space-y-4">
              <input 
                type="text" placeholder="Judul Buku" required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                onChange={e => setNewBook({...newBook, title: e.target.value})}
              />
              <input 
                type="text" placeholder="Penulis" required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                onChange={e => setNewBook({...newBook, author: e.target.value})}
              />
              <input 
                type="url" placeholder="Link Google Drive / PDF" required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                onChange={e => setNewBook({...newBook, link: e.target.value})}
              />
              <select 
                className="w-full p-2 border rounded"
                onChange={e => setNewBook({...newBook, category: e.target.value})}
              >
                <option>Cerita Rakyat</option>
                <option>Sejarah</option>
                <option>Agama</option>
                <option>Sastra</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-700 text-white py-2 rounded font-bold hover:bg-emerald-800">Simpan</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-bold hover:bg-slate-300">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-20 border-t p-8 text-center text-slate-400 text-sm">
        <p>© 2026 Wadah Baca - Perpustakaan Digital Banjar</p>
      </footer>
    </div>
  );
}

export default App;