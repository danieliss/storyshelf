type OrigemAutor = {
  pais: string | null
  codigoPais: string | null
}

async function buscarQidViaWikipedia(nomeAutor: string, idioma: string): Promise<string | null> {
  const url = `https://${idioma}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(nomeAutor)}&gsrlimit=1&prop=pageprops&format=json&origin=*`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  const pages = data.query?.pages
  if (!pages) return null

  const primeiraPagina = Object.values(pages)[0] as any
  return primeiraPagina?.pageprops?.wikibase_item ?? null
}

async function buscarQidViaWikidataSearch(nomeAutor: string, idioma: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(nomeAutor)}&language=${idioma}&format=json&origin=*&type=item&limit=1`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  return data.search?.[0]?.id ?? null
}

async function buscarDadosPais(qid: string): Promise<OrigemAutor | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`

  const response = await fetch(url)
  if (!response.ok) return null

  const data = await response.json()
  const claims = data.entities?.[qid]?.claims

  const ehHumano = (claims?.P31 ?? []).some(
    (c: any) => c.mainsnak?.datavalue?.value?.id === 'Q5'
  )
  if (!ehHumano) return null

  const paisId = claims?.P27?.[0]?.mainsnak?.datavalue?.value?.id
  if (!paisId) return null

  const nomeUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${paisId}&props=labels|claims&languages=pt&format=json&origin=*`
  const nomeResponse = await fetch(nomeUrl)
  if (!nomeResponse.ok) return null

  const nomeData = await nomeResponse.json()
  const entidadePais = nomeData.entities?.[paisId]

  const nome = entidadePais?.labels?.pt?.value ?? null
  // P297 é o código ISO 3166-1 alpha-2 do país na Wikidata
  const codigo = entidadePais?.claims?.P297?.[0]?.mainsnak?.datavalue?.value ?? null

  if (!nome) return null

  return { pais: nome, codigoPais: codigo }
}

export async function buscarOrigemAutor(nomeAutor: string): Promise<OrigemAutor> {
  const vazio: OrigemAutor = { pais: null, codigoPais: null }

  try {
    // Tenta primeiro via busca da própria Wikipedia (mais precisa em achar a pessoa certa)
    for (const idioma of ['en', 'pt']) {
      const qid = await buscarQidViaWikipedia(nomeAutor, idioma)
      if (qid) {
        const resultado = await buscarDadosPais(qid)
        if (resultado) return resultado
      }
    }

    // Se não achou, tenta a busca direta da Wikidata como último recurso
    for (const idioma of ['en', 'pt']) {
      const qid = await buscarQidViaWikidataSearch(nomeAutor, idioma)
      if (qid) {
        const resultado = await buscarDadosPais(qid)
        if (resultado) return resultado
      }
    }

    return vazio
  } catch {
    return vazio
  }
}