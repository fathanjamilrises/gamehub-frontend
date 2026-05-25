import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const logPath = path.join(process.cwd(), 'chat_debug_log.json')
    
    // Read existing log or start new
    let logs: any[] = []
    if (fs.existsSync(logPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
        if (!Array.isArray(logs)) logs = [logs]
      } catch {
        logs = []
      }
    }
    
    logs.push({
      timestamp: new Date().toISOString(),
      ...body
    })
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2))
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message })
  }
}
