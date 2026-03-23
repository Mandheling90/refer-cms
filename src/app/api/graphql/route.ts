import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://api-service:8000/graphql'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 클라이언트에서 보낸 헤더 전달 (인증, 병원코드 등)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const authorization = request.headers.get('authorization')
    if (authorization) {
      headers['authorization'] = authorization
    }

    const hospitalCode = request.headers.get('x-hospital-code')
    if (hospitalCode) {
      headers['x-hospital-code'] = hospitalCode
    }

    console.log('[API Proxy] →', API_URL)

    const res = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await res.json()

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[API Proxy] GraphQL request failed:', error)
    return NextResponse.json(
      { errors: [{ message: 'Internal proxy error' }] },
      { status: 502 }
    )
  }
}
