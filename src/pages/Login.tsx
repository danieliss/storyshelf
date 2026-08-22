import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { AppHeader } from '../components/AppHeader'
import './Login.css'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [atualizandoTodos, setAtualizandoTodos] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErro('Email ou senha inválidos.')
    } else {
      setErro('')
      navigate('/estante')
    }
  }

  return (
    <>
      <AppHeader />
      <div className="login-page">
        <h1>Entrar</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {erro && <p className="erro">{erro}</p>}

        <button onClick={handleLogin}>Entrar</button>

        <p>
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </>
  )
}