// src/utils/genre.ts (atualize só o array de mapeamento, mantendo o resto do arquivo igual)
const mapeamento: Array<{ palavras: string[]; categoria: string }> = [
    // Sub-gêneros específicos primeiro
    { palavras: ['erotica'], categoria: 'Romance Erótico' },
    { palavras: ['historical romance', 'romance / historical'], categoria: 'Romance de Época' },
    { palavras: ['romance'], categoria: 'Romance' },
    { palavras: ['thriller', 'suspense'], categoria: 'Suspense' },
    { palavras: ['mystery', 'detective'], categoria: 'Mistério' },
    { palavras: ['horror'], categoria: 'Terror' },
    { palavras: ['fantasy'], categoria: 'Fantasia' },
    { palavras: ['science fiction', 'sci-fi'], categoria: 'Ficção Científica' },
    { palavras: ['juvenile', "children's"], categoria: 'Infantojuvenil' },
    { palavras: ['comics', 'graphic novels'], categoria: 'Quadrinhos' },
    { palavras: ['drama', 'performing arts'], categoria: 'Drama e Teatro' },
  
    // Genéricos depois
    { palavras: ['fiction', 'novel'], categoria: 'Ficção' },
    { palavras: ['biography', 'autobiography'], categoria: 'Biografia' },
    { palavras: ['poetry'], categoria: 'Poesia' },
    { palavras: ['history'], categoria: 'História' },
    { palavras: ['science'], categoria: 'Ciência' },
    { palavras: ['business', 'economics'], categoria: 'Negócios e Economia' },
    { palavras: ['computers', 'technology'], categoria: 'Tecnologia' },
    { palavras: ['religion'], categoria: 'Religião' },
    { palavras: ['philosophy'], categoria: 'Filosofia' },
    { palavras: ['art'], categoria: 'Arte' },
    { palavras: ['self-help'], categoria: 'Autoajuda' },
    { palavras: ['cooking', 'food'], categoria: 'Culinária' },
    { palavras: ['travel'], categoria: 'Viagem' },
    { palavras: ['health', 'fitness'], categoria: 'Saúde e Bem-estar' },
    { palavras: ['education'], categoria: 'Educação' },
    { palavras: ['psychology'], categoria: 'Psicologia' },
    { palavras: ['law'], categoria: 'Direito' },
  ]
  
  export function normalizarGenero(bruto: string | null): string {
    if (!bruto) return 'Não classificado'
  
    const textoBusca = bruto.toLowerCase()
  
    for (const { palavras, categoria } of mapeamento) {
      if (palavras.some((p) => textoBusca.includes(p))) {
        return categoria
      }
    }
  
    return bruto
  }