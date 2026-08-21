import { useState, useRef } from 'react'
import './BookCover.css'

type Props = {
  title: string
  coverUrl: string
  editable?: boolean
  onSelecionarArquivo?: (file: File) => void
}

export function BookCover({ title, coverUrl, editable = false, onSelecionarArquivo }: Props) {
  const [capaValida, setCapaValida] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (e.currentTarget.naturalWidth <= 1) {
      setCapaValida(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && onSelecionarArquivo) {
      onSelecionarArquivo(file)
    }
  }

  const mostrarPlaceholder = !coverUrl || !capaValida

  return (
    <div className="book-cover-wrapper">
      {mostrarPlaceholder ? (
        <div className="book-cover-placeholder">
          <span>{title.charAt(0).toUpperCase()}</span>
        </div>
      ) : (
        <img
          src={coverUrl}
          alt={title}
          className="book-cover-image"
          onLoad={handleLoad}
          onError={() => setCapaValida(false)}
        />
      )}

      {editable && mostrarPlaceholder && (
        <>
          <button
            type="button"
            className="book-cover-upload-link"
            onClick={() => inputRef.current?.click()}
          >
            Adicionar capa
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  )
}