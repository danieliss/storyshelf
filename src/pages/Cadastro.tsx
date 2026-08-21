import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { AppHeader } from '../components/AppHeader'
import './Login.css'

export function Cadastro() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensagem, setMensagem] = useState('')
  const navigate = useNavigate()

  async function handleCadastro() {
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setMensagem('Erro ao cadastrar: ' + error.message)
    } else {
      setMensagem('Cadastro feito! Verifique seu email para confirmar.')
    }
  }

  return (
    <>
      <AppHeader />
      <div className="login-page">
        <h1>Criar conta</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha (mínimo 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mensagem && <p className="erro">{mensagem}</p>}

        <button onClick={handleCadastro}>Cadastrar</button>

        <p>
          Já tem conta? <Link to="/login">Fazer login</Link>
        </p>
      </div>
    </>
  )
}