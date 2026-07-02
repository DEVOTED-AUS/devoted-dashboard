/** Normalised daily P&L data — single source of truth for all connectors. */
export type LineItem = {
  sku: string
  unitsSold: number
}

export type DailyData = {
  date: string        // YYYY-MM-DD (order's created_at date in store timezone)
  netRevenue: number  // AUD — Shopify "Total sales": subtotal - discounts + shipping + taxes (what hits the bank)
  orderCount: number
  newCustomers: number
  lineItems: LineItem[]
}

export type DateRange = {
  start: string  // YYYY-MM-DD
  end: string    // YYYY-MM-DD
}
