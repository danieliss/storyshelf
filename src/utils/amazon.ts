// src/utils/amazon.ts
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