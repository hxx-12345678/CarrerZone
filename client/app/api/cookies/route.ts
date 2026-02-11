import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simple cookies endpoint that returns basic cookie info
    const response = NextResponse.json({
      success: true,
      message: 'Cookies endpoint working',
      data: {
        timestamp: new Date().toISOString(),
        cookies: request.cookies
      }
    })

    // Set some basic cookies if needed
    response.cookies.set('test_cookie', 'working', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Cookies API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
