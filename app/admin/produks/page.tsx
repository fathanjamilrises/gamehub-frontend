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

interface Produk {
  id: number
  nama_produk: string
  kode_produk: string
  harga_produk: number | string
  harga_normal_produk?: number | string
  label_produk?: string
  gambar_produk?: string
  id_games?: number
  id_voucher?: number
  game?: { nama_games?: string }
  voucher?: { nama_voucher?: string }
  region?: string
  status?: string
}

type Modal = 'closed' | 'add' | 'edit' | 'delete'

export default function AdminProduksPage() {
  const [list, setList] = useState<Produk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterGame, setFilterGame] = useState('all')
  const [filterRegion, setFilterRegion] = useState('all')
  const [page, setPage] = useState(1)
  const [gamesList, setGamesList] = useState<{id: number, nama_games: string, slug_games?: string}[]>([])
  const [vouchersList, setVouchersList] = useState<{id: number, nama_voucher: string, slug_voucher?: string}[]>([])
  const [regionList, setRegionList] = useState<string[]>([])
  const [modal, setModal] = useState<Modal>('closed')
  const [sel, setSel] = useState<Produk | null>(null)
  const [fL, setFL] = useState(false)
  const [fE, setFE] = useState('')
  const { success: showSuccess, error: showError } = useToast()

  const [fNama, setFNama] = useState('')
  const [fKode, setFKode] = useState('')
  const [fHarga, setFHarga] = useState('')
  const [fHargaNormal, setFHargaNormal] = useState('')
  const [fLabel, setFLabel] = useState('')
  const [fIdGames, setFIdGames] = useState('')
  const [fIdVouchers, setFIdVouchers] = useState('')
  const [fRegion, setFRegion] = useState('')
  const [fStatus, setFStatus] = useState('active')
  const [fFile, setFFile] = useState<File | null>(null)
  const [fPrev, setFPrev] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // States for Import Feature
  const [importGameId, setImportGameId] = useState('')
  const [importVoucherId, setImportVoucherId] = useState('')
  const [providerProducts, setProviderProducts] = useState<any[]>([])
  const [loadingProvider, setLoadingProvider] = useState(false)
  const [selectedProviderCodes, setSelectedProviderCodes] = useState<Set<string>>(new Set())
  const [providerPage, setProviderPage] = useState(1)
  const [allProviderProducts, setAllProviderProducts] = useState<Map<string, any>>(new Map())

  const fetchList = async () => {
    setLoading(true); setError('')
    try {
      const r = await adminFetch('/api-proxy/admin/produk')
      const d = await r.json().catch(() => ({}))
      const arr = d?.data ?? d
      setList(Array.isArray(arr) ? arr : arr?.produks ?? [])
    } catch { setError('Gagal memuat data produk') }
    finally { setLoading(false) }
  }

  const fetchGames = async () => {
    try {
      const r = await adminFetch('/api-proxy/admin/games')
      const d = await r.json().catch(() => ({}))
      const arr = d?.data ?? d
      setGamesList(Array.isArray(arr) ? arr : arr?.games ?? [])
    } catch {}
  }

  const fetchVouchers = async () => {
    try {
      const r = await adminFetch('/api-proxy/admin/vouchers')
      const d = await r.json().catch(() => ({}))
      const arr = d?.data ?? d
      setVouchersList(Array.isArray(arr) ? arr : arr?.vouchers ?? [])
    } catch {}
  }

  const fetchRegions = async () => {
    try {
      const r = await adminFetch('/api-proxy/admin/produk/region')
      const d = await r.json().catch(() => ({}))
      const arr = d?.data ?? d
      if (Array.isArray(arr)) {
        const uniqueRegions = Array.from(new Set(arr.map((x: any) => typeof x === 'string' ? x : (x.region || x.name || String(x)))))
        setRegionList(uniqueRegions.filter(Boolean))
      }
    } catch {}
  }

  useEffect(() => { fetchList(); fetchGames(); fetchVouchers(); fetchRegions() }, [])

  useEffect(() => {
    if (modal === 'add' && (importGameId || importVoucherId)) {
      fetchProviderProducts(importGameId || importVoucherId, providerPage, !!importVoucherId)
    } else {
      setProviderProducts([])
    }
  }, [importGameId, importVoucherId, modal, providerPage])

  const fetchProviderProducts = async (id: string, pageNum: number, isVoucher = false) => {
    setLoadingProvider(true)
    setFE('')
    try {
      let slug = ''
      if (isVoucher) {
        const v = vouchersList.find(v => String(v.id) === String(id))
        slug = v?.slug_voucher || v?.nama_voucher.toLowerCase().replace(/\s+/g, '-') || ''
      } else {
        const game = gamesList.find(g => String(g.id) === String(id))
        slug = game?.slug_games || game?.nama_games.toLowerCase().replace(/\s+/g, '-') || ''
      }
      
      const r = await adminFetch(`/api-proxy/admin/produk/vip/${slug}?page=${pageNum}&regional=ID`)
      const d = await r.json().catch(() => ({}))
      const arr = d?.data ?? d
      if (Array.isArray(arr)) {
        setProviderProducts(arr)
        setAllProviderProducts(prev => {
          const next = new Map(prev)
          arr.forEach((p, i) => {
            const code = String(p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id)
            const uniqueKey = `${code}-${pageNum}-${i}`
            next.set(uniqueKey, p)
          })
          return next
        })
      } else {
        setProviderProducts([])
      }
    } catch {
      setFE('Gagal memuat produk dari service')
    } finally {
      setLoadingProvider(false)
    }
  }

  const openAdd = () => {
    setFE(''); setSel(null); setModal('add');
    setImportGameId(''); setImportVoucherId(''); setProviderProducts([]); setSelectedProviderCodes(new Set()); setProviderPage(1); setAllProviderProducts(new Map());
  }
  const openEdit = (p: Produk) => {
    setFNama(p.nama_produk || ''); setFKode(p.kode_produk || ''); setFHarga(String(p.harga_produk || '')); setFHargaNormal(String(p.harga_normal_produk || '')); setFLabel(p.label_produk || ''); setFIdGames(String(p.id_games || '')); setFIdVouchers(String(p.id_voucher || '')); setFRegion(p.region || 'global'); setFStatus(p.status || 'active'); setFFile(null); setFPrev(resolveImg(p.gambar_produk))
    setFE(''); setSel(p); setModal('edit')
  }
  const openDel = (p: Produk) => { setSel(p); setFE(''); setModal('delete') }
  const close = () => { 
    setModal('closed'); setSel(null); setFE(''); 
    setImportGameId(''); setImportVoucherId(''); setProviderProducts([]); setSelectedProviderCodes(new Set()); setProviderPage(1); setAllProviderProducts(new Map());
  }

  const saveAdd = async () => {
    if (selectedProviderCodes.size === 0) return
    setFL(true)
    setFE('')
    try {
      const selected = Array.from(selectedProviderCodes).map(key => allProviderProducts.get(key)).filter(Boolean)
      
      let successCount = 0
      for (const p of selected) {
        const fd = new FormData()
        fd.append('nama_produk', p.nama_produk || p.name || p.product_name || '')
        fd.append('kode_produk', p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id || '')
        
        // Handle price which could be an object { basic, premium, special } or a direct number
        let price = p.harga_produk || p.price || 0
        if (typeof price === 'object' && price !== null) {
          price = price.basic || price.premium || price.special || 0
        }
        fd.append('harga_produk', price)
        
        if (importGameId) fd.append('id_games', importGameId)
        if (importVoucherId) fd.append('id_voucher', importVoucherId)
        fd.append('region', importVoucherId ? 'global' : (p.region || 'global'))
        fd.append('status', 'active')
        
        const r = await adminFetch('/api-proxy/admin/produk', { method: 'POST', body: fd })
        if (r.ok) successCount++
      }
      
      if (successCount === 0) {
        setFE('Gagal menambahkan produk, pastikan API tersedia.')
        showError('Gagal menambahkan produk')
      } else {
        showSuccess(`${successCount} produk berhasil diimpor!`)
        close()
        fetchList()
      }
    } catch {
      setFE('Terjadi kesalahan saat menyimpan produk')
    } finally {
      setFL(false)
    }
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!fNama.trim()) { setFE('Nama produk wajib diisi'); return }
    if (!fKode.trim()) { setFE('Kode produk wajib diisi'); return }
    setFL(true); setFE('')
    const isEdit = modal === 'edit' && sel
    const url = isEdit ? '/api-proxy/admin/produk/' + sel.id : '/api-proxy/admin/produk'
    try {
      const fd = new FormData()
      fd.append('nama_produk', fNama.trim())
      fd.append('kode_produk', fKode.trim())
      fd.append('harga_produk', fHarga)
      if (fHargaNormal) fd.append('harga_normal_produk', fHargaNormal)
      if (fLabel) fd.append('label_produk', fLabel.trim())
      if (fIdGames) fd.append('id_games', fIdGames)
      if (fIdVouchers) fd.append('id_voucher', fIdVouchers)
      fd.append('region', fIdVouchers ? 'global' : fRegion.trim())
      fd.append('status', fStatus)
      if (fFile) fd.append('gambar_produk', fFile)
      const r = await adminFetch(url, { method: isEdit ? 'PUT' : 'POST', body: fd })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) { 
        const msg = d?.message || 'Gagal menyimpan'
        setFE(msg)
        showError(msg)
        return 
      }
      showSuccess(`Produk ${isEdit ? 'diupdate' : 'ditambahkan'}!`)
      close(); fetchList()
    } catch { setFE('Gagal terhubung ke server') }
    finally { setFL(false) }
  }

  const del = async () => {
    if (!sel) return
    setFL(true); setFE('')
    try {
      const r = await adminFetch('/api-proxy/admin/produk/' + sel.id, { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok || d?.success === false) { 
        const msg = d?.message || 'Gagal menghapus'
        setFE(msg)
        showError(msg)
        return 
      }
      showSuccess('Produk berhasil dihapus!')
      close(); fetchList()
    } catch { setFE('Gagal terhubung ke server') }
    finally { setFL(false) }
  }

  const filteredAll = list.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = (p.nama_produk || '').toLowerCase().includes(q) || (p.kode_produk || '').toLowerCase().includes(q)
    const matchGame = filterGame === 'all' || String(p.id_games) === filterGame
    const matchRegion = filterRegion === 'all' || (p.region || 'global').toLowerCase() === filterRegion
    return matchSearch && matchGame && matchRegion
  })

  const limit = 10
  const totalPages = Math.max(1, Math.ceil(filteredAll.length / limit))
  const paginated = filteredAll.slice((page - 1) * limit, page * limit)

  const fmt = (v: number | string) => 'Rp ' + Number(v).toLocaleString('id-ID')

  return (
    <AdminShell>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#ff90e8] border-[3px] border-gray-900 text-gray-900 text-[11px] font-black px-4 py-2 rounded mb-4 shadow-[4px_4px_0px_#111827] uppercase tracking-widest -rotate-1">📦 KELOLA PRODUK</div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight">Daftar Produk</h1>
          <p className="text-gray-600 font-bold text-sm mt-1 border-l-[4px] border-cyan-400 pl-3 py-1">Tambah, edit, dan hapus produk top up.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-5 py-3 bg-[#ffc900] border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 uppercase tracking-wider shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] hover:translate-x-[2px] transition-all shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" d="M12 5v14M5 12h14"/></svg>
          Tambah Produk
        </button>
      </div>

      <div className="bg-white border-[3px] border-gray-900 rounded-2xl shadow-[8px_8px_0px_#111827] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff90e8] rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
        <div className="p-5 md:p-6 border-b-[3px] border-gray-900 relative z-10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </div>
              <input type="text" placeholder="CARI PRODUK..." value={search} onChange={e => {setSearch(e.target.value); setPage(1)}} className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-4 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all bg-gray-50 focus:bg-white placeholder:text-gray-400" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select value={filterGame} onChange={e => {setFilterGame(e.target.value); setPage(1)}} className="w-full sm:w-auto border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                <option value="all">SEMUA GAME</option>
                {gamesList.map(g => <option key={g.id} value={g.id}>{g.nama_games}</option>)}
              </select>
              <select value={filterRegion} onChange={e => {setFilterRegion(e.target.value); setPage(1)}} className="w-full sm:w-auto border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-black uppercase tracking-wider bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                <option value="all">SEMUA REGION</option>
                {regionList.map((r, i) => <option key={i} value={r.toLowerCase()}>{r.toUpperCase()}</option>)}
              </select>
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
            <p className="text-5xl mb-3">📦</p>
            <p className="font-black text-gray-900 uppercase tracking-wider text-lg">Produk Tidak Ditemukan</p>
            <p className="text-sm font-bold text-gray-500 mt-1">{search ? 'Coba kata kunci lain.' : 'Belum ada produk.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-[3px] border-gray-900 bg-gray-50">
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest">Produk</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden md:table-cell">Kode</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden md:table-cell">Region</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden sm:table-cell">Harga</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest hidden lg:table-cell">Game</th>
                  <th className="px-5 py-4 text-[11px] font-black text-gray-900 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(p => (
                  <tr key={p.id} className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-[3px] border-gray-900 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-[2px_2px_0px_#111827]">
                          {p.gambar_produk ? <Image src={resolveImg(p.gambar_produk)} alt={p.nama_produk} width={40} height={40} unoptimized className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 text-sm truncate">{p.nama_produk}</p>
                          {p.label_produk && <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{p.label_produk}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell"><span className="bg-gray-100 border-2 border-gray-900 px-2 py-1 rounded text-[11px] font-black text-gray-700 uppercase shadow-[1px_1px_0px_#111827]">{p.kode_produk}</span></td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {p.id_voucher ? (
                        <span className="text-gray-400 font-bold text-[10px]">-</span>
                      ) : (
                        <span className="bg-[#ff90e8]/20 border-2 border-[#ff90e8] text-[#c026d3] px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">{p.region || 'GLOBAL'}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="font-black text-gray-900 text-sm">{fmt(p.harga_produk)}</p>
                      {p.harga_normal_produk && Number(p.harga_normal_produk) > Number(p.harga_produk) && <p className="text-[10px] text-red-500 line-through font-bold">{fmt(p.harga_normal_produk)}</p>}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-600 hidden lg:table-cell">
                      {p.game?.nama_games || p.voucher?.nama_voucher || (p.id_games ? 'Game #' + p.id_games : p.id_voucher ? 'Voucher #' + p.id_voucher : '-')}
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
            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">{filteredAll.length} produk ditemukan</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="w-8 h-8 flex items-center justify-center border-[3px] border-gray-900 rounded-lg bg-white disabled:opacity-50 font-black shadow-[2px_2px_0px_#111827] disabled:shadow-none hover:shadow-none hover:translate-y-[2px] transition-all">&lt;</button>
              <span className="flex items-center text-xs font-black px-2">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="w-8 h-8 flex items-center justify-center border-[3px] border-gray-900 rounded-lg bg-white disabled:opacity-50 font-black shadow-[2px_2px_0px_#111827] disabled:shadow-none hover:shadow-none hover:translate-y-[2px] transition-all">&gt;</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add (via Fetch Service) */}
      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!fL ? close : undefined} />
          <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-3 bg-gradient-to-r from-[#ff90e8] to-cyan-400 border-b-[3px] border-gray-900 shrink-0" />
            <div className="p-6 overflow-y-auto flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Tambah Produk Baru</h3>
                {!fL && <button onClick={close} className="text-gray-900 hover:text-red-600 transition-colors"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg></button>}
              </div>
              
              {fE && <div className="flex items-center gap-3 p-3 bg-red-50 border-[3px] border-red-500 rounded-xl mb-5 shadow-[3px_3px_0px_#ef4444] shrink-0"><p className="text-red-600 text-sm font-black uppercase tracking-wide">{fE}</p></div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Pilih Game</label>
                  <select 
                    value={importGameId} 
                    onChange={e => {
                      setImportGameId(e.target.value);
                      setImportVoucherId('');
                      setProviderPage(1);
                      setSelectedProviderCodes(new Set());
                      setAllProviderProducts(new Map());
                    }} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all"
                  >
                    <option value="">-- Pilih Game --</option>
                    {gamesList.map(g => <option key={g.id} value={g.id}>{g.nama_games}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Pilih Voucher</label>
                  <select 
                    value={importVoucherId} 
                    onChange={e => {
                      setImportVoucherId(e.target.value);
                      setImportGameId('');
                      setProviderPage(1);
                      setSelectedProviderCodes(new Set());
                      setAllProviderProducts(new Map());
                    }} 
                    className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all"
                  >
                    <option value="">-- Pilih Voucher --</option>
                    {vouchersList.map(v => <option key={v.id} value={v.id}>{v.nama_voucher}</option>)}
                  </select>
                </div>
              </div>

              {loadingProvider ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 min-h-[300px]">
                  <div className="w-10 h-10 border-4 border-gray-900 border-t-[#ff90e8] rounded-full animate-spin mb-4" />
                  <p className="font-black text-gray-900 uppercase tracking-widest text-sm">Mengambil Data...</p>
                </div>
              ) : (importGameId || importVoucherId) && (providerProducts.length > 0 || providerPage > 1) ? (
                <div className="flex-1 overflow-hidden flex flex-col min-h-[300px]">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <p className="text-sm font-black text-gray-700 uppercase tracking-widest">{providerProducts.length} Produk Ditemukan</p>
                    <button 
                      onClick={() => {
                        const currentKeys = providerProducts.map((p, i) => {
                          const code = String(p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id)
                          return `${code}-${providerPage}-${i}`
                        })
                        const allCurrentSelected = currentKeys.every(k => selectedProviderCodes.has(k))
                        
                        setSelectedProviderCodes(prev => {
                          const nextSet = new Set(prev)
                          if (allCurrentSelected) {
                            currentKeys.forEach(k => nextSet.delete(k))
                          } else {
                            currentKeys.forEach(k => nextSet.add(k))
                          }
                          return nextSet
                        })
                      }}
                      className="text-xs font-black text-blue-600 uppercase hover:underline"
                    >
                      {providerProducts.length > 0 && providerProducts.map((p, i) => {
                        const code = String(p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id)
                        return `${code}-${providerPage}-${i}`
                      }).every(k => selectedProviderCodes.has(k)) ? 'Batal Pilih Halaman Ini' : 'Pilih Halaman Ini'}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto border-[3px] border-gray-900 rounded-xl bg-gray-50 shadow-inner">
                    <table className="w-full text-left relative">
                      <thead className="sticky top-0 bg-gray-200 border-b-[3px] border-gray-900 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 w-10 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-2 border-gray-900 accent-blue-600 cursor-pointer"
                              checked={providerProducts.length > 0 && providerProducts.map((p, i) => {
                                const code = String(p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id)
                                return `${code}-${providerPage}-${i}`
                              }).every(k => selectedProviderCodes.has(k))}
                              onChange={e => {
                                const currentKeys = providerProducts.map((p, i) => {
                                  const code = String(p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id)
                                  return `${code}-${providerPage}-${i}`
                                })
                                setSelectedProviderCodes(prev => {
                                  const nextSet = new Set(prev)
                                  if (e.target.checked) {
                                    currentKeys.forEach(k => nextSet.add(k))
                                  } else {
                                    currentKeys.forEach(k => nextSet.delete(k))
                                  }
                                  return nextSet
                                })
                              }}
                            />
                          </th>
                          <th className="px-4 py-3 text-[11px] font-black text-gray-900 uppercase tracking-widest">Produk</th>
                          <th className="px-4 py-3 text-[11px] font-black text-gray-900 uppercase tracking-widest text-right">Harga</th>
                        </tr>
                      </thead>
                      <tbody>
                        {providerProducts.map((p, i) => {
                          const code = String(p.kode_produk || p.code || p.buyer_sku_code || p.sku_code || p.id || `unknown-${i}`)
                          const uniqueKey = `${code}-${providerPage}-${i}`
                          const isSelected = selectedProviderCodes.has(uniqueKey)
                          
                          let displayPrice = p.harga_produk || p.price || 0
                          if (typeof displayPrice === 'object' && displayPrice !== null) {
                            displayPrice = displayPrice.basic || displayPrice.premium || displayPrice.special || 0
                          }

                          return (
                            <tr key={uniqueKey} className={`border-b-2 border-gray-200 hover:bg-white transition-colors cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`} onClick={() => {
                              const newSet = new Set(selectedProviderCodes)
                              if (isSelected) newSet.delete(uniqueKey)
                              else newSet.add(uniqueKey)
                              setSelectedProviderCodes(newSet)
                            }}>
                              <td className="px-4 py-3 text-center">
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => {}} 
                                  className="w-4 h-4 rounded border-2 border-gray-900 accent-blue-600 cursor-pointer pointer-events-none"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-black text-gray-900 text-sm">{p.nama_produk || p.product_name || p.name}</p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">{code}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="font-black text-gray-900 text-sm">{fmt(displayPrice)}</p>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Provider */}
                  <div className="flex justify-between items-center mt-3 shrink-0">
                    <button 
                      onClick={() => setProviderPage(p => Math.max(1, p - 1))}
                      disabled={providerPage === 1 || loadingProvider}
                      className="px-4 py-2 bg-white border-[3px] border-gray-900 rounded-xl font-black text-xs shadow-[2px_2px_0px_#111827] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#111827] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      &lt; SEBELUMNYA
                    </button>
                    <span className="text-xs font-black text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border-[3px] border-gray-900 shadow-[2px_2px_0px_#111827]">HALAMAN {providerPage}</span>
                    <button 
                      onClick={() => setProviderPage(p => p + 1)}
                      disabled={providerProducts.length === 0 || loadingProvider}
                      className="px-4 py-2 bg-white border-[3px] border-gray-900 rounded-xl font-black text-xs shadow-[2px_2px_0px_#111827] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_#111827] disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      SELANJUTNYA &gt;
                    </button>
                  </div>
                </div>
              ) : (importGameId || importVoucherId) ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center min-h-[300px]">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="font-black text-gray-900 uppercase tracking-wider text-lg">Tidak ada produk</p>
                  <p className="text-sm font-bold text-gray-500 mt-1">Coba pilih game lain atau periksa koneksi service.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center opacity-50 min-h-[300px]">
                  <p className="text-4xl mb-3">🎮</p>
                  <p className="font-black text-gray-900 uppercase tracking-wider text-lg">Pilih Game atau Voucher Dahulu</p>
                </div>
              )}

              <div className="flex gap-3 pt-6 mt-6 shrink-0">
                <button type="button" onClick={close} disabled={fL} className="flex-1 py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black text-gray-900 bg-gray-100 hover:bg-gray-200 shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all uppercase">Batal</button>
                <button 
                  onClick={saveAdd}
                  disabled={fL || selectedProviderCodes.size === 0} 
                  className={"flex-[2] py-3 border-[3px] border-gray-900 rounded-xl text-sm font-black uppercase shadow-[4px_4px_0px_#111827] hover:shadow-[2px_2px_0px_#111827] hover:translate-y-[2px] transition-all " + (fL || selectedProviderCodes.size === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#ffc900] text-gray-900')}
                >
                  {fL ? 'Menyimpan...' : `Tambahkan ${selectedProviderCodes.size} Produk`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {modal === 'edit' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!fL ? close : undefined} />
          <div className="relative bg-white rounded-2xl border-[3px] border-gray-900 shadow-[8px_8px_0px_#111827] w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-3 bg-gradient-to-r from-[#ffc900] via-[#ff90e8] to-cyan-400 border-b-[3px] border-gray-900 shrink-0" />
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Edit Produk</h3>
                {!fL && <button onClick={close} className="text-gray-900 hover:text-red-600 transition-colors"><svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/></svg></button>}
              </div>
              {fE && <div className="flex items-center gap-3 p-3 bg-red-50 border-[3px] border-red-500 rounded-xl mb-5 shadow-[3px_3px_0px_#ef4444]"><p className="text-red-600 text-sm font-black uppercase tracking-wide">{fE}</p></div>}
              <form onSubmit={save} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Nama Produk</label>
                  <input value={fNama} onChange={e => setFNama(e.target.value)} placeholder="Weekly Diamond Pass" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Kode</label>
                    <input value={fKode} onChange={e => setFKode(e.target.value)} placeholder="ML-172" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Game</label>
                    <select value={fIdGames} onChange={e => { setFIdGames(e.target.value); if (e.target.value) setFIdVouchers('') }} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                      <option value="">Pilih Game...</option>
                      {gamesList.map(g => <option key={g.id} value={g.id}>{g.nama_games}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Voucher</label>
                    <select value={fIdVouchers} onChange={e => { setFIdVouchers(e.target.value); if (e.target.value) setFIdGames('') }} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                      <option value="">Pilih Voucher...</option>
                      {vouchersList.map(v => <option key={v.id} value={v.id}>{v.nama_voucher}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Harga Jual</label>
                    <input value={fHarga} onChange={e => setFHarga(e.target.value.replace(/\D/g, ''))} placeholder="28000" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Harga Normal</label>
                    <input value={fHargaNormal} onChange={e => setFHargaNormal(e.target.value.replace(/\D/g, ''))} placeholder="35000" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Label</label>
                    <input value={fLabel} onChange={e => setFLabel(e.target.value)} placeholder="Diamond, Wdp, dll" className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all" />
                  </div>
                  {!fIdVouchers && (
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Region</label>
                      <select value={fRegion} onChange={e => setFRegion(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                        <option value="">Pilih Region...</option>
                        {regionList.map((r, i) => <option key={i} value={r.toLowerCase()}>{r}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Gambar</label>
                  <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0] || null; setFFile(f); if (f) setFPrev(URL.createObjectURL(f)) }} className="hidden" id="produk-img-upload" />
                  <label
                    htmlFor="produk-img-upload"
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
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 group-hover:text-blue-600 transition-colors mb-1"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">Upload Gambar</p>
                      </>
                    )}
                  </label>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-900 mb-1.5">Status</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="w-full border-[3px] border-gray-900 rounded-xl px-4 py-3 text-sm font-bold bg-gray-50 focus:bg-white focus:outline-none focus:shadow-[4px_4px_0px_#2563eb] transition-all">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">Hapus Produk?</h3>
              <p className="font-black text-gray-900 text-lg bg-gray-100 border-2 border-gray-900 px-3 py-1.5 rounded-lg inline-block shadow-[2px_2px_0px_#111827] mb-5">{sel.nama_produk}</p>
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
