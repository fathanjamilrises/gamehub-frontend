// lib/dummy/games.ts - Dummy data for games and nominals
import { GameDetail, GameListItem } from '../types'

export const gamesData: GameDetail[] = [
  {
    id: '1',
    slug: 'mobile-legends',
    name: 'Mobile Legends: Bang Bang',
    publisher: 'Moonton',
    category: 'MOBA',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/mobile-legends.jpg',
    nominals: [
      { id: '1', label: '86 Diamonds', amount: 86, price: 12500, bonus: '+8 Bonus' },
      { id: '2', label: '172 Diamonds', amount: 172, price: 25000, bonus: '+16 Bonus' },
      { id: '3', label: '257 Diamonds', amount: 257, price: 37000, bonus: '+25 Bonus' },
      { id: '4', label: '344 Diamonds', amount: 344, price: 49000, bonus: '+33 Bonus' },
      { id: '5', label: '514 Diamonds', amount: 514, price: 73000, bonus: '+51 Bonus' },
      { id: '6', label: '1028 Diamonds', amount: 1028, price: 145000, bonus: '+102 Bonus' },
    ],
  },
  {
    id: '2',
    slug: 'free-fire',
    name: 'Free Fire',
    publisher: 'Garena',
    category: 'Battle Royale',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/free-fire.jpg',
    nominals: [
      { id: '7', label: '100 Diamonds', amount: 100, price: 15000 },
      { id: '8', label: '310 Diamonds', amount: 310, price: 45000, bonus: '+31 Bonus' },
      { id: '9', label: '520 Diamonds', amount: 520, price: 75000, bonus: '+52 Bonus' },
      { id: '10', label: '1060 Diamonds', amount: 1060, price: 149000, bonus: '+106 Bonus' },
      { id: '11', label: '2180 Diamonds', amount: 2180, price: 298000, bonus: '+218 Bonus' },
    ],
  },
  {
    id: '3',
    slug: 'pubg-mobile',
    name: 'PUBG Mobile',
    publisher: 'Tencent',
    category: 'Battle Royale',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/pubg-mobile.jpg',
    nominals: [
      { id: '12', label: '60 UC', amount: 60, price: 14000 },
      { id: '13', label: '325 UC', amount: 325, price: 70000, bonus: '+25 Bonus' },
      { id: '14', label: '660 UC', amount: 660, price: 140000, bonus: '+55 Bonus' },
      { id: '15', label: '1800 UC', amount: 1800, price: 350000, bonus: '+180 Bonus' },
      { id: '16', label: '3850 UC', amount: 3850, price: 700000, bonus: '+385 Bonus' },
    ],
  },
  {
    id: '4',
    slug: 'genshin-impact',
    name: 'Genshin Impact',
    publisher: 'Hoyoverse',
    category: 'RPG',
    badge: '10-15 Menit',
    image_url: 'https://cdn.gamehub.id/games/genshin-impact.jpg',
    nominals: [
      { id: '17', label: '60 Genesis Crystal', amount: 60, price: 13000 },
      { id: '18', label: '300 Genesis Crystal', amount: 300, price: 65000, bonus: '+30 Bonus' },
      { id: '19', label: '980 Genesis Crystal', amount: 980, price: 195000, bonus: '+110 Bonus' },
      { id: '20', label: '1980 Genesis Crystal', amount: 1980, price: 390000, bonus: '+260 Bonus' },
      { id: '21', label: '3280 Genesis Crystal', amount: 3280, price: 650000, bonus: '+600 Bonus' },
      { id: '22', label: '6480 Genesis Crystal', amount: 6480, price: 1290000, bonus: '+1600 Bonus' },
    ],
  },
  {
    id: '5',
    slug: 'cod-mobile',
    name: 'Call of Duty Mobile',
    publisher: 'Activision',
    category: 'FPS',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/cod-mobile.jpg',
    nominals: [
      { id: '23', label: '80 CP', amount: 80, price: 13000 },
      { id: '24', label: '420 CP', amount: 420, price: 65000, bonus: '+35 Bonus' },
      { id: '25', label: '880 CP', amount: 880, price: 130000, bonus: '+90 Bonus' },
      { id: '26', label: '2000 CP', amount: 2000, price: 325000, bonus: '+250 Bonus' },
    ],
  },
  {
    id: '6',
    slug: 'aov',
    name: 'Arena of Valor',
    publisher: 'Garena',
    category: 'MOBA',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/aov.jpg',
    nominals: [
      { id: '27', label: '100 Vouchers', amount: 100, price: 15000 },
      { id: '28', label: '310 Vouchers', amount: 310, price: 45000, bonus: '+31 Bonus' },
      { id: '29', label: '520 Vouchers', amount: 520, price: 75000, bonus: '+52 Bonus' },
      { id: '30', label: '1060 Vouchers', amount: 1060, price: 149000, bonus: '+106 Bonus' },
    ],
  },
  {
    id: '7',
    slug: 'valorant',
    name: 'Valorant',
    publisher: 'Riot Games',
    category: 'FPS',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/valorant.jpg',
    nominals: [
      { id: '31', label: '100 Points', amount: 100, price: 12000 },
      { id: '32', label: '350 Points', amount: 350, price: 45000 },
      { id: '33', label: '700 Points', amount: 700, price: 90000 },
      { id: '34', label: '2050 Points', amount: 2050, price: 250000 },
      { id: '35', label: '4100 Points', amount: 4100, price: 500000 },
    ],
  },
  {
    id: '8',
    slug: 'steam-wallet',
    name: 'Steam Wallet',
    publisher: 'Steam',
    category: 'Wallet',
    badge: 'Kode',
    image_url: 'https://cdn.gamehub.id/games/steam.jpg',
    nominals: [
      { id: '36', label: 'IDR 12.000', amount: 12000, price: 13500 },
      { id: '37', label: 'IDR 45.000', amount: 45000, price: 48000 },
      { id: '38', label: 'IDR 60.000', amount: 60000, price: 63000 },
      { id: '39', label: 'IDR 90.000', amount: 90000, price: 95000 },
      { id: '40', label: 'IDR 120.000', amount: 120000, price: 125000 },
      { id: '41', label: 'IDR 250.000', amount: 250000, price: 260000 },
    ],
  },
  {
    id: '9',
    slug: 'google-play',
    name: 'Google Play Gift Card',
    publisher: 'Google',
    category: 'Gift Card',
    badge: 'Kode',
    image_url: 'https://cdn.gamehub.id/games/google-play.jpg',
    nominals: [
      { id: '42', label: 'IDR 20.000', amount: 20000, price: 22000 },
      { id: '43', label: 'IDR 50.000', amount: 50000, price: 53000 },
      { id: '44', label: 'IDR 100.000', amount: 100000, price: 105000 },
      { id: '45', label: 'IDR 150.000', amount: 150000, price: 155000 },
      { id: '46', label: 'IDR 300.000', amount: 300000, price: 310000 },
      { id: '47', label: 'IDR 500.000', amount: 500000, price: 515000 },
    ],
  },
  {
    id: '10',
    slug: 'honor-of-kings',
    name: 'Honor of Kings',
    publisher: 'Level Infinite',
    category: 'MOBA',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/hok.jpg',
    nominals: [
      { id: '48', label: '88 Tokens', amount: 88, price: 15000 },
      { id: '49', label: '176 Tokens', amount: 176, price: 30000 },
      { id: '50', label: '352 Tokens', amount: 352, price: 60000, bonus: '+35 Bonus' },
      { id: '51', label: '704 Tokens', amount: 704, price: 120000, bonus: '+70 Bonus' },
      { id: '52', label: '1408 Tokens', amount: 1408, price: 240000, bonus: '+140 Bonus' },
    ],
  },
  {
    id: '11',
    slug: 'clash-of-clans',
    name: 'Clash of Clans',
    publisher: 'Supercell',
    category: 'Strategy',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/coc.jpg',
    nominals: [
      { id: '53', label: '500 Gems', amount: 500, price: 50000 },
      { id: '54', label: '1200 Gems', amount: 1200, price: 110000 },
      { id: '55', label: '2500 Gems', amount: 2500, price: 220000 },
      { id: '56', label: '6500 Gems', amount: 6500, price: 550000 },
      { id: '57', label: '14000 Gems', amount: 14000, price: 1100000 },
    ],
  },
  {
    id: '12',
    slug: 'roblox',
    name: 'Roblox',
    publisher: 'Roblox Corp',
    category: 'Platform',
    badge: 'Instant',
    image_url: 'https://cdn.gamehub.id/games/roblox.jpg',
    nominals: [
      { id: '58', label: '80 Robux', amount: 80, price: 13000 },
      { id: '59', label: '400 Robux', amount: 400, price: 60000, bonus: '+50 Bonus' },
      { id: '60', label: '800 Robux', amount: 800, price: 120000, bonus: '+100 Bonus' },
      { id: '61', label: '1700 Robux', amount: 1700, price: 240000, bonus: '+200 Bonus' },
      { id: '62', label: '4500 Robux', amount: 4500, price: 600000, bonus: '+600 Bonus' },
    ],
  },
]

// Helper functions
export function getAllGames(): GameListItem[] {
  return gamesData.map(({ nominals, ...game }) => game)
}

export function getGameBySlug(slug: string): GameDetail | null {
  return gamesData.find((game) => game.slug === slug) || null
}

export function searchGames(query: string): GameListItem[] {
  const lowerQuery = query.toLowerCase()
  return gamesData
    .filter(
      (game) =>
        game.name.toLowerCase().includes(lowerQuery) ||
        game.publisher.toLowerCase().includes(lowerQuery) ||
        game.category.toLowerCase().includes(lowerQuery)
    )
    .map(({ nominals, ...game }) => game)
}

export function getGamesByCategory(category: string): GameListItem[] {
  return gamesData
    .filter((game) => game.category.toLowerCase() === category.toLowerCase())
    .map(({ nominals, ...game }) => game)
}
