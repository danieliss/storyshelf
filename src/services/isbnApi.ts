import { normalizarGenero } from '../utils/genre'
import { ehEditoraConhecida } from '../utils/editorasConhecidas'

type MetadadosComplementares = {
  genre: string | null
  synopsis: string | null
  format: string | null
}

async function fetchComRetentativa(url: string, tentativas = 2): Promise<Response> {
  for (let i = 0; i < tentativas; i++) {
    const response = await fetch(url)
    if (response.ok || response.status !== 503) {
      return response
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return fetch(url)
}

export async function buscarLivroPorIsbn(isbnDigitado: string) {
  const isbn = isbnDigitado.replace(/\D/g, '')

  let resultado =
    (await buscarPorBrasilApi(isbn)) ||
    (await buscarPorGoogleBooksIsbn(isbn)) ||
    (await buscarPorOpenLibrary(isbn))

  if (!resultado) return null

  if (!resultado.genre || !resultado.synopsis || !resultado.format) {
    const complementar = await buscarMetadadosComplementares(isbn)
    resultado.genre = resultado.genre ?? complementar.genre
    resultado.synopsis = resultado.synopsis ?? complementar.synopsis
    resultado.format = resultado.format ?? complementar.format
  }

  resultado.genre = normalizarGenero(resultado.genre)
  resultado.synopsis = resultado.synopsis ?? 'Sinopse não disponível.'
  resultado.format = resultado.format ?? 'Físico'

  return resultado
}

async function buscarMetadadosComplementares(isbn: string): Promise<MetadadosComplementares> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetchComRetentativa(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
  )
  if (!response.ok) return { genre: null, synopsis: null, format: null }

  const data = await response.json()
  if (!data.items || data.items.length === 0) return { genre: null, synopsis: null, format: null }

  const item = data.items[0]
  const info = item.volumeInfo
  const isEbook = item.saleInfo?.isEbook === true

  return {
    genre: info.categories?.[0] ?? null,
    synopsis: info.description ?? null,
    format: isEbook ? 'Digital' : null,
  }
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
    genre: null as string | null,
    synopsis: null as string | null,
    format: null as string | null,
  }
}

async function buscarPorGoogleBooksIsbn(isbn: string) {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetchComRetentativa(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
  )
  if (!response.ok) return null

  const data = await response.json()
  if (!data.items || data.items.length === 0) return null

  const item = data.items[0]
  const info = item.volumeInfo
  const isEbook = item.saleInfo?.isEbook === true

  return {
    title: info.title ?? 'Título não encontrado',
    author: info.authors?.[0] ?? 'Autor desconhecido',
    publisher: info.publisher ?? 'Editora desconhecida',
    cover_url: info.imageLinks?.thumbnail ?? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
    genre: info.categories?.[0] ?? null,
    synopsis: info.description ?? null,
    format: isEbook ? 'Digital' : null,
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

  const formatoBruto = (livro.physical_format ?? '').toLowerCase()
  const formato = /kindle|ebook|digital/.test(formatoBruto) ? 'Digital' : null

  const sinopseBruta = livro.notes ?? livro.excerpts?.[0]?.text ?? null

  return {
    title: livro.title ?? 'Título não encontrado',
    author: livro.authors?.[0]?.name ?? 'Autor desconhecido',
    publisher: livro.publishers?.[0]?.name ?? 'Editora desconhecida',
    cover_url: livro.cover?.medium ?? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
    genre: livro.subjects?.[0]?.name ?? null,
    synopsis: typeof sinopseBruta === 'string' ? sinopseBruta : null,
    format: formato,
  }
}

export type ResultadoBusca = {
  isbn: string
  title: string
  author: string
  publisher: string
  cover_url: string
  genre: string | null
  synopsis: string | null
  format: string | null
}

async function buscarPorEditoraGoogleBooks(termo: string): Promise<ResultadoBusca[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetchComRetentativa(
    `https://www.googleapis.com/books/v1/volumes?q=inpublisher:${encodeURIComponent(termo)}&maxResults=10&key=${apiKey}`
  )
  if (!response.ok) return []

  const data = await response.json()
  if (!data.items) return []

  return data.items
    .map((item: any) => {
      const info = item.volumeInfo
      const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')
      const isbn10 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')
      const isEbook = item.saleInfo?.isEbook === true

      return {
        isbn: isbn13?.identifier ?? isbn10?.identifier ?? '',
        title: info.title ?? 'Título não encontrado',
        author: info.authors?.[0] ?? 'Autor desconhecido',
        publisher: info.publisher ?? 'Editora desconhecida',
        cover_url: info.imageLinks?.thumbnail ?? '',
        genre: normalizarGenero(info.categories?.[0] ?? null),
        synopsis: info.description ?? 'Sinopse não disponível.',
        format: isEbook ? 'Digital' : 'Físico',
      }
    })
    .filter((livro: ResultadoBusca) => livro.isbn !== '')
}

function mapearItemGoogleBooks(item: any): ResultadoBusca {
  const info = item.volumeInfo
  const isbn13 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')
  const isbn10 = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_10')
  const isEbook = item.saleInfo?.isEbook === true

  return {
    isbn: isbn13?.identifier ?? isbn10?.identifier ?? '',
    title: info.title ?? 'Título não encontrado',
    author: info.authors?.[0] ?? 'Autor desconhecido',
    publisher: info.publisher ?? 'Editora desconhecida',
    cover_url: info.imageLinks?.thumbnail ?? '',
    genre: normalizarGenero(info.categories?.[0] ?? null),
    synopsis: info.description ?? 'Sinopse não disponível.',
    format: isEbook ? 'Digital' : 'Físico',
  }
}

async function buscarComQuery(query: string, maxResults = 10): Promise<ResultadoBusca[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetchComRetentativa(
    `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=${maxResults}&orderBy=relevance&key=${apiKey}`
  )
  if (!response.ok) return []

  const data = await response.json()
  if (!data.items) return []

  return data.items.map(mapearItemGoogleBooks).filter((livro: ResultadoBusca) => livro.isbn !== '')
}

function pareceAutorFicticio(livro: ResultadoBusca): boolean {
  const autor = livro.author.toLowerCase().trim()
  const editora = livro.publisher.toLowerCase().trim()

  if (!autor || !editora) return false

  return autor === editora || editora.includes(autor) || autor.includes(editora)
}




type ResultadoComPopularidade = {
  livro: ResultadoBusca
  ratingsCount: number
}

async function buscarComQueryEPopularidade(
  query: string,
  maxResults = 10
): Promise<ResultadoComPopularidade[]> {
  const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

  const response = await fetchComRetentativa(
    `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=${maxResults}&orderBy=relevance&key=${apiKey}`
  )
  if (!response.ok) return []

  const data = await response.json()
  if (!data.items) return []

  return data.items
    .map((item: any) => ({
      livro: mapearItemGoogleBooks(item),
      ratingsCount: item.volumeInfo?.ratingsCount ?? 0,
    }))
    .filter((r: ResultadoComPopularidade) => r.livro.isbn !== '')
}

export async function buscarLivrosPorTexto(termo: string): Promise<ResultadoBusca[]> {
  const termoCodificado = encodeURIComponent(termo)

  const [porAutorBruto, porTitulo, geral] = await Promise.all([
    buscarComQueryEPopularidade(`inauthor:${termoCodificado}`),
    buscarComQueryEPopularidade(`intitle:${termoCodificado}`),
    buscarComQueryEPopularidade(termoCodificado),
  ])

  const porAutor = porAutorBruto.filter((r) => !pareceAutorFicticio(r.livro))

  const listasComPeso: Array<{ lista: ResultadoComPopularidade[]; peso: number }> = [
    { lista: porTitulo, peso: 0 },
    { lista: geral, peso: 5 },
    { lista: porAutor, peso: 50 },
  ]

  const melhorScore = new Map<string, number>()
  const livroPorIsbn = new Map<string, ResultadoBusca>()

  for (const { lista, peso } of listasComPeso) {
    lista.forEach(({ livro, ratingsCount }, index) => {
      if (!livro.isbn) return

      const bonusPopularidade = Math.min(ratingsCount, 500) * 0.05
      const bonusEditora = ehEditoraConhecida(livro.publisher) ? 3 : 0
      const score = index + peso - bonusPopularidade - bonusEditora

      livroPorIsbn.set(livro.isbn, livro)

      const atual = melhorScore.get(livro.isbn)
      if (atual === undefined || score < atual) {
        melhorScore.set(livro.isbn, score)
      }
    })
  }

  const combinados = Array.from(melhorScore.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([isbn]) => livroPorIsbn.get(isbn)!)

  if (combinados.length > 0) {
    return combinados.slice(0, 15)
  }

  return await buscarPorEditoraGoogleBooks(termo)
}