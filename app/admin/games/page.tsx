'use client'

import { useEffect, useState, FormEvent } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import Image from 'next/image'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''

function resolveImageUrl(src?: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('blob:') || src.startsWith('data:')) return src
  return BACKEND_URL + (src.startsWith('/') ? src : '/' + src)
}

interface Game {
  id: number
  nama_games: string
  slug_games: string
  id_publisher: number
  publisher?: { nama_publisher?: string }
  gambar_games?: string
  status?: string
}

type ModalMode = 'closed' | 'add' | 'edit' | 'delete'

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Modal
  const [modal, setModal] = useState<ModalMode>('closed')
  const [selected, setSelected] = useState<Game | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const { success: showSuccess, error: showError } = useToast()

  // Form fields
  const [fName, setFName] = useState('')
  const [fSlug, setFSlug] = useState('')
  const [fPublisher, setFPublisher] = useState('')
  const [fImageFile, setFImageFile] = useState<File | null>(null)
  const [fImagePreview, setFImagePreview] = useState('')
  const [fStatus, setFStatus] = useState('active')
  const [isDragging, setIsDragging] = useState(false)

  const fetchGames = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminFetch('/api-proxy/admin/games')
      const data = await res.json().catch(() => ({}))
      const list = data?.data ?? data
      setGames(Array.isArray(list) ? list : list?.games ?? [])
    } catch {
      setError('Gagal memuat data game')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGames() }, [])

  const openAdd = () => {
    setFName(''); setFSlug(''); setFPublisher(''); setFImageFile(null); setFImagePreview(''); setFStatus('active')
    setFormError(''); setSelected(null); setModal('add')
  }

  const openEdit = (g: Game) => {
    setFName(g.nama_games || '')
    setFSlug(g.slug_games || '')
    setFPublisher(String(g.id_publisher || ''))
    setFImageFile(null)
    setFImagePreview(resolveImageUrl(g.gambar_games))
    setFStatus(g.status || 'active')
    setFormError(''); setSelected(g); setModal('edit')
  }

  const openDelete = (g: Game) => { setSelected(g); setFormError(''); setModal('delete') }
  const closeModal = () => { setModal('closed'); setSelected(null); setFormError('') }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!fName.trim()) { setFormError('Nama game wajib diisi'); return }
    if (!fSlug.trim()) { setFormError('Slug wajib diisi'); return }

    setFormLoading(true); setFormError('')
    const isEdit = modal === 'edit' && selected
    const url = isEdit ? '/api-proxy/admin/games/' + selected.id : '/api-proxy/admin/games'

    try {
      const formData = new FormData()
      formData.append('nama_games', fName.trim())
      formData.append('slug_games', fSlug.trim())
      formData.append('id_publisher', String(Number(fPublisher) || 1))
      formData.append('status', fStatus)
      if (fImageFile) {
        formData.append('gambar_games', fImageFile)
      }

      const res = await adminFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        const msg = data?.message || 'Gagal menyimpan'
        setFormError(msg)
        showError(msg)
        return
      }
      showSuccess(`Game ${isEdit ? 'diupdate' : 'ditambahkan'}!`)
      closeModal(); fetchGames()
    } catch { setFormError('Gagal terhubung ke server') }
    finally { setFormLoading(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setFormLoading(true); setFormError('')
    try {
      const res = await adminFetch('/api-proxy/admin/games/' + selected.id, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.success === false) {
        const msg = data?.message || 'Gagal menghapus'
        setFormError(msg)
        showError(msg)
        return
      }
      showSuccess('Game berhasil dihapus!')
      closeModal(); fetchGames()
    } catch { setFormError('Gagal terhubung ke server') }
    finally { setFormLoading(false) }
  }

  const filtered = games.filter((g) => {
    const q = search.toLowerCase()
    return (g.nama_games || '').toLowerCase().includes(q) || (g.slug_games || '').toLowerCase().includes(q)
  })

  const getPublisherName = (g: Game) => g.publisher?.nama_publisher || 'Publisher #' + g.id_publisher

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-cyan-300 border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">
            🎮 KELOLA GAME
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Daftar Game</h1>
          <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-[#ff90e8] pl-3 py-1">Tambah, edit, dan hapus game yang tersedia di platform.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-[#ffc900] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M12 5v14M5 12h14"/></svg>
          Tambah Game
        </button>
      </div>

      {/* Search + Table Card */}
      <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#ffc900] rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />

        {/* Search */}
        <div className="p-5 md:p-6 border-b-[3px] border-gray-900 relative z-10">
          <div className="relative w-full max-w-sm">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <input type="text" placeholder="CARI GAME..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Memuat...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-black uppercase tracking-wider">{error}</p>
            <button onClick={fetchGames} className="mt-4 px-4 py-2 border-[3px] border-gray-900 rounded-lg font-black text-sm uppercase shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] transition-all">Coba Lagi</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-5xl mb-3">🎮</p>
            <p className="font-black text-gray-900 uppercase tracking-wider text-lg">Game Tidak Ditemukan</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{search ? 'Coba kata kunci lain.' : 'Belum ada game. Klik "Tambah Game" untuk mulai.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[3px] border-gray-900 bg-gray-50">
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest">Game</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden md:table-cell">Slug</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden sm:table-cell">Publisher</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden lg:table-cell">Status</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-gray-900 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-[2px_2px_0px_#111827]">
                          {g.gambar_games ? (
                            <Image src={resolveImageUrl(g.gambar_games)} alt={g.nama_games} width={40} height={40} unoptimized className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{g.nama_games}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider sm:hidden">{getPublisherName(g)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="bg-gray-100 border-2 border-gray-900 px-2 py-1 rounded text-[11px] font-black text-gray-700 uppercase shadow-[1px_1px_0px_#111827]">{g.slug_games}</span>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-600 hidden sm:table-cell">{getPublisherName(g)}</td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className={"inline-block px-2.5 py-1 rounded border-2 border-gray-900 text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_#111827] " + (g.status === 'active' ? 'bg-[#86efac] text-gray-900' : 'bg-gray-200 text-gray-500')}>
                        {g.status || 'active'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(g)} className="px-3 py-1.5 border-[3px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-[2px] transition-all">Edit</button>
                        <button onClick={() => openDelete(g)} className="px-3 py-1.5 border-[3px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-[2px] transition-all">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t-[3px] border-gray-900 bg-gray-50">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{filtered.length} game ditemukan</p>
          </div>
        )}
      </div>

      {/* ── Modal Add/Edit ── */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!formLoading ? closeModal : undefined} />
          <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-md overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-[#ffc900] via-[#ff90e8] to-cyan-400 border-b-[3px] border-gray-900" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">{modal === 'add' ? 'Tambah Game' : 'Edit Game'}</h3>
                {!formLoading && (
                  <button onClick={closeModal} className="text-gray-900 hover:text-red-600 transition-colors">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>

              {formError && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border-[3px] border-red-500 rounded-xl mb-5 shadow-[3px_3px_0px_#ef4444]">
                  <p className="text-red-600 text-sm font-black uppercase tracking-wide">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Nama Game</label>
                  <input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Mobile Legends"
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Slug</label>
                  <input value={fSlug} onChange={(e) => setFSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="mobile-legends"
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Publisher ID</label>
                  <input value={fPublisher} onChange={(e) => setFPublisher(e.target.value.replace(/\D/g, ''))} placeholder="1"
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Gambar</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setFImageFile(file)
                        if (file) {
                          setFImagePreview(URL.createObjectURL(file))
                        }
                      }}
                      className="hidden"
                      id="game-image-upload"
                    />
                    <label
                      htmlFor="game-image-upload"
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file && file.type.startsWith('image/')) {
                          setFImageFile(file)
                          setFImagePreview(URL.createObjectURL(file))
                        }
                      }}
                      className={`flex flex-col items-center justify-center w-full border-[3px] border-dashed border-gray-900 rounded-xl py-5 px-4 cursor-pointer transition-all group ${isDragging ? 'bg-blue-50 border-blue-500 shadow-[4px_4px_0px_#3b82f6]' : 'bg-gray-50 hover:bg-white hover:shadow-[4px_4px_0px_#2563eb]'}`}
                    >
                      {fImagePreview ? (
                        <div className="flex items-center gap-4 w-full">
                          <div className="w-16 h-16 border-[3px] border-gray-900 rounded-lg overflow-hidden shrink-0 shadow-[2px_2px_0px_#111827]">
                            <img src={fImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-gray-900 truncate">{fImageFile?.name || 'Gambar saat ini'}</p>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Klik untuk ganti</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-blue-600 transition-colors mb-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          <p className="text-sm font-black text-gray-500 group-hover:text-gray-900 uppercase tracking-wider">Upload Gambar</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">JPG, PNG, WebP (Maks 2MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Status</label>
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal} disabled={formLoading}
                    className="flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all uppercase">
                    Batal
                  </button>
                  <button type="submit" disabled={formLoading}
                    className={"flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black uppercase shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all " + (formLoading ? 'bg-gray-200 text-gray-400' : 'bg-[#ffc900] text-gray-900')}>
                    {formLoading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Delete ── */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!formLoading ? closeModal : undefined} />
          <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#ef4444] w-full max-w-sm overflow-hidden">
            <div className="h-3 bg-red-500 border-b-[3px] border-gray-900" />
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 border-[3px] border-red-500 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#ef4444]">
                <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Hapus Game?</h3>
              <p className="text-sm font-bold text-gray-600 mb-1">Anda akan menghapus:</p>
              <p className="font-black text-gray-900 text-lg bg-gray-100 border-2 border-gray-900 px-3 py-1.5 rounded-lg inline-block shadow-[2px_2px_0px_#111827] mb-5">{selected.nama_games}</p>

              {formError && <p className="text-red-600 text-sm font-black uppercase tracking-wide mb-4">{formError}</p>}

              <div className="flex gap-3">
                <button onClick={closeModal} disabled={formLoading}
                  className="flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all uppercase">
                  Batal
                </button>
                <button onClick={handleDelete} disabled={formLoading}
                  className={"flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-white uppercase shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all " + (formLoading ? 'bg-gray-400' : 'bg-red-500')}>
                  {formLoading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
