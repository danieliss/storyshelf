// src/services/authorOrigin.ts

async function buscarCandidatosEntidade(nomeAutor: string, idioma: string): Promise<string[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(nomeAutor)}&language=${idioma}&format=json&origin=*&type=item&limit=5`

  const response = await fetch(url)
  if (!response.ok) return []

  const data = await response.json()
  return (data.search ?? []).map((item: any) => item.id)
}

async function ehPessoa(entidadeId: string, claims: any): Promise<boolean> {
  const instanciaDe = claims?.P31 ?? []
  return instanciaDe.some((c: any) => c.mainsnak?.datavalue?.value?.id === 'Q5')
}

async function buscarClaims(entidadeId: string): Promise<any> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entidadeId}&props=claims&format=json&origin=*`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  return data.entities?.[entidadeId]?.claims ?? null
}

async function buscarNomePais(paisId: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${paisId}&props=labels&languages=pt&format=json&origin=*`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  return data.entities?.[paisId]?.labels?.pt?.value ?? null
}

async function tentarEncontrarPais(nomeAutor: string, idioma: string): Promise<string | null> {
  const candidatos = await buscarCandidatosEntidade(nomeAutor, idioma)

  for (const entidadeId of candidatos) {
    const claims = await buscarClaims(entidadeId)
    if (!claims) continue

    const eHumano = await ehPessoa(entidadeId, claims)
    if (!eHumano) continue

    const paisId = claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id
    if (!paisId) continue

    return await buscarNomePais(paisId)
  }

  return null
}

export async function buscarOrigemAutor(nomeAutor: string): Promise<string | null> {
  try {
    const resultadoEm = await tentarEncontrarPais(nomeAutor, 'en')
    if (resultadoEm) return resultadoEm

    const resultadoPt = await tentarEncontrarPais(nomeAutor, 'pt')
    if (resultadoPt) return resultadoPt

    return null
  } catch {
    return null
  }
}