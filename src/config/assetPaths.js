export function assetUrl(relativePath) {
  const normalized = relativePath.replace(/^\/+/, '')
  // Must use direct `import.meta.env.BASE_URL` so Vite can inline the built base path.
  const viteBase = import.meta.env.BASE_URL || '/'

  let base = viteBase
  // Fallback for GitHub Pages project sites if BASE_URL is root.
  if (base === '/' && typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')) {
    const [firstSegment] = window.location.pathname.split('/').filter(Boolean)
    if (firstSegment) {
      base = `/${firstSegment}/`
    }
  }

  if (base.startsWith('http://') || base.startsWith('https://')) {
    return new URL(normalized, base).toString()
  }
  const withSlash = base.endsWith('/') ? base : `${base}/`
  return `${withSlash}${normalized}`
}
