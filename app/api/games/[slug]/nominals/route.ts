// GET /api/games/[slug]/nominals - Get game nominals only
// Route → Controller → Service → Response

import { gameController } from '@/lib/controllers/gameController'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, { params }: Props) {
  const { slug } = await params
  // Controller memanggil Service, lalu return Response
  return gameController.getGameNominals(slug)
}
