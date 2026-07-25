// src/services/isbnApi.ts
export async function buscarLivroPorIsbn(isbnDigitado: string) {
  const isbn = isbnDigitado.replace(/\D/g, '')

  const response = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbn}`)

  if (!response.ok) {
    return null
  }

  const livro = await response.json()

  return {
    title: livro.title ?? 'Título não encontrado',
    author: livro.authors?.[0] ?? 'Autor desconhecido',
    cover_url: livro.cover_url ?? '',
  }
}