import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type Props = {
  children: React.ReactNode
}

export function RotaProtegida({ children }: Props) {
  const { estaLogado, carregando } = useAuth()

  if (carregando) {
    return <p>Carregando...</p>
  }

  if (!estaLogado) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}