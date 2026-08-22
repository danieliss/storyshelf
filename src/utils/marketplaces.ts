export function linkBuscaAmazon(termo: string): string {
    return `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}`
  }
  
  export function linkBuscaEstanteVirtual(termo: string): string {
    return `https://www.estantevirtual.com.br/busca?q=${encodeURIComponent(termo)}`
  }
  
  export function confirmarEAbrirLink(url: string, nomeLoja: string): void {
    const confirmado = window.confirm(
      `Você será redirecionado para ${nomeLoja} em uma nova aba. Deseja continuar?`
    )
    if (confirmado) {
      window.open(url, '_blank')
    }
  }