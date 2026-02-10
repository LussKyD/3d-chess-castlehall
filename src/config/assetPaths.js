export function assetUrl(relativePath) {
  const normalized = relativePath.replace(/^\/+/, '')
  const base = import.meta?.env?.BASE_URL ?? '/'
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return new URL(normalized, base).toString()
  }
  const withSlash = base.endsWith('/') ? base : `${base}/`
  return `${withSlash}${normalized}`
}
