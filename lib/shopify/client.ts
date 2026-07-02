const SHOPIFY_API_VERSION = '2025-01'

function getConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  if (!domain || !token) {
    throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN env vars')
  }
  return { domain, token }
}

export async function shopifyGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const { domain, token } = getConfig()
  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  })

  if (!res.ok) {
    throw new Error(`Shopify GraphQL HTTP error ${res.status}: ${await res.text()}`)
  }

  const json = (await res.json()) as { data?: T; errors?: unknown[] }
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`)
  }
  return json.data as T
}
