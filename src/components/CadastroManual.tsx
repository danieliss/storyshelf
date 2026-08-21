// src/components/CadastroManual.tsx
import { useState } from 'react'

type Props = {
  isbnOuAsin: string
  onSalvar: (dados: {
    title: string
    author: string
    genre: string
    purchase_url: string
  }) => void
  onCancelar: () => void
}

export function CadastroManual({ isbnOuAsin, onSalvar, onCancelar }: Props) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genre, setGenre] = useState('')
  const [purchaseUrl, setPurchaseUrl] = useState('')

  function handleSalvar() {
    if (!title.trim() || !author.trim()) return
    onSalvar({ title, author, genre, purchase_url: purchaseUrl })
  }

  return (
    <div className="cadastro-manual">
      <p>Não encontramos esse livro automaticamente. Cadastre manualmente:</p>
      <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Autor" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <input placeholder="Gênero (opcional)" value={genre} onChange={(e) => setGenre(e.target.value)} />
      <input
        placeholder="Link de compra (opcional, ex: Amazon)"
        value={purchaseUrl}
        onChange={(e) => setPurchaseUrl(e.target.value)}
      />
      <div>
        <button onClick={handleSalvar}>Salvar</button>
        <button onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  )
}