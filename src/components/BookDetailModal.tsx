import type { Book } from '../types/book'
import { FlagIcon } from './FlagIcon'
import { BookCover } from './BookCover'
import { linkBuscaAmazon, linkBuscaEstanteVirtual, confirmarEAbrirLink } from '../utils/marketplaces'
import './BookDetailModal.css'

type Props = {
  livro: Book
  onFechar: () => void
  onAtualizar?: () => void
  atualizando?: boolean
  editavel?: boolean
}

export function BookDetailModal({ livro, onFechar, onAtualizar, atualizando, editavel }: Props) {
  const termoBusca = `${livro.title} ${livro.author}`

  const faltaAlgumDado =
    !livro.genre ||
    livro.genre === 'Não classificado' ||
    !livro.author_origin ||
    livro.author_origin === 'Origem desconhecida' ||
    !livro.synopsis ||
    livro.synopsis === 'Sinopse não disponível.'

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

        <div className="modal-sinopse">
          <h3>Sinopse</h3>
          <p>{livro.synopsis || 'Sinopse não disponível.'}</p>
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