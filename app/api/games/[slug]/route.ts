// GET /api/games/[slug] - Get single game by slug
// Route → Controller → Service → Response

import { gameController } from '@/lib/controllers/gameController'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params
  // Controller memanggil Service, lalu return Response
  return gameController.getGameBySlug(slug)
}
