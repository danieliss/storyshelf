import { useState, useEffect } from 'react'
import type { Book } from '../types/book'
import { FlagIcon } from './FlagIcon'
import { BookCover } from './BookCover'
import { buscarLivroPorIsbn } from '../services/isbnApi'
import { linkBuscaAmazon, linkBuscaEstanteVirtual, confirmarEAbrirLink } from '../utils/marketplaces'
import './BookDetailModal.css'

type Props = {
  livro: Book
  onFechar: () => void
  onAtualizar?: () => void
  atualizando?: boolean
  editavel?: boolean
  jaNaMinhaEstante?: boolean
  onAdicionarAMinhaEstante?: () => void
  adicionando?: boolean
}

export function BookDetailModal({
  livro,
  onFechar,
  onAtualizar,
  atualizando,
  editavel,
  jaNaMinhaEstante,
  onAdicionarAMinhaEstante,
  adicionando,
}: Props) {
  const termoBusca = `${livro.title} ${livro.author}`
  const [sinopseExibida, setSinopseExibida] = useState(livro.synopsis)
  const [buscandoSinopse, setBuscandoSinopse] = useState(false)

  useEffect(() => {
    setSinopseExibida(livro.synopsis)

    const faltaSinopse = !livro.synopsis || livro.synopsis === 'Sinopse não disponível.'
    if (!faltaSinopse) return

    let cancelado = false
    setBuscandoSinopse(true)

    buscarLivroPorIsbn(livro.isbn).then((resultado) => {
      if (!cancelado && resultado?.synopsis) {
        setSinopseExibida(resultado.synopsis)
      }
      if (!cancelado) setBuscandoSinopse(false)
    })

    return () => {
      cancelado = true
    }
  }, [livro.isbn, livro.synopsis])

  const faltaAlgumDado =
    !livro.genre ||
    livro.genre === 'Gênero não identificado' ||
    !livro.author_origin ||
    livro.author_origin === 'Nacionalidade não identificada'

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-conteudo" onClick={(e) => e.stopPropagation()}>
        <button className="modal-fechar" onClick={onFechar}>
          ✕
        </button>

        <div className="modal-topo">
          <BookCover title={livro.title} coverUrl={livro.cover_url} />
          <div className="modal-info-principal">
            <h2>{livro.title}</h2>
            <p className="modal-autor">{livro.author}</p>
            <p className="modal-editora">{livro.publisher}</p>
            <p className="modal-origem">
              <FlagIcon codigoPais={livro.author_origin_code} /> {livro.author_origin}
            </p>
            <div className="modal-tags">
              <span className="genero-tag">{livro.genre}</span>
              <span className="formato-tag">{livro.format || 'Físico'}</span>
            </div>
          </div>
        </div>

        {onAdicionarAMinhaEstante && !jaNaMinhaEstante && (
          <button
            className="botao-adicionar-estante"
            onClick={onAdicionarAMinhaEstante}
            disabled={adicionando}
          >
            {adicionando ? 'Adicionando...' : '➕ Adicionar à minha estante'}
          </button>
        )}

        {jaNaMinhaEstante && (
          <p className="ja-na-estante">✓ Este livro já está na sua estante</p>
        )}

        <div className="modal-sinopse">
          <h3>Sinopse</h3>
          {buscandoSinopse ? (
            <p className="sinopse-carregando">Buscando sinopse...</p>
          ) : (
            <p>{sinopseExibida || 'Sinopse não disponível.'}</p>
          )}
        </div>

        {editavel && faltaAlgumDado && onAtualizar && (
          <button className="botao-atualizar" onClick={onAtualizar} disabled={atualizando}>
            {atualizando ? 'Atualizando...' : '🔄 Buscar dados completos'}
          </button>
        )}

        <div className="modal-compra">
          <h3>Onde comprar</h3>
          {livro.purchase_url && (
            
              <a href={livro.purchase_url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-comprar-principal"
            >
              🛒 Ver na loja cadastrada
            </a>
          )}
          <button
            className="link-loja"
            onClick={() => confirmarEAbrirLink(linkBuscaAmazon(termoBusca), 'a Amazon')}
          >
            Buscar na Amazon
          </button>
          <button
            className="link-loja"
            onClick={() =>
              confirmarEAbrirLink(linkBuscaEstanteVirtual(termoBusca), 'a Estante Virtual')
            }
          >
            Buscar na Estante Virtual
          </button>
          <p className="modal-aviso-preco">
            Não fazemos comparação automática de preços — os links acima abrem uma busca pronta
            em cada loja para você comparar.
          </p>
        </div>
      </div>
    </div>
  )
}