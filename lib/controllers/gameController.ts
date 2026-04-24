// lib/controllers/gameController.ts - Handle HTTP requests & responses
// Controller menerima request dari Route, memanggil Service, dan mengembalikan response

import { gameService } from '@/lib/services/gameService'

// Success response helper
function successResponse(data: unknown, count?: number) {
  return Response.json({
    success: true,
    data,
    ...(count !== undefined && { count }),
    timestamp: new Date().toISOString(),
  })
}

// Error response helper
function errorResponse(message: string, status: number = 500) {
  return Response.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

export const gameController = {
  // GET /api/games - List all games
  async getAllGames() {
    try {
      // Panggil Service untuk business logic
      const games = await gameService.getAllGames()
      return successResponse(games, games.length)
    } catch (error) {
      return errorResponse('Failed to fetch games')
    }
  },

  // GET /api/games/[slug] - Get single game
  async getGameBySlug(slug: string) {
    try {
      // Panggil Service untuk ambil data by slug
      const game = await gameService.getGameBySlug(slug)

      if (!game) {
        return errorResponse('Game not found', 404)
      }

      return successResponse(game)
    } catch (error) {
      return errorResponse('Failed to fetch game')
    }
  },

  // GET /api/games/[slug]/nominals - Get game nominals only
  async getGameNominals(slug: string) {
    try {
      // Panggil Service untuk ambil nominals
      const nominals = await gameService.getGameNominals(slug)

      if (!nominals) {
        return errorResponse('Game not found', 404)
      }

      return successResponse(nominals, nominals.length)
    } catch (error) {
      return errorResponse('Failed to fetch nominals')
    }
  },

  // GET /api/games/search?q=query - Search games
  async searchGames(query: string) {
    try {
      if (!query || query.trim() === '') {
        return errorResponse('Query parameter is required', 400)
      }

      // Panggil Service untuk search
      const games = await gameService.searchGames(query)
      return successResponse(games, games.length)
    } catch (error) {
      return errorResponse('Failed to search games')
    }
  },
}
