import { NextResponse } from 'next/server'
import { getShopifyData } from '@/lib/shopify/connector'
import type { DateRange } from '@/lib/schema'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json(
      { error: 'Query params start and end are required in YYYY-MM-DD format' },
      { status: 400 },
    )
  }

  const range: DateRange = { start, end }

  try {
    const data = await getShopifyData(range)
    return NextResponse.json({ range, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
