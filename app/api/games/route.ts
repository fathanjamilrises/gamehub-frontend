// GET /api/games - List all games
// Route → Controller → Service → Response

import { gameController } from '@/lib/controllers/gameController'

export async function GET() {
  // Controller memanggil Service, lalu return Response
  return gameController.getAllGames()
}
