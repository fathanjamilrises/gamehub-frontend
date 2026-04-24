// prisma/seed.js - Seed data untuk database (CommonJS)

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const gamesData = [
  {
    slug: 'mobile-legends',
    name: 'Mobile Legends: Bang Bang',
    publisher: 'Moonton',
    category: 'MOBA',
    badge: 'Instant',
    image_url: 'https://i.pinimg.com/736x/82/55/03/8255033248d018b6c5f3d460b2deec16.jpg',
    nominals: [
      { label: '86 Diamonds', amount: 86, price: 22000, bonus: '8 Bonus', sku_code: 'ml86' },
      { label: '172 Diamonds', amount: 172, price: 44000, bonus: '17 Bonus', sku_code: 'ml172' },
      { label: '257 Diamonds', amount: 257, price: 65000, bonus: '25 Bonus', sku_code: 'ml257' },
      { label: '343 Diamonds', amount: 343, price: 87000, bonus: '34 Bonus', sku_code: 'ml343' },
      { label: '514 Diamonds', amount: 514, price: 130000, bonus: '51 Bonus', sku_code: 'ml514' },
      { label: '600 Diamonds', amount: 600, price: 150000, bonus: '60 Bonus', sku_code: 'ml600' },
      { label: '706 Diamonds', amount: 706, price: 175000, bonus: '70 Bonus', sku_code: 'ml706' },
      { label: 'Starlight Member', amount: 1, price: 150000, bonus: 'Starlight Card', sku_code: 'mlsl' },
    ],
  },
  {
    slug: 'free-fire',
    name: 'Free Fire',
    publisher: 'Garena',
    category: 'Battle Royale',
    badge: 'Instant',
    image_url: 'https://i.pinimg.com/736x/26/a8/53/26a8534fb2d7063e6157af9513b219d9.jpg',
    nominals: [
      { label: '100 Diamonds', amount: 100, price: 15000, bonus: '10 Bonus' },
      { label: '310 Diamonds', amount: 310, price: 45000, bonus: '31 Bonus' },
      { label: '520 Diamonds', amount: 520, price: 75000, bonus: '52 Bonus' },
      { label: '1060 Diamonds', amount: 1060, price: 145000, bonus: '106 Bonus' },
      { label: '2180 Diamonds', amount: 2180, price: 290000, bonus: '218 Bonus' },
      { label: '5600 Diamonds', amount: 5600, price: 725000, bonus: '560 Bonus' },
    ],
  },
  {
    slug: 'pubg-mobile',
    name: 'PUBG Mobile',
    publisher: 'Tencent',
    category: 'Battle Royale',
    badge: 'Instant',
    image_url: 'https://i.pinimg.com/1200x/51/6a/74/516a74d6d701c86c007f668d7cf2891a.jpg',
    nominals: [
      { label: '60 UC', amount: 60, price: 15000, bonus: null },
      { label: '325 UC', amount: 325, price: 75000, bonus: '25 Bonus' },
      { label: '660 UC', amount: 660, price: 145000, bonus: '60 Bonus' },
      { label: '1800 UC', amount: 1800, price: 380000, bonus: '180 Bonus' },
      { label: '3850 UC', amount: 3850, price: 790000, bonus: '385 Bonus' },
      { label: '8100 UC', amount: 8100, price: 1590000, bonus: '810 Bonus' },
    ],
  },
  {
    slug: 'genshin-impact',
    name: 'Genshin Impact',
    publisher: 'HoYoverse',
    category: 'RPG',
    badge: 'Instant',
    image_url: 'https://i.pinimg.com/736x/ab/e0/19/abe019d59a86a88b52a6257ea454269e.jpg',
    nominals: [
      { label: '60 Genesis Crystals', amount: 60, price: 16000, bonus: null },
      { label: '330 Genesis Crystals', amount: 330, price: 79000, bonus: '30 Bonus' },
      { label: '1090 Genesis Crystals', amount: 1090, price: 249000, bonus: '110 Bonus' },
      { label: '2240 Genesis Crystals', amount: 2240, price: 499000, bonus: '260 Bonus' },
      { label: '3880 Genesis Crystals', amount: 3880, price: 829000, bonus: '440 Bonus' },
      { label: '8080 Genesis Crystals', amount: 8080, price: 1650000, bonus: '1600 Bonus' },
    ],
  },
  {
    slug: 'valorant',
    name: 'Valorant',
    publisher: 'Riot Games',
    category: 'FPS',
    badge: 'Instant',
    image_url: 'https://i.pinimg.com/736x/5c/95/c3/5c95c35ce191a78b4564c3caf49720e1.jpg',
    nominals: [
      { label: '475 VP', amount: 475, price: 55000, bonus: null },
      { label: '1000 VP', amount: 1000, price: 110000, bonus: null },
      { label: '2050 VP', amount: 2050, price: 220000, bonus: null },
      { label: '3650 VP', amount: 3650, price: 385000, bonus: null },
      { label: '5350 VP', amount: 5350, price: 550000, bonus: null },
      { label: '11000 VP', amount: 11000, price: 1100000, bonus: null },
    ],
  },
  {
    slug: 'honor-of-kings',
    name: 'Honor of Kings',
    publisher: 'Tencent',
    category: 'MOBA',
    badge: 'Instant',
    image_url: 'https://i.pinimg.com/736x/9b/8d/3a/9b8d3a5b8b8b8b8b8b8b8b8b8b8b8b8b.jpg',
    nominals: [
      { label: '88 Tokens', amount: 88, price: 15000, bonus: null },
      { label: '240 Tokens', amount: 240, price: 40000, bonus: null },
      { label: '400 Tokens', amount: 400, price: 65000, bonus: null },
      { label: '680 Tokens', amount: 680, price: 110000, bonus: null },
      { label: '1280 Tokens', amount: 1280, price: 205000, bonus: null },
      { label: '3280 Tokens', amount: 3280, price: 520000, bonus: null },
      { label: '6480 Tokens', amount: 6480, price: 1025000, bonus: null },
    ],
  },
]

async function main() {
  console.log('Start seeding...')

  for (const gameData of gamesData) {
    // Upsert game (update jika sudah ada)
    const game = await prisma.games.upsert({
      where: { slug: gameData.slug },
      update: {
        name: gameData.name,
        publisher: gameData.publisher,
        category: gameData.category,
        badge: gameData.badge,
        image_url: gameData.image_url,
      },
      create: {
        slug: gameData.slug,
        name: gameData.name,
        publisher: gameData.publisher,
        category: gameData.category,
        badge: gameData.badge,
        image_url: gameData.image_url,
      },
    })

    // Hapus nominals lama untuk game ini lalu re-create
    await prisma.nominals.deleteMany({ where: { game_id: game.id } })

    console.log(`Created game: ${game.name}`)

    // Create nominals for this game
    for (const nominalData of gameData.nominals) {
      await prisma.nominals.create({
        data: {
          game_id: game.id,
          label: nominalData.label,
          amount: nominalData.amount,
          price: nominalData.price,
          bonus: nominalData.bonus,
          sku_code: nominalData.sku_code ?? null,
        },
      })
    }

    console.log(`Created ${gameData.nominals.length} nominals for ${game.name}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
