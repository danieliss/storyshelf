export function pareceAsin(codigo: string): boolean {
  const limpo = codigo.trim().toUpperCase()
  return /^B[0-9A-Z]{9}$/.test(limpo)
}

export function linkProdutoAmazon(asin: string): string {
  return `https://www.amazon.com.br/dp/${asin.trim().toUpperCase()}`
}

export function linkBuscaAmazon(termo: string): string {
  return `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}`
}

export function confirmarEAbrirAmazon(url: string): void {
  const confirmado = window.confirm(
    'Você será redirecionado para a Amazon em uma nova aba. Deseja continuar?'
  )
  if (confirmado) {
    window.open(url, '_blank')
  }
}