import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { buscarLivroPorIsbn } from '../services/isbnApi'
import type { Book } from '../types/book'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import './MinhaEstante.css'

export function MinhaEstante() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [livros, setLivros] = useState<Book[]>([])
  const [isbn, setIsbn] = useState('')
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

  async function handleAdicionarLivro() {
    setErro('')
    setCarregando(true)

    const resultado = await buscarLivroPorIsbn(isbn)

    if (!resultado) {
      setErro('ISBN não encontrado.')
      setCarregando(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if (!userId) {
      setErro('Você precisa estar logado para adicionar um livro.')
      setCarregando(false)
      return
    }

    const { error } = await supabase.from('books').insert({
      user_id: userId,
      isbn,
      title: resultado.title,
      author: resultado.author,
      cover_url: resultado.cover_url,
    })

    if (error) {
      setErro('Erro ao salvar livro.')
    } else {
      setIsbn('')
      carregarLivros()
    }

    setCarregando(false)
  }

  async function handleRemoverLivro(id: string) {
    const { error } = await supabase.from('books').delete().eq('id', id)

    if (!error) {
      carregarLivros()
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  <div className="estante-header">
  <h1>Minha Estante</h1>
  <div style={{ display: 'flex', gap: '8px' }}>
    <Link to="/estante-publica">Ver estante pública</Link>
    <button onClick={handleLogout}>Sair</button>
  </div>
</div>

  return (
    <div className="estante-page">
      <div className="estante-header">
        <h1>Minha Estante</h1>
        <button onClick={handleLogout}>Sair</button>
      </div>

      <div className="adicionar-livro">
        <input
          type="text"
          placeholder="Digite o ISBN"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
        />
        <button onClick={handleAdicionarLivro} disabled={carregando}>
          {carregando ? 'Buscando...' : 'Adicionar'}
        </button>
      </div>

      {erro && <p className="erro">{erro}</p>}

      <div className="lista-livros">
        {livros.map((livro) => (
          <div key={livro.id} className="livro-card">
            {livro.cover_url && <img src={livro.cover_url} alt={livro.title} />}
            <div>
              <h3>{livro.title}</h3>
              <p>{livro.author}</p>
              <button onClick={() => handleRemoverLivro(livro.id)}>Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}