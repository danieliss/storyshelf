// src/services/isbnApi.ts
export async function buscarLivroPorIsbn(isbnDigitado: string) {
  const isbn = isbnDigitado.replace(/\D/g, '')

  const resultadoBrasilApi = await buscarPorBrasilApi(isbn)
  if (resultadoBrasilApi) {
    return resultadoBrasilApi
  }

  return await buscarPorGoogleBooksIsbn(isbn)
}

async function buscarPorBrasilApi(isbn: string) {
  const response = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbn}`)

  if (!response.ok) {
    return null
  }

  const livro = await response.json()
  const capa = livro.cover_url || `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`

  return {
    title: livro.title ?? 'Título não encontrado',
    author: livro.authors?.[0] ?? 'Autor desconhecido',
    publisher: livro.publisher ?? 'Editora desconhecida',
    cover_url: capa,
  }
}

async function buscarPorGoogleBooksIsbn(isbn: string) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    return null
  }

  const info = data.items[0].volumeInfo

  return {
    title: info.title ?? 'Título não encontrado',
    author: info.authors?.[0] ?? 'Autor desconhecido',
    publisher: info.publisher ?? 'Editora desconhecida',
    cover_url: info.imageLinks?.thumbnail ?? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
  }
}

export type ResultadoBusca = {
  isbn: string
  title: string
  author: string
  publisher: string
  cover_url: string
}

export async function buscarLivrosPorTexto(termo: string): Promise<ResultadoBusca[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(termo)}&maxResults=10&key=${apiKey}`
  )

  if (!response.ok) {
    throw new Error('Falha ao buscar livros. Tente novamente em instantes.')
  }

  const data = await response.json()

  if (!data.items) {
    return []
  }

  return data.items
    .map((item: any) => {
      const info = item.volumeInfo
      const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')
      const isbn10 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')

      return {
        isbn: isbn13?.identifier ?? isbn10?.identifier ?? '',
        title: info.title ?? 'Título não encontrado',
        author: info.authors?.[0] ?? 'Autor desconhecido',
        publisher: info.publisher ?? 'Editora desconhecida',
        cover_url: info.imageLinks?.thumbnail ?? '',
      }
    })
    .filter((livro: ResultadoBusca) => livro.isbn !== '')
}