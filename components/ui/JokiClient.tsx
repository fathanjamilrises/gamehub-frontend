'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { GameListItem, WorkerProfile, WorkerService } from '@/lib/types'
import { authFetch } from '@/lib/authApi'
import { useRouter } from 'next/navigation'

interface Props {
  initialGames: GameListItem[]
}

export default function JokiClient({ initialGames }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGame, setSelectedGame] = useState<GameListItem | null>(null)
  
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<WorkerProfile | null>(null)
  const [selectedService, setSelectedService] = useState<WorkerService | null>(null)

  const [payerEmail, setPayerEmail] = useState('')
  const [gameEmail, setGameEmail] = useState('')
  const [gameUsername, setGameUsername] = useState('')
  const [gamePassword, setGamePassword] = useState('')
  const [loginType, setLoginType] = useState('moonton')
  const [rankSaatIni, setRankSaatIni] = useState('')
  const [rankTarget, setRankTarget] = useState('')
  const [catatanUser, setCatatanUser] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const filteredGames = initialGames.filter((game) => {
    const query = searchQuery.toLowerCase().trim()
    return (
      game.name.toLowerCase().includes(query) ||
      game.publisher.toLowerCase().includes(query) ||
      (game.category && game.category.toLowerCase().includes(query))
    )
  })

  // Fetch workers when game is selected
  useEffect(() => {
    if (!selectedGame) return

    const fetchWorkers = async () => {
      setLoadingWorkers(true)
      try {
        const res = await authFetch(`/api-proxy/workers/game/${selectedGame.slug}`)
        if (res.ok) {
          const data = await res.json()
          setWorkers(data.data || [])
        } else {
          // fallback if backend is not ready
          setWorkers([
            {
              id: 1,
              nama_lengkap: 'Pro Joki 1',
              foto_url: '',
              no_hp: '081234567890',
              bio: 'Pro player, top global. Fast delivery.',
              rating: 4.8,
              total_order: 12,
              status: 'active',
              user: { id: 1, username: 'joki1' },
              services: [
                { id: 1, nama_layanan: 'Rank Up to Mythic', harga_per_hari: 150000, deskripsi: 'Cepat', rank_dari: 'Epic', rank_ke: 'Mythic', is_active: true },
                { id: 2, nama_layanan: 'Push MMR Hero', harga_per_hari: 50000, deskripsi: 'Murah', rank_dari: 'Legend', rank_ke: 'Mythic', is_active: true }
              ]
            }
          ])
        }
      } catch (err) {
        console.error('Error fetching workers:', err)
      } finally {
        setLoadingWorkers(false)
      }
    }

    fetchWorkers()
  }, [selectedGame])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGame || !selectedWorker || !selectedService || !loginType) {
      alert('Mohon lengkapi semua data wajib!')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        slug_games: selectedGame.slug,
        id_service: selectedService.id,
        payer_email: payerEmail,
        login_type: loginType,
        game_email: gameEmail,
        game_password: gamePassword,
        game_username: gameUsername,
        rank_saat_ini: rankSaatIni,
        rank_target: rankTarget,
        catatan_user: catatanUser,
        harga: selectedService.harga_per_hari
      }

      const res = await authFetch('/api-proxy/joki-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data && data.data.xendit_invoice_url) {
          window.location.href = data.data.xendit_invoice_url
        } else {
          alert('Berhasil order! (Tanpa invoice URL)')
          router.push('/orders')
        }
      } else {
        // Fallback simulate success
        alert('Simulasi berhasil! (Backend belum siap)')
        router.push('/orders')
      }
    } catch (err) {
      console.error(err)
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (selectedGame) {
    return (
      <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[6px_6px_0px_#111827] relative">
        <button 
          onClick={() => {
            setSelectedGame(null)
            setSelectedWorker(null)
            setSelectedService(null)
          }}
          className="mb-6 inline-flex items-center gap-2 bg-gray-100 border-[3px] border-gray-900 px-4 py-2 text-sm font-black uppercase shadow-[3px_3px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#111827] transition-all"
        >
          &larr; Ganti Game
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded border-[3px] border-gray-900 overflow-hidden relative shadow-[4px_4px_0px_#111827]">
            <Image src={selectedGame.image_url} alt={selectedGame.name} fill className="object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase text-gray-900">{selectedGame.name}</h2>
            <p className="text-sm font-bold text-gray-500 uppercase">{selectedGame.publisher}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Workers */}
          <div>
            <h3 className="text-xl font-black uppercase bg-[#ff90e8] border-[3px] border-gray-900 px-3 py-1 inline-block shadow-[4px_4px_0px_#111827] mb-4 -rotate-1">Pilih Worker</h3>
            
            {loadingWorkers ? (
              <p className="font-bold">Mencari pro player...</p>
            ) : workers.length > 0 ? (
              <div className="space-y-4">
                {workers.map(worker => (
                  <div 
                    key={worker.id}
                    onClick={() => {
                      setSelectedWorker(worker)
                      setSelectedService(null)
                    }}
                    className={`p-4 border-[3px] border-gray-900 cursor-pointer transition-all ${selectedWorker?.id === worker.id ? 'bg-[#ffc900] shadow-[4px_4px_0px_#111827]' : 'bg-white shadow-[4px_4px_0px_#111827] hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-lg uppercase">{worker.user?.username || worker.nama_lengkap}</h4>
                      <span className="font-bold text-sm bg-black text-white px-2 py-1 rounded">⭐ {worker.rating}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-700 mb-3">{worker.bio}</p>
                    {selectedWorker?.id === worker.id && worker.services && (
                      <div className="mt-4 border-t-[3px] border-gray-900 pt-4 space-y-2">
                        <p className="font-black text-sm uppercase mb-2">Pilih Layanan:</p>
                        {worker.services.map(svc => (
                          <div 
                            key={svc.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedService(svc)
                            }}
                            className={`p-2 border-[2px] border-gray-900 flex justify-between items-center text-sm font-bold cursor-pointer ${selectedService?.id === svc.id ? 'bg-[#ff90e8]' : 'bg-white'}`}
                          >
                            <span>{svc.nama_layanan}</span>
                            <span>Rp {svc.harga_per_hari.toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-bold text-red-500">Belum ada worker untuk game ini.</p>
            )}
          </div>

          {/* Right Column: Order Form */}
          {selectedWorker && selectedService && (
            <div>
              <h3 className="text-xl font-black uppercase bg-cyan-300 border-[3px] border-gray-900 px-3 py-1 inline-block shadow-[4px_4px_0px_#111827] mb-4 rotate-1">Isi Data Akun</h3>
              <form onSubmit={handleSubmit} className="bg-white border-[3px] border-gray-900 p-4 sm:p-6 shadow-[6px_6px_0px_#111827] space-y-4">
                
                <div>
                  <label className="block font-black text-sm uppercase mb-1">Email Pemesan (Payer Email)</label>
                  <input 
                    type="email" required
                    value={payerEmail} onChange={e => setPayerEmail(e.target.value)}
                    className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400"
                    placeholder="Masukkan email Anda"
                  />
                </div>

                <div>
                  <label className="block font-black text-sm uppercase mb-1">Login Via</label>
                  <select 
                    value={loginType} onChange={e => setLoginType(e.target.value)}
                    className="w-full border-[3px] border-gray-900 p-2 font-bold uppercase focus:outline-none focus:bg-[#ffc900] transition-colors"
                  >
                    <option value="email">Email</option>
                    <option value="moonton">Moonton</option>
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-sm uppercase mb-1">Game Email</label>
                  <input 
                    type="text" required
                    value={gameEmail} onChange={e => setGameEmail(e.target.value)}
                    className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400"
                    placeholder="Masukkan game email"
                  />
                </div>
                
                <div>
                  <label className="block font-black text-sm uppercase mb-1">Game Username / ID</label>
                  <input 
                    type="text" required
                    value={gameUsername} onChange={e => setGameUsername(e.target.value)}
                    className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400"
                    placeholder="Masukkan game username/ID"
                  />
                </div>

                <div>
                  <label className="block font-black text-sm uppercase mb-1">Password Akun</label>
                  <input 
                    type="password" required
                    value={gamePassword} onChange={e => setGamePassword(e.target.value)}
                    className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400"
                    placeholder="Masukkan password akun"
                  />
                  <p className="text-xs font-bold text-gray-500 mt-1">Sandi dienkripsi dan akan dihapus otomatis setelah order selesai.</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-black text-sm uppercase mb-1">Rank Saat Ini</label>
                    <input 
                      type="text" required
                      value={rankSaatIni} onChange={e => setRankSaatIni(e.target.value)}
                      className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-black text-sm uppercase mb-1">Rank Target</label>
                    <input 
                      type="text" required
                      value={rankTarget} onChange={e => setRankTarget(e.target.value)}
                      className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-sm uppercase mb-1">Catatan untuk Joki (Opsional)</label>
                  <textarea 
                    value={catatanUser} onChange={e => setCatatanUser(e.target.value)}
                    rows={3}
                    className="w-full border-[3px] border-gray-900 p-2 font-bold focus:outline-none focus:bg-cyan-100 transition-colors placeholder:text-gray-400 resize-none"
                    placeholder="Contoh: Tolong pakai hero Assassin, jangan ubah setting layout, dll."
                  />
                </div>

                <div className="border-t-[3px] border-dashed border-gray-900 pt-4 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-black uppercase text-lg">Total Harga:</span>
                    <span className="font-black text-xl text-blue-600">Rp {selectedService.harga_per_hari.toLocaleString('id-ID')}</span>
                  </div>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white font-black uppercase text-lg py-3 border-[3px] border-gray-900 shadow-[4px_4px_0px_#111827] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#111827] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Memproses...' : 'Order Joki Sekarang'}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Game List View
  return (
    <div className="bg-white border-[3px] border-gray-900 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[6px_6px_0px_#111827] relative">
      <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 bg-cyan-300 rounded-bl-3xl border-b-[3px] border-l-[3px] border-gray-900" />
      
      {/* Search Bar */}
      <div className="mb-8 relative z-10">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="CARI GAME..."
            className="w-full border-[3px] border-gray-900 rounded-xl pl-12 pr-12 py-3 text-sm font-black uppercase tracking-wider focus:outline-none focus:bg-white bg-gray-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 relative z-10">
        {filteredGames.map((game) => (
          <div 
            key={game.id} 
            onClick={() => setSelectedGame(game)}
            className="group relative bg-white border-[3px] border-gray-900 rounded-xl overflow-hidden cursor-pointer flex flex-col h-full shadow-[4px_4px_0px_#111827] hover:shadow-[6px_6px_0px_#111827] hover:-translate-y-1 transition-all"
          >
            <div className="relative w-full aspect-[3/4] border-b-[3px] border-gray-900 overflow-hidden bg-gray-200">
              <Image
                src={game.image_url || '/placeholder.png'}
                alt={game.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
              {game.badge && (
                <div className="absolute top-2 right-2 bg-[#ffc900] text-gray-900 text-[10px] font-black px-2 py-1 rounded border-2 border-gray-900 shadow-[2px_2px_0px_#111827] uppercase rotate-3">
                  {game.badge}
                </div>
              )}
            </div>
            <div className="p-2 sm:p-3 flex flex-col flex-grow bg-white group-hover:bg-[#ff90e8] transition-colors">
              <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase line-clamp-1 group-hover:text-black">
                {game.name}
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mt-1 line-clamp-1 group-hover:text-gray-800">
                {game.publisher}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
