export type Book = {
  id: string
  user_id: string
  isbn: string
  title: string
  author: string
  author_origin: string
  author_origin_code: string | null
  genre: string
  publisher: string
  cover_url: string
  synopsis: string
  format: string
  purchase_url: string
  created_at: string
}