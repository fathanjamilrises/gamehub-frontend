// GET /api/games/search?q=query - Search games
// Route → Controller → Service → Response

import { gameController } from '@/lib/controllers/gameController'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  // Controller memanggil Service, lalu return Response
  return gameController.searchGames(query)
}
