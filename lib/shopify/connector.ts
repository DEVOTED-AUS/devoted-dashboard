import { unstable_cache } from 'next/cache'
import { shopifyGraphQL } from './client'
import type { DailyData, DateRange, LineItem } from '@/lib/schema'

// ---------------------------------------------------------------------------
// GraphQL query — paginated orders with financial totals and line items
// ---------------------------------------------------------------------------

const ORDERS_QUERY = `
  query Orders($after: String, $query: String!) {
    orders(first: 250, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        createdAt
        totalPriceSet { shopMoney { amount currencyCode } }
        customer { numberOfOrders }
        lineItems(first: 100) {
          nodes {
            sku
            quantity
          }
        }
      }
    }
  }
`

// ---------------------------------------------------------------------------
// Types matching the GraphQL response
// ---------------------------------------------------------------------------

type GQLMoney = { amount: string; currencyCode: string }
type GQLOrder = {
  createdAt: string
  totalPriceSet: { shopMoney: GQLMoney }
  customer: { numberOfOrders: number } | null
  lineItems: { nodes: Array<{ sku: string | null; quantity: number }> }
}
type GQLOrdersData = {
  orders: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: GQLOrder[]
  }
}

// ---------------------------------------------------------------------------
// Fetch all pages for a date range
// ---------------------------------------------------------------------------

async function fetchAllOrders(range: DateRange): Promise<GQLOrder[]> {
  const queryString = `created_at:>='${range.start}' created_at:<='${range.end}T23:59:59' financial_status:paid`
  const orders: GQLOrder[] = []
  let cursor: string | null = null

  do {
    const data: GQLOrdersData = await shopifyGraphQL<GQLOrdersData>(ORDERS_QUERY, {
      after: cursor,
      query: queryString,
    })
    orders.push(...data.orders.nodes)
    cursor = data.orders.pageInfo.hasNextPage ? data.orders.pageInfo.endCursor : null
  } while (cursor)

  return orders
}

// ---------------------------------------------------------------------------
// Normalise raw orders → DailyData[]  (one entry per calendar day)
// ---------------------------------------------------------------------------

function normalise(orders: GQLOrder[]): DailyData[] {
  const byDate = new Map<string, DailyData>()

  for (const order of orders) {
    const date = order.createdAt.slice(0, 10) // YYYY-MM-DD

    // totalPriceSet = what the customer actually paid (subtotal - discounts + shipping + taxes).
    // This matches Shopify's "Total sales" figure — the revenue that hits the bank.
    const netRevenue = parseFloat(order.totalPriceSet.shopMoney.amount)

    // Flag non-AUD orders so we catch any currency issues early
    const currency = order.totalPriceSet.shopMoney.currencyCode
    if (currency !== 'AUD') {
      console.warn(`[shopify] Non-AUD order detected: ${currency} on ${date}`)
    }

    const isNewCustomer = order.customer?.numberOfOrders === 1 ? 1 : 0

    const lineItems: LineItem[] = order.lineItems.nodes
      .filter((li) => li.sku)
      .map((li) => ({ sku: li.sku!, unitsSold: li.quantity }))

    if (!byDate.has(date)) {
      byDate.set(date, { date, netRevenue: 0, orderCount: 0, newCustomers: 0, lineItems: [] })
    }

    const day = byDate.get(date)!
    day.netRevenue = parseFloat((day.netRevenue + netRevenue).toFixed(2))
    day.orderCount += 1
    day.newCustomers += isNewCustomer

    // Merge line items by SKU
    for (const li of lineItems) {
      const existing = day.lineItems.find((x) => x.sku === li.sku)
      if (existing) {
        existing.unitsSold += li.unitsSold
      } else {
        day.lineItems.push({ ...li })
      }
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
}

// ---------------------------------------------------------------------------
// Cached public API
// ---------------------------------------------------------------------------

export const getShopifyData = unstable_cache(
  async (range: DateRange): Promise<DailyData[]> => {
    const orders = await fetchAllOrders(range)
    return normalise(orders)
  },
  ['shopify-daily-data'],
  {
    // Revalidate every 6 hours — keeps numbers fresh without hammering the API
    revalidate: 60 * 60 * 6,
    tags: ['shopify'],
  },
)
