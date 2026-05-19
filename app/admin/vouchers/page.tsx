'use client'

import { useEffect, useState, FormEvent } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import Image from 'next/image'
import { adminFetch } from '@/lib/adminFetch'
import { useToast } from '@/lib/contexts/ToastContext'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || ''
function resolveImg(s?: string) {
  if (!s) return ''
  if (s.startsWith('http') || s.startsWith('blob:') || s.startsWith('data:')) return s
  return BACKEND_URL + (s.startsWith('/') ? s : '/' + s)
}

interface Voucher {
  id: number
  nama_voucher: string
  slug_voucher: string
  deskripsi: string
  gambar_voucher?: string
  createdAt?: string
  updatedAt?: string
  produks?: any[]
}

type Modal = 'closed' | 'form' | 'delete'

export default function AdminVouchersPage() {
  const [list, setList] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<Modal>('closed')
  const [sel, setSel] = useState<Voucher | null>(null)
  const [fL, setFL] = useState(false)
  const [fE, setFE] = useState('')
  const { success: showSuccess, error: showError } = useToast()

  const [fNama, setFNama] = useState('')
  const [fSlug, setFSlug] = useState('')
  const [fDeskripsi, setFDeskripsi] = useState('')
  const [fFile, setFFile] = useState<File | null>(null)
  const [fPrev, setFPrev] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const fetchList = async () => {
    setLoading(true); setError('')
    try {
      const r = await adminFetch('/api-proxy/admin/vouchers')
      const d = await r.json().catch(() => ({}))
      const arr = d?.data ?? d
      setList(Array.isArray(arr) ? arr : arr?.vouchers ?? [])
    } catch { setError('Gagal memuat data voucher') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchList() }, [])

  const openAdd = () => {
    setFNama(''); setFSlug(''); setFDeskripsi(''); setFFile(null); setFPrev('');
    setFE(''); setSel(null); setModal('form');
  }
  
  const openEdit = (p: Voucher) => {
    setFNama(p.nama_voucher || ''); setFSlug(p.slug_voucher || ''); setFDeskripsi(p.deskripsi || ''); setFFile(null); setFPrev(resolveImg(p.gambar_voucher));
    setFE(''); setSel(p); setModal('form')
  }
  
  const openDel = (p: Voucher) => { setSel(p); setFE(''); setModal('delete') }
  
  const close = () => { 
    setModal('closed'); setSel(null); setFE(''); 
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!fNama.trim()) { setFE('Nama voucher wajib diisi'); return }
    setFL(true); setFE('')
    const isEdit = modal === 'form' && sel
    const url = isEdit ? '/api-proxy/admin/vouchers/' + sel.id : '/api-proxy/admin/vouchers'
    try {
      const fd = new FormData()
      fd.append('nama_voucher', fNama.trim())
      if (fSlug.trim()) fd.append('slug_voucher', fSlug.trim())
      fd.append('deskripsi', fDeskripsi.trim())
      if (fFile) fd.append('gambar_voucher', fFile)
      
      const r = await adminFetch(url, { method: isEdit ? 'PUT' : 'POST', body: fd })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) { 
        const msg = d?.message || 'Gagal menyimpan'
        setFE(msg)
        showError(msg)
        return 
      }
      showSuccess(`Voucher ${isEdit ? 'diupdate' : 'ditambahkan'}!`)
      close(); fetchList()
    } catch { setFE('Gagal terhubung ke server') }
    finally { setFL(false) }
  }

  const del = async () => {
    if (!sel) return
    setFL(true); setFE('')
    try {
      const r = await adminFetch('/api-proxy/admin/vouchers/' + sel.id, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) { 
        const msg = d?.message || 'Gagal menghapus'
        setFE(msg)
        showError(msg)
        return 
      }
      showSuccess('Voucher berhasil dihapus!')
      close(); fetchList()
    } catch { setFE('Gagal terhubung ke server') }
    finally { setFL(false) }
  }

  const filteredAll = list.filter(p => {
    const q = search.toLowerCase()
    return (p.nama_voucher || '').toLowerCase().includes(q) || (p.slug_voucher || '').toLowerCase().includes(q)
  })

  const limit = 10
  const totalPages = Math.max(1, Math.ceil(filteredAll.length / limit))
  const paginated = filteredAll.slice((page - 1) * limit, page * limit)

  return (
    <AdminShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#ff90e8] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">🎟️ KELOLA VOUCHER</div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Daftar Voucher</h1>
          <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-cyan-400 pl-3 py-1">Tambah, edit, dan hapus voucher top up.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-[#ffc900] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M12 5v14M5 12h14"/></svg>
          Tambah Voucher
        </button>
      </div>

      <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff90e8] rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
        <div className="p-5 md:p-6 border-b-[3px] border-gray-900 relative z-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <input type="text" placeholder="CARI VOUCHER..." value={search} onChange={e => {setSearch(e.target.value); setPage(1)}} className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-10 h-10 border-4 border-gray-900 border-t-blue-600 rounded-full animate-spin" />
            <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Memuat...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600 font-black uppercase tracking-wider">{error}</p>
            <button onClick={fetchList} className="mt-4 px-4 py-2 border-[3px] border-gray-900 rounded-lg font-black text-sm uppercase shadow-[3px_3px_0px_#111827] hover:shadow-[1px_1px_0px_#111827] hover:translate-y-[2px] transition-all">Coba Lagi</button>
          </div>
        ) : filteredAll.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-5xl mb-3">🎟️</p>
            <p className="font-black text-gray-900 uppercase tracking-wider text-lg">Voucher Tidak Ditemukan</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{search ? 'Coba kata kunci lain.' : 'Belum ada voucher.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[3px] border-gray-900 bg-gray-50">
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest">Voucher</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden md:table-cell">Slug</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden sm:table-cell">Deskripsi</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-gray-900 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-[2px_2px_0px_#111827]">
                          {p.gambar_voucher ? <Image src={resolveImg(p.gambar_voucher)} alt={p.nama_voucher} width={40} height={40} unoptimized className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🎟️</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{p.nama_voucher}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell"><span className="bg-gray-100 border-2 border-gray-900 px-2 py-1 rounded text-[11px] font-black text-gray-700 shadow-[1px_1px_0px_#111827]">{p.slug_voucher || '-'}</span></td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-sm font-bold text-gray-600 truncate max-w-[200px]">{p.deskripsi || '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="px-3 py-1.5 border-[3px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-[2px] transition-all">Edit</button>
                        <button onClick={() => openDel(p)} className="px-3 py-1.5 border-[3px] border-gray-900 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 shadow-[2px_2px_0px_#111827] hover:shadow-none hover:translate-y-[2px] transition-all">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filteredAll.length > 0 && (
          <div className="px-5 py-4 border-t-[3px] border-gray-900 bg-gray-50 flex items-center justify-between">
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{filteredAll.length} voucher ditemukan</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-8 h-8 flex items-center justify-center border-[3px] border-gray-900 rounded-lg bg-white disabled:opacity-50 font-black shadow-[2px_2px_0px_#111827] disabled:shadow-none hover:shadow-none hover:translate-y-[2px] transition-all">&lt;</button>
              <span className="flex items-center text-xs font-black px-2">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 flex items-center justify-center border-[3px] border-gray-900 rounded-lg bg-white disabled:opacity-50 font-black shadow-[2px_2px_0px_#111827] disabled:shadow-none hover:shadow-none hover:translate-y-[2px] transition-all">&gt;</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modal === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!fL ? close : undefined} />
          <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-3 bg-gradient-to-r from-[#ffc900] via-[#ff90e8] to-cyan-400 border-b-[3px] border-gray-900 shrink-0" />
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">{sel ? 'Edit Voucher' : 'Tambah Voucher'}</h3>
                {!fL && <button type="button" onClick={close} className="text-gray-900 hover:text-red-600 transition-colors"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg></button>}
              </div>
              {fE && <div className="flex items-center gap-3 p-3 bg-red-50 border-[3px] border-red-500 rounded-xl mb-5 shadow-[3px_3px_0px_#ef4444]"><p className="text-red-600 text-sm font-black uppercase tracking-wide">{fE}</p></div>}
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Nama Voucher</label>
                  <input value={fNama} onChange={e => setFNama(e.target.value)} placeholder="Contoh: Voucher Roblox" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Slug Voucher (Opsional)</label>
                  <input value={fSlug} onChange={e => setFSlug(e.target.value)} placeholder="voucher-roblox" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Deskripsi</label>
                  <textarea value={fDeskripsi} onChange={e => setFDeskripsi(e.target.value)} placeholder="Deskripsi voucher..." rows={3} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Gambar</label>
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0] || null; setFFile(f); if (f) setFPrev(URL.createObjectURL(f)) }} className="hidden" id="voucher-img-upload" />
                  <label
                    htmlFor="voucher-img-upload"
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setIsDragging(false)
                      const file = e.dataTransfer.files?.[0]
                      if (file && file.type.startsWith('image/')) {
                        setFFile(file)
                        setFPrev(URL.createObjectURL(file))
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-full border-[3px] border-dashed border-gray-900 rounded-xl py-4 px-4 cursor-pointer transition-all group ${isDragging ? 'bg-blue-50 border-blue-500 shadow-[4px_4px_0px_#3b82f6]' : 'bg-gray-50 hover:bg-white hover:shadow-[4px_4px_0px_#2563eb]'}`}
                  >
                    {fPrev ? (
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-14 h-14 border-[3px] border-gray-900 rounded-lg overflow-hidden shrink-0 shadow-[2px_2px_0px_#111827]"><img src={fPrev} alt="Preview" className="w-full h-full object-cover" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-gray-900 truncate">{fFile?.name || 'Gambar saat ini'}</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-1">Klik untuk ganti</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-blue-600 transition-colors mb-1"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Upload Gambar</p>
                      </>
                    )}
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={close} disabled={fL} className="flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all uppercase">Batal</button>
                  <button type="submit" disabled={fL} className={"flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black uppercase shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all " + (fL ? 'bg-gray-200 text-gray-400' : 'bg-[#ffc900] text-gray-900')}>{fL ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {modal === 'delete' && sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!fL ? close : undefined} />
          <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#ef4444] w-full max-w-sm overflow-hidden">
            <div className="h-3 bg-red-500 border-b-[3px] border-gray-900" />
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 border-[3px] border-red-500 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_#ef4444]">
                <svg width="32" height="32" fill="none" stroke="#dc2626" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Hapus Voucher?</h3>
              <p className="font-black text-gray-900 text-lg bg-gray-100 border-2 border-gray-900 px-3 py-1.5 rounded-lg inline-block shadow-[2px_2px_0px_#111827] mb-5">{sel.nama_voucher}</p>
              {fE && <p className="text-red-600 text-sm font-black uppercase tracking-wide mb-4">{fE}</p>}
              <div className="flex gap-3">
                <button onClick={close} disabled={fL} className="flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all uppercase">Batal</button>
                <button onClick={del} disabled={fL} className={"flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-white uppercase shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all " + (fL ? 'bg-gray-400' : 'bg-red-500')}>{fL ? 'Menghapus...' : 'Ya, Hapus'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  )
}
