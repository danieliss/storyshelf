// src/services/isbnApi.ts

export async function buscarLivroPorIsbn(isbnDigitado: string) {
  const isbn = isbnDigitado.replace(/\D/g, '')

  const porBrasilApi = await buscarPorBrasilApi(isbn)
  if (porBrasilApi) return porBrasilApi

  const porGoogleBooks = await buscarPorGoogleBooksIsbn(isbn)
  if (porGoogleBooks) return porGoogleBooks

  return await buscarPorOpenLibrary(isbn)
}

async function buscarPorBrasilApi(isbn: string) {
  const response = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbn}`)
  if (!response.ok) return null

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
  if (!response.ok) return null

  const data = await response.json()
  if (!data.items || data.items.length === 0) return null

  const info = data.items[0].volumeInfo

  return {
    title: info.title ?? 'Título não encontrado',
    author: info.authors?.[0] ?? 'Autor desconhecido',
    publisher: info.publisher ?? 'Editora desconhecida',
    cover_url: info.imageLinks?.thumbnail ?? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
  }
}

async function buscarPorOpenLibrary(isbn: string) {
  const response = await fetch(
    `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
  )
  if (!response.ok) return null

  const data = await response.json()
  const livro = data[`ISBN:${isbn}`]
  if (!livro) return null

  return {
    title: livro.title ?? 'Título não encontrado',
    author: livro.authors?.[0]?.name ?? 'Autor desconhecido',
    publisher: livro.publishers?.[0]?.name ?? 'Editora desconhecida',
    cover_url: livro.cover?.medium ?? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
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
  if (!data.items) return []

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