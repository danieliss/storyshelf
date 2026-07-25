// src/hooks/useAuth.ts
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCarregando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    await supabase.auth.signOut()
  }

  return { session, carregando, estaLogado: !!session, logout }
}