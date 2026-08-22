import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import type { Book } from '../types/book'
import { BookCover } from '../components/BookCover'
import { AppHeader } from '../components/AppHeader'
import { LibraryStats } from '../components/LibraryStats'
import { FlagIcon } from '../components/FlagIcon'
import { BookDetailModal } from '../components/BookDetailModal'
import './EstantePublica.css'

export function EstantePublica() {
  const [livros, setLivros] = useState<Book[]>([])
  const [busca, setBusca] = useState('')
  const [generoFiltro, setGeneroFiltro] = useState('')
  const [paisFiltro, setPaisFiltro] = useState('')
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false)
  const [erro, setErro] = useState('')
  const [livroSelecionado, setLivroSelecionado] = useState<Book | null>(null)

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

  const generosDisponiveis = Array.from(new Set(livros.map((l) => l.genre).filter(Boolean))).sort()
  const paisesDisponiveis = Array.from(
    new Set(livros.map((l) => l.author_origin).filter(Boolean))
  ).sort()

  const livrosFiltrados = livros.filter((livro) => {
    const termo = busca.toLowerCase()
    const combinaTexto =
      livro.title.toLowerCase().includes(termo) ||
      livro.author.toLowerCase().includes(termo) ||
      livro.publisher?.toLowerCase().includes(termo)

    const combinaGenero = !generoFiltro || livro.genre === generoFiltro
    const combinaPais = !paisFiltro || livro.author_origin === paisFiltro

    return combinaTexto && combinaGenero && combinaPais
  })

  function handleGeneroClickStats(genero: string) {
    setGeneroFiltro(generoFiltro === genero ? '' : genero)
  }

  function handleOrigemClickStats(origem: string) {
    setPaisFiltro(paisFiltro === origem ? '' : origem)
  }

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
          <LibraryStats
            livros={livros}
            titulo="Biblioteca da comunidade StoryShelf"
            generoSelecionado={generoFiltro}
            origemSelecionada={paisFiltro}
            onGeneroClick={handleGeneroClickStats}
            onOrigemClick={handleOrigemClickStats}
          />
        )}

        <input
          type="text"
          placeholder="Buscar por título, autor ou editora..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="busca-input"
        />

        <div className="filtros-lista">
          <select value={generoFiltro} onChange={(e) => setGeneroFiltro(e.target.value)}>
            <option value="">Todos os gêneros</option>
            {generosDisponiveis.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select value={paisFiltro} onChange={(e) => setPaisFiltro(e.target.value)}>
            <option value="">Todas as nacionalidades</option>
            {paisesDisponiveis.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {(generoFiltro || paisFiltro) && (
            <button
              className="botao-limpar-filtro"
              onClick={() => {
                setGeneroFiltro('')
                setPaisFiltro('')
              }}
            >
              ✕ Limpar filtros
            </button>
          )}
        </div>

        {erro && <p className="erro">{erro}</p>}

        {livrosFiltrados.length === 0 && !erro && (
          <p className="vazio">Nenhum livro encontrado.</p>
        )}

        <div className="lista-livros">
          {livrosFiltrados.map((livro) => (
            <div
              key={livro.id}
              className="livro-card livro-card-clicavel"
              data-testid={`livro-publico-${livro.isbn}`}
              onClick={() => setLivroSelecionado(livro)}
            >
              <BookCover title={livro.title} coverUrl={livro.cover_url} />
              <div>
                <h3>{livro.title}</h3>
                <p>{livro.author}</p>
                <p className="editora">{livro.publisher}</p>
                <p className="origem">
                  <span className="bandeira-inline">
                    <FlagIcon codigoPais={livro.author_origin_code} />
                  </span>
                  {livro.author_origin}
                </p>
                <p className="genero-tag">{livro.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {livroSelecionado && (
        <BookDetailModal livro={livroSelecionado} onFechar={() => setLivroSelecionado(null)} />
      )}
    </>
  )
}