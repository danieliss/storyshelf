import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { buscarLivroPorIsbn, buscarLivrosPorTexto } from '../services/isbnApi'
import type { ResultadoBusca } from '../services/isbnApi'
import { uploadCapaPersonalizada } from '../services/coverUpload'
import { buscarOrigemAutor } from '../services/authorOrigin'
import { bandeiraDoCodigoPais } from '../utils/flag'
import type { Book } from '../types/book'
import { BookCover } from '../components/BookCover'
import { AppHeader } from '../components/AppHeader'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { LibraryStats } from '../components/LibraryStats'
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
    if (!resultado) return

    const { error } = await supabase
      .from('books')
      .update({ genre: resultado.genre ?? 'Não classificado' })
      .eq('id', livro.id)

    if (!error) {
      carregarLivros()
    }
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

        {mostrarEstatisticas && (
          <LibraryStats livros={livros} titulo="Minha biblioteca pessoal" />
        )}

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

        <div className="lista-livros">
          {livros.map((livro) => (
            <div key={livro.id} className="livro-card" data-testid={`livro-${livro.isbn}`}>
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
                  {livro.author_origin_code && (
                    <span className="bandeira-inline">
                      {bandeiraDoCodigoPais(livro.author_origin_code)}
                    </span>
                  )}
                  {livro.author_origin}
                </p>
                {(!livro.genre || livro.genre === 'Não classificado') && (
                  <button
                    onClick={() => handleAtualizarMetadados(livro)}
                    className="botao-atualizar"
                  >
                    🔄 Buscar gênero
                  </button>
                )}
                <button onClick={() => handleRemoverLivro(livro.id)}>Remover</button>
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
    </>
  )
}