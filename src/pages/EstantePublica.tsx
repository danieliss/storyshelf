import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import type { Book } from '../types/book'
import './EstantePublica.css'

export function EstantePublica() {
  const [livros, setLivros] = useState<Book[]>([])
  const [busca, setBusca] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    carregarLivros()
  }, [])

  async function carregarLivros() {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setErro('Erro ao carregar a estante pública.')
    } else {
      setLivros(data as Book[])
    }
  }

  const livrosFiltrados = livros.filter((livro) => {
    const termo = busca.toLowerCase()
    return (
      livro.title.toLowerCase().includes(termo) ||
      livro.author.toLowerCase().includes(termo) ||
      livro.publisher?.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="estante-publica-page">
      <h1>Estante Pública</h1>

      <input
        type="text"
        placeholder="Buscar por título, autor ou editora..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        className="busca-input"
      />

      {erro && <p className="erro">{erro}</p>}

      {livrosFiltrados.length === 0 && !erro && (
        <p className="vazio">Nenhum livro encontrado.</p>
      )}

      <div className="lista-livros">
        {livrosFiltrados.map((livro) => (
          <div key={livro.id} className="livro-card">
            {livro.cover_url && <img src={livro.cover_url} alt={livro.title} />}
            <div>
              <h3>{livro.title}</h3>
              <p>{livro.author}</p>
              <p className="editora">{livro.publisher}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}