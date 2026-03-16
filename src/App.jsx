import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { BookOpen, PlusCircle, Search, LogIn, LogOut, Book, Trash2, X, ExternalLink } from 'lucide-react';

const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null); // Untuk PDF Reader
  const [newBook, setNewBook] = useState({ title: '', author: '', link: '', category: 'Cerita Rakyat' });
  const [notification, setNotification] = useState(null);

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
    const pass = prompt("Password Admin:");
    if (pass === 'bjmmajusejahtera') {
      setIsAdmin(true);
      showNotif("Selamat datang Admin!");
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      // Mengubah link GDrive biasa menjadi link Direct View agar bisa tampil di web
      let finalLink = newBook.link;
      if (finalLink.includes('drive.google.com')) {
        finalLink = finalLink.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
      }
      await addDoc(collection(db, 'books'), { ...newBook, link: finalLink });
      setShowAddModal(false);
      setNewBook({ title: '', author: '', link: '', category: 'Cerita Rakyat' });
      showNotif("✅ Buku berhasil ditambahkan!");
    } catch (err) { showNotif("❌ Gagal menambah buku"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus buku ini dari koleksi?")) {
      await deleteDoc(doc(db, 'books', id));
      showNotif("🗑️ Buku telah dihapus");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Notifikasi Pop-up */}
      {notification && (
        <div className="fixed top-20 right-5 z-[100] bg-emerald-800 text-white px-6 py-3 rounded-lg shadow-2xl animate-bounce">
          {notification}
        </div>
      )}

      {/* Header */}
      <nav className="bg-emerald-700 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
            <BookOpen size={28} />
            <h1 className="text-2xl font-bold tracking-tight">WADAH BACA</h1>
          </div>
          <div className="flex gap-4">
            {!isAdmin ? (
              <button onClick={handleLogin} className="hover:text-emerald-200 transition">Admin</button>
            ) : (
              <div className="flex gap-4 items-center">
                <button onClick={() => setShowAddModal(true)} className="bg-white text-emerald-700 px-4 py-1 rounded-full font-bold flex items-center gap-1">
                  <PlusCircle size={18} /> Tambah
                </button>
                <button onClick={() => setIsAdmin(false)} className="text-red-200"><LogOut size={20} /></button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-emerald-600 text-white py-10 px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Perpustakaan Digital Banjar</h2>
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-3 text-emerald-600" size={20} />
          <input 
            type="text" placeholder="Cari judul atau penulis..." 
            className="w-full p-3 pl-10 rounded-xl text-slate-800 outline-none shadow-lg"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List Buku */}
      <main className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {books.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(book => (
          <div key={book.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition relative group">
            {isAdmin && (
              <button 
                onClick={() => handleDelete(book.id)}
                className="absolute top-2 right-2 text-slate-300 hover:text-red-600 transition p-2"
              >
                <Trash2 size={18} />
              </button>
            )}
            <div className="text-emerald-700 mb-3"><Book size={30} /></div>
            <h3 className="font-bold text-lg leading-tight mb-1">{book.title}</h3>
            <p className="text-slate-500 text-sm mb-4 italic">{book.author}</p>
            <button 
              onClick={() => setSelectedPdf(book)}
              className="w-full bg-emerald-50 text-emerald-700 py-2 rounded-lg font-bold hover:bg-emerald-700 hover:text-white transition flex items-center justify-center gap-2"
            >
              Baca di Sini <ExternalLink size={16} />
            </button>
          </div>
        ))}
      </main>

      {/* MODAL PDF READER */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col">
          <div className="p-4 flex justify-between items-center text-white bg-emerald-900">
            <h3 className="font-bold">{selectedPdf.title}</h3>
            <button onClick={() => setSelectedPdf(null)} className="p-2 hover:bg-red-600 rounded-full transition">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-slate-800">
            <iframe 
              src={selectedPdf.link} 
              className="w-full h-full border-none"
              title="PDF Reader"
              allow="autoplay"
            ></iframe>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BUKU */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddBook} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-emerald-700">Tambah Koleksi</h2>
            <input type="text" placeholder="Judul Buku" required className="w-full p-2 border rounded" onChange={e => setNewBook({...newBook, title: e.target.value})} />
            <input type="text" placeholder="Penulis" required className="w-full p-2 border rounded" onChange={e => setNewBook({...newBook, author: e.target.value})} />
            <input type="url" placeholder="Link Google Drive" required className="w-full p-2 border rounded" onChange={e => setNewBook({...newBook, link: e.target.value})} />
            <select className="w-full p-2 border rounded" onChange={e => setNewBook({...newBook, category: e.target.value})}>
              <option>Cerita Rakyat</option><option>Sejarah</option><option>Agama</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-700 text-white py-2 rounded font-bold">Simpan</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-200 py-2 rounded">Batal</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;