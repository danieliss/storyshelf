async function buscarEntidadeAutor(nomeAutor: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(nomeAutor)}&language=en&format=json&origin=*&type=item`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  return data.search?.[0]?.id ?? null
}

async function buscarPaisEntidade(entidadeId: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entidadeId}&props=claims&format=json&origin=*`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  const claims = data.entities?.[entidadeId]?.claims
  // P27 é o código da propriedade "país de cidadania" na Wikidata
  return claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id ?? null
}

async function buscarNomePais(paisId: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${paisId}&props=labels&languages=pt&format=json&origin=*`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  return data.entities?.[paisId]?.labels?.pt?.value ?? null
}

export async function buscarOrigemAutor(nomeAutor: string): Promise<string | null> {
  try {
    const entidadeId = await buscarEntidadeAutor(nomeAutor)
    if (!entidadeId) return null

    const paisId = await buscarPaisEntidade(entidadeId)
    if (!paisId) return null

    return await buscarNomePais(paisId)
  } catch {
    return null
  }
}