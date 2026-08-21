import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import type { Book } from '../types/book'
import { BookCover } from '../components/BookCover'
import { AppHeader } from '../components/AppHeader'
import { LibraryStats } from '../components/LibraryStats'
import { bandeiraDoCodigoPais } from '../utils/flag'
import './EstantePublica.css'

export function EstantePublica() {
  const [livros, setLivros] = useState<Book[]>([])
  const [busca, setBusca] = useState('')
  const [nacionalidadeFiltro, setNacionalidadeFiltro] = useState('')
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false)
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

  const nacionalidadesDisponiveis = Array.from(
    new Set(livros.map((l) => l.author_origin).filter(Boolean))
  ).sort()

  const livrosFiltrados = livros.filter((livro) => {
    const termo = busca.toLowerCase()
    const combinaTexto =
      livro.title.toLowerCase().includes(termo) ||
      livro.author.toLowerCase().includes(termo) ||
      livro.publisher?.toLowerCase().includes(termo)

    const combinaNacionalidade =
      !nacionalidadeFiltro || livro.author_origin === nacionalidadeFiltro

    return combinaTexto && combinaNacionalidade
  })

  return (
    <>
      <AppHeader showNav />
      <div className="estante-publica-page">
        <h1>Estante Pública</h1>

        <button
          className="botao-estatisticas"
          onClick={() => setMostrarEstatisticas(!mostrarEstatisticas)}
        >
          {mostrarEstatisticas ? 'Ocultar estatísticas' : '📊 Ver estatísticas da comunidade'}
        </button>

        {mostrarEstatisticas && (
          <LibraryStats livros={livros} titulo="Biblioteca da comunidade StoryShelf" />
        )}

        <input
          type="text"
          placeholder="Buscar por título, autor ou editora..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="busca-input"
        />

        <select
          className="filtro-nacionalidade"
          value={nacionalidadeFiltro}
          onChange={(e) => setNacionalidadeFiltro(e.target.value)}
        >
          <option value="">Todas as nacionalidades</option>
          {nacionalidadesDisponiveis.map((nacionalidade) => (
            <option key={nacionalidade} value={nacionalidade}>
              {nacionalidade}
            </option>
          ))}
        </select>

        {erro && <p className="erro">{erro}</p>}

        {livrosFiltrados.length === 0 && !erro && (
          <p className="vazio">Nenhum livro encontrado.</p>
        )}

        <div className="lista-livros">
          {livrosFiltrados.map((livro) => (
            <div key={livro.id} className="livro-card" data-testid={`livro-publico-${livro.isbn}`}>
              <BookCover title={livro.title} coverUrl={livro.cover_url} />
              <div>
                <h3>{livro.title}</h3>
                <p>{livro.author}</p>
                <p className="editora">{livro.publisher}</p>
                <p className="origem">
                  {livro.author_origin_code && (
                    <span className="bandeira-inline">
                      {bandeiraDoCodigoPais(livro.author_origin_code)}
                    </span>
                  )}
                  {livro.author_origin}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}