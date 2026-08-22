import type { Book } from '../types/book'
import { FlagIcon } from './FlagIcon'
import './LibraryStats.css'

type Props = {
  livros: Book[]
  titulo: string
  generoSelecionado?: string
  origemSelecionada?: string
  onGeneroClick?: (genero: string) => void
  onOrigemClick?: (origem: string) => void
}

function contarPor(livros: Book[], campo: 'genre' | 'author_origin') {
  const contagem: Record<string, number> = {}

  for (const livro of livros) {
    const valor =
      livro[campo] || (campo === 'genre' ? 'Gênero não identificado' : 'Nacionalidade não identificada')
    contagem[valor] = (contagem[valor] ?? 0) + 1
  }

  return Object.entries(contagem).sort((a, b) => b[1] - a[1])
}

function codigoDoPais(livros: Book[], nomePais: string): string | null {
  const encontrado = livros.find((l) => l.author_origin === nomePais)
  return encontrado?.author_origin_code ?? null
}

export function LibraryStats({
  livros,
  titulo,
  generoSelecionado,
  origemSelecionada,
  onGeneroClick,
  onOrigemClick,
}: Props) {
  const total = livros.length
  const porGenero = contarPor(livros, 'genre')
  const porOrigem = contarPor(livros, 'author_origin')

  if (total === 0) {
    return (
      <div className="stats-container">
        <h2>{titulo}</h2>
        <p className="stats-vazio">Nenhum livro cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="stats-container">
      <h2>{titulo}</h2>
      <p className="stats-total">{total} {total === 1 ? 'livro' : 'livros'} no total</p>
      <p className="stats-dica">Clique em uma barra para filtrar a lista abaixo</p>

      <div className="stats-secao">
        <h3>Por gênero</h3>
        {porGenero.map(([genero, quantidade]) => (
          <button
            key={genero}
            className={`stats-linha ${generoSelecionado === genero ? 'stats-selecionada' : ''}`}
            onClick={() => onGeneroClick?.(genero)}
            type="button"
          >
            <span className="stats-label">{genero}</span>
            <div className="stats-barra-fundo">
              <div
                className="stats-barra"
                style={{ width: `${(quantidade / total) * 100}%` }}
              />
            </div>
            <span className="stats-quantidade">{quantidade}</span>
          </button>
        ))}
      </div>

      <div className="stats-secao">
        <h3>Por origem do autor</h3>
        {porOrigem.map(([origem, quantidade]) => (
          <button
            key={origem}
            className={`stats-linha ${origemSelecionada === origem ? 'stats-selecionada' : ''}`}
            onClick={() => onOrigemClick?.(origem)}
            type="button"
          >
            <span className="stats-label">
              {origem !== 'Nacionalidade não identificada' && (
                <span className="stats-bandeira">
                  <FlagIcon codigoPais={codigoDoPais(livros, origem)} />
                </span>
              )}
              {origem}
            </span>
            <div className="stats-barra-fundo">
              <div
                className="stats-barra"
                style={{ width: `${(quantidade / total) * 100}%` }}
              />
            </div>
            <span className="stats-quantidade">{quantidade}</span>
          </button>
        ))}
      </div>
    </div>
  )
}