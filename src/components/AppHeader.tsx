import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo-header.png'
import './AppHeader.css'

type Props = {
  showNav?: boolean
}

export function AppHeader({ showNav = false }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const naEstantePublica = location.pathname === '/estante-publica'

  return (
    <header className="app-header">
      <img src={logo} alt="StoryShelf" className="app-header-logo" />

      {showNav && (
        <nav className="app-header-nav">
          {naEstantePublica ? (
            <Link to="/estante">Minha estante</Link>
          ) : (
            <Link to="/estante-publica">Estante pública</Link>
          )}
          <button onClick={handleLogout} className="botao-sair">
            Sair
          </button>
        </nav>
      )}
    </header>
  )
}