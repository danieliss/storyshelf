import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import { MinhaEstante } from './pages/MinhaEstante'
import { EstantePublica } from './pages/EstantePublica'
import { RotaProtegida } from './components/RotaProtegida'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route
          path="/estante"
          element={
            <RotaProtegida>
              <MinhaEstante />
            </RotaProtegida>
          }
        />
        <Route
          path="/estante-publica"
          element={
            <RotaProtegida>
              <EstantePublica />
            </RotaProtegida>
          }
        />
        <Route path="*" element={<h1>Página não encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App