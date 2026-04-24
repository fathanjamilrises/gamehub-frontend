// lib/services/gameService.ts - Business logic & data access layer with Prisma
// File ini SERVER-ONLY karena menggunakan Prisma + database driver

import { prisma } from '@/lib/prisma'
import type { NominalItem, GameListItem, GameDetail } from '../types'

// Re-export types untuk convenience
export type { NominalItem, GameListItem, GameDetail } from '../types'


// Helper: Map Prisma games to GameListItem
function mapGameToListItem(game: { id: number; slug: string; name: string; publisher: string; category: string; badge: string | null; image_url: string | null }): GameListItem {
  return {
    id: game.id.toString(),
    slug: game.slug,
    name: game.name,
    publisher: game.publisher,
    category: game.category,
    badge: game.badge || 'Instant',
    image_url: game.image_url || '',
  }
}

// Helper: Map Prisma nominals to NominalItem
function mapNominal(nominal: { id: number; label: string; amount: number; price: number; bonus: string | null }): NominalItem {
  return {
    id: nominal.id.toString(),
    label: nominal.label,
    amount: nominal.amount,
    price: nominal.price,
    bonus: nominal.bonus || undefined,
  }
}

class GameService {
  // Get all games (without nominals for list view)
  async getAllGames(): Promise<GameListItem[]> {
    const games = await prisma.games.findMany({
      orderBy: { id: 'asc' },
    })
    return games.map(mapGameToListItem)
  }

  // Get single game by slug (with nominals)
  async getGameBySlug(slug: string): Promise<GameDetail | null> {
    const game = await prisma.games.findUnique({
      where: { slug },
      include: { nominals: { orderBy: { id: 'asc' } } },
    })

    if (!game) return null

    return {
      id: game.id.toString(),
      slug: game.slug,
      name: game.name,
      publisher: game.publisher,
      category: game.category,
      badge: game.badge || 'Instant',
      image_url: game.image_url || '',
      nominals: game.nominals.map(mapNominal),
    }
  }

  // Get game nominals only
  async getGameNominals(slug: string): Promise<NominalItem[] | null> {
    const game = await prisma.games.findUnique({
      where: { slug },
      include: { nominals: { orderBy: { id: 'asc' } } },
    })

    if (!game) return null
    return game.nominals.map(mapNominal)
  }

  // Search games by name or publisher
  async searchGames(query: string): Promise<GameListItem[]> {
    const games = await prisma.games.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { publisher: { contains: query } },
        ],
      },
      orderBy: { id: 'asc' },
    })
    return games.map(mapGameToListItem)
  }

  // Get games by category
  async getGamesByCategory(category: string): Promise<GameListItem[]> {
    const games = await prisma.games.findMany({
      where: { category: { equals: category,  } },
      orderBy: { id: 'asc' },
    })
    return games.map(mapGameToListItem)
  }

  // Get total game count
  async getGameCount(): Promise<number> {
    return await prisma.games.count()
  }
}

// Export singleton instance
export const gameService = new GameService()
