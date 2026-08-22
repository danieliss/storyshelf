import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { buscarLivroPorIsbn, buscarLivrosPorTexto } from '../services/isbnApi'
import type { ResultadoBusca } from '../services/isbnApi'
import { uploadCapaPersonalizada } from '../services/coverUpload'
import { buscarOrigemAutor } from '../services/authorOrigin'
import { FlagIcon } from '../components/FlagIcon'
import type { Book } from '../types/book'
import { BookCover } from '../components/BookCover'
import { AppHeader } from '../components/AppHeader'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { LibraryStats } from '../components/LibraryStats'
import { BookDetailModal } from '../components/BookDetailModal'
import { pareceAsin, linkProdutoAmazon, confirmarEAbrirAmazon } from '../utils/amazon'
import './MinhaEstante.css'

export function MinhaEstante() {
  const [livros, setLivros] = useState<Book[]>([])
  const [modoBusca, setModoBusca] = useState<'isbn' | 'texto'>('isbn')

  const [isbn, setIsbn] = useState('')
  const [termoBusca, setTermoBusca] = useState('')
  const [resultadosBusca, setResultadosBusca] = useState<ResultadoBusca[]>([])
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [mostrarEstatisticas, setMostrarEstatisticas] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [atualizandoTodos, setAtualizandoTodos] = useState(false)

  const [generoFiltro, setGeneroFiltro] = useState('')
  const [paisFiltro, setPaisFiltro] = useState('')

  const [livroSelecionado, setLivroSelecionado] = useState<Book | null>(null)
  const [atualizandoModal, setAtualizandoModal] = useState(false)

  useEffect(() => {
    carregarLivros()
  }, [])

  async function carregarLivros() {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      setErro('Erro ao carregar livros.')
    } else {
      setLivros(data as Book[])
    }
  }

  async function salvarLivro(dados: {
    isbn: string
    title: string
    author: string
    publisher: string
    cover_url: string
    genre: string | null
    synopsis: string | null
    format: string | null
  }) {
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      setErro('Você precisa estar logado para adicionar um livro.')
      return false
    }

    const origemAutor = await buscarOrigemAutor(dados.author)

    const { error } = await supabase.from('books').insert({
      user_id: userId,
      ...dados,
      genre: dados.genre ?? 'Não classificado',
      author_origin: origemAutor.pais ?? 'Origem desconhecida',
      author_origin_code: origemAutor.codigoPais,
    })

    if (error) {
      setErro('Erro ao salvar livro.')
      return false
    }

    carregarLivros()
    return true
  }

  async function handleAdicionarPorIsbn() {
    if (pareceAsin(isbn)) {
      setErro('Isso parece ser um ASIN da Amazon (e-book exclusivo). Confirme abaixo se quer ver na Amazon, ou cadastre manualmente.')
      confirmarEAbrirAmazon(linkProdutoAmazon(isbn))
      return
    }

    const isbnLimpo = isbn.replace(/\D/g, '')

    if (!isbnLimpo) {
      setErro('Digite um ISBN válido (somente números).')
      return
    }

    setErro('')
    setCarregando(true)

    try {
      const resultado = await buscarLivroPorIsbn(isbnLimpo)

      if (!resultado) {
        setErro('ISBN não encontrado.')
        return
      }

      const sucesso = await salvarLivro({ isbn: isbnLimpo, ...resultado })
      if (sucesso) {
        setIsbn('')
      }
    } catch {
      setErro('Erro ao buscar o livro. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleBuscarPorTexto() {
    if (!termoBusca.trim()) {
      setErro('Digite um título ou autor antes de buscar.')
      return
    }

    setErro('')
    setCarregando(true)
    setResultadosBusca([])

    try {
      const resultados = await buscarLivrosPorTexto(termoBusca)

      if (resultados.length === 0) {
        setErro('Nenhum livro encontrado com esse termo.')
      } else {
        setResultadosBusca(resultados)
      }
    } catch {
      setErro('Erro ao buscar livros. Tente novamente em instantes.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleSelecionarResultado(resultado: ResultadoBusca) {
    const sucesso = await salvarLivro(resultado)
    if (sucesso) {
      setTermoBusca('')
      setResultadosBusca([])
    }
  }

  async function handleRemoverLivro(id: string) {
    const { error } = await supabase.from('books').delete().eq('id', id)

    if (!error) {
      carregarLivros()
      setLivroSelecionado(null)
    }
  }

  async function handleUploadCapa(livroId: string, file: File) {
    try {
      await uploadCapaPersonalizada(livroId, file)
      await carregarLivros()
    } catch {
      setErro('Erro ao enviar a imagem da capa.')
    }
  }

  async function handleAtualizarMetadados(livro: Book) {
    const resultado = await buscarLivroPorIsbn(livro.isbn)
    const origemAutor = await buscarOrigemAutor(livro.author)

    const atualizacao: Record<string, string | null> = {}

    if (resultado?.genre && (!livro.genre || livro.genre === 'Não classificado')) {
      atualizacao.genre = resultado.genre
    }
    if (resultado?.synopsis && (!livro.synopsis || livro.synopsis === 'Sinopse não disponível.')) {
      atualizacao.synopsis = resultado.synopsis
    }
    if (resultado?.format && !livro.format) {
      atualizacao.format = resultado.format
    }
    if (origemAutor.pais && (!livro.author_origin || livro.author_origin === 'Origem desconhecida')) {
      atualizacao.author_origin = origemAutor.pais
      atualizacao.author_origin_code = origemAutor.codigoPais
    }

    if (Object.keys(atualizacao).length === 0) return

    const { error } = await supabase.from('books').update(atualizacao).eq('id', livro.id)

    if (!error) {
      await carregarLivros()
    }
  }

  async function handleAtualizarModal(livro: Book) {
    setAtualizandoModal(true)
    await handleAtualizarMetadados(livro)

    const { data } = await supabase.from('books').select('*').eq('id', livro.id).single()
    if (data) setLivroSelecionado(data as Book)

    setAtualizandoModal(false)
  }

  async function handleAtualizarTodosPendentes() {
    const pendentes = livros.filter(
      (l) =>
        !l.genre ||
        l.genre === 'Não classificado' ||
        !l.author_origin ||
        l.author_origin === 'Origem desconhecida'
    )
    if (pendentes.length === 0) return

    setAtualizandoTodos(true)

    for (const livro of pendentes) {
      await handleAtualizarMetadados(livro)
      await new Promise((resolve) => setTimeout(resolve, 400))
    }

    await carregarLivros()
    setAtualizandoTodos(false)
  }

  const generosDisponiveis = Array.from(new Set(livros.map((l) => l.genre).filter(Boolean))).sort()
  const paisesDisponiveis = Array.from(
    new Set(livros.map((l) => l.author_origin).filter(Boolean))
  ).sort()

  const livrosExibidos = livros.filter((livro) => {
    const combinaGenero = !generoFiltro || livro.genre === generoFiltro
    const combinaPais = !paisFiltro || livro.author_origin === paisFiltro
    return combinaGenero && combinaPais
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
      <div className="estante-page">
        <h1>Minha Estante</h1>

        <button
          className="botao-estatisticas"
          onClick={() => setMostrarEstatisticas(!mostrarEstatisticas)}
        >
          {mostrarEstatisticas ? 'Ocultar estatísticas' : '📊 Ver estatísticas da minha biblioteca'}
        </button>

        {livros.some(
          (l) =>
            !l.genre ||
            l.genre === 'Não classificado' ||
            !l.author_origin ||
            l.author_origin === 'Origem desconhecida'
        ) && (
          <button
            className="botao-atualizar-lote"
            onClick={handleAtualizarTodosPendentes}
            disabled={atualizandoTodos}
          >
            {atualizandoTodos ? 'Atualizando dados...' : '🔄 Atualizar gênero e origem pendentes'}
          </button>
        )}

        {mostrarEstatisticas && (
          <LibraryStats
            livros={livros}
            titulo="Minha biblioteca pessoal"
            generoSelecionado={generoFiltro}
            origemSelecionada={paisFiltro}
            onGeneroClick={handleGeneroClickStats}
            onOrigemClick={handleOrigemClickStats}
          />
        )}

        <div className="filtros-lista">
          <select value={generoFiltro} onChange={(e) => setGeneroFiltro(e.target.value)}>
            <option value="">Todos os gêneros</option>
            {generosDisponiveis.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <select value={paisFiltro} onChange={(e) => setPaisFiltro(e.target.value)}>
            <option value="">Todos os países</option>
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

        <div className="modo-busca">
          <button
            className={modoBusca === 'isbn' ? 'ativo' : ''}
            onClick={() => setModoBusca('isbn')}
          >
            Buscar por ISBN
          </button>
          <button
            className={modoBusca === 'texto' ? 'ativo' : ''}
            onClick={() => setModoBusca('texto')}
          >
            Buscar por título ou autor
          </button>
        </div>

        {modoBusca === 'isbn' ? (
          <div className="adicionar-livro">
            <input
              type="text"
              placeholder="Digite o ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdicionarPorIsbn()}
            />
            <button onClick={handleAdicionarPorIsbn} disabled={carregando}>
              {carregando ? 'Buscando...' : 'Adicionar'}
            </button>
            <button type="button" onClick={() => setMostrarScanner(true)}>
              📷 Escanear
            </button>
          </div>
        ) : (
          <div className="adicionar-livro">
            <input
              type="text"
              placeholder="Digite o título ou autor"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarPorTexto()}
            />
            <button onClick={handleBuscarPorTexto} disabled={carregando}>
              {carregando ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        )}

        {erro && <p className="erro">{erro}</p>}

        {resultadosBusca.length > 0 && (
          <div className="resultados-busca">
            {resultadosBusca.map((resultado) => (
              <div
                key={resultado.isbn}
                className="resultado-item"
                onClick={() => handleSelecionarResultado(resultado)}
              >
                <BookCover title={resultado.title} coverUrl={resultado.cover_url} />
                <div>
                  <h4>{resultado.title}</h4>
                  <p>{resultado.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {livrosExibidos.length === 0 && livros.length > 0 && (
          <p className="vazio">Nenhum livro corresponde aos filtros selecionados.</p>
        )}

        <div className="lista-livros">
          {livrosExibidos.map((livro) => (
            <div
              key={livro.id}
              className="livro-card livro-card-clicavel"
              data-testid={`livro-${livro.isbn}`}
              onClick={() => setLivroSelecionado(livro)}
            >
              <BookCover
                title={livro.title}
                coverUrl={livro.cover_url}
                editable
                onSelecionarArquivo={(file) => handleUploadCapa(livro.id, file)}
              />
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
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoverLivro(livro.id)
                  }}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {mostrarScanner && (
        <BarcodeScanner
          onDetectado={(codigoDetectado) => {
            setIsbn(codigoDetectado)
            setMostrarScanner(false)
          }}
          onFechar={() => setMostrarScanner(false)}
        />
      )}

      {livroSelecionado && (
        <BookDetailModal
          livro={livroSelecionado}
          onFechar={() => setLivroSelecionado(null)}
          onAtualizar={() => handleAtualizarModal(livroSelecionado)}
          atualizando={atualizandoModal}
          editavel
        />
      )}
    </>
  )
}