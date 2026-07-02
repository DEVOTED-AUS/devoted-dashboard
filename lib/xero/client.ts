const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize'
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'
const XERO_API_BASE = 'https://api.xero.com'

export type XeroTokens = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export type XeroTenant = {
  id: string
  tenantId: string
  tenantName: string
  tenantType: string
}

export type XeroExpenseRow = {
  account: string
  amount: number
}

export type XeroExpenseData = {
  periodStart: string
  periodEnd: string
  expenses: XeroExpenseRow[]
  totalExpenses: number
}

function basicAuth(): string {
  return Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString('base64')
}

export function getXeroAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.XERO_CLIENT_ID!,
    redirect_uri: process.env.XERO_REDIRECT_URI!,
    scope: 'accounting.reports.profitandloss.read accounting.settings.read offline_access openid',
    state,
  })
  return `${XERO_AUTH_URL}?${params}`
}

export async function exchangeCode(code: string): Promise<XeroTokens> {
  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.XERO_REDIRECT_URI!,
    }).toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Xero token exchange failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<XeroTokens>
}

export async function refreshAccessToken(refreshToken: string): Promise<XeroTokens> {
  const res = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Xero token refresh failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<XeroTokens>
}

export async function getXeroTenants(accessToken: string): Promise<XeroTenant[]> {
  const res = await fetch(`${XERO_API_BASE}/connections`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Failed to get Xero tenants: ${res.status}`)
  return res.json() as Promise<XeroTenant[]>
}

type XeroReportRow = {
  RowType: string
  Title?: string
  Rows?: XeroReportRow[]
  Cells?: { Value: string }[]
}

type XeroReportResponse = {
  Reports: { Rows: XeroReportRow[] }[]
}

function parseExpenses(json: XeroReportResponse, start: string, end: string): XeroExpenseData {
  const report = json.Reports?.[0]
  if (!report) {
    return { periodStart: start, periodEnd: end, expenses: [], totalExpenses: 0 }
  }

  const expenses: XeroExpenseRow[] = []
  const incomeSections = new Set(['Income', 'Revenue', 'Trading Income', 'Other Income'])

  for (const section of report.Rows) {
    if (section.RowType !== 'Section') continue
    if (incomeSections.has(section.Title ?? '')) continue

    for (const row of section.Rows ?? []) {
      if (row.RowType !== 'Row') continue
      const cells = row.Cells ?? []
      const account = cells[0]?.Value ?? ''
      const raw = (cells[1]?.Value ?? '0').replace(/,/g, '')
      const amount = Math.abs(parseFloat(raw) || 0)
      if (account && amount > 0) {
        expenses.push({ account, amount })
      }
    }
  }

  const totalExpenses = parseFloat(
    expenses.reduce((s, e) => s + e.amount, 0).toFixed(2)
  )
  return { periodStart: start, periodEnd: end, expenses, totalExpenses }
}

export async function fetchXeroExpenses(
  accessToken: string,
  tenantId: string,
  start: string,
  end: string
): Promise<XeroExpenseData> {
  const params = new URLSearchParams({ fromDate: start, toDate: end })
  const res = await fetch(
    `${XERO_API_BASE}/api.xro/2.0/Reports/ProfitAndLoss?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': tenantId,
        Accept: 'application/json',
      },
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Xero P&L report failed ${res.status}: ${text}`)
  }
  const json = (await res.json()) as XeroReportResponse
  return parseExpenses(json, start, end)
}
