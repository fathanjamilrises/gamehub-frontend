// Simple in-memory store for Digiflazz inquiry results
// Use Redis/DB in production

interface InquiryResult {
  nickname: string | null
  status: string
  timestamp: number
}

const inquiryStore = new Map<string, InquiryResult>()

export function getInquiryResult(refId: string): InquiryResult | undefined {
  return inquiryStore.get(refId)
}

export function setInquiryResult(
  refId: string,
  result: { nickname: string | null; status: string }
): void {
  inquiryStore.set(refId, {
    nickname: result.nickname,
    status: result.status,
    timestamp: Date.now(),
  })

  // Auto cleanup after 5 minutes
  setTimeout(() => {
    inquiryStore.delete(refId)
  }, 5 * 60 * 1000)
}

export function clearInquiryResult(refId: string): void {
  inquiryStore.delete(refId)
}
