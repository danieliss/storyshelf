// src/services/authorOrigin.ts

async function buscarNomePaisEmPt(nomeAutor: string): Promise<string | null> {
  const nomeSeguro = nomeAutor.replace(/"/g, '')

  const sparql = `
    SELECT ?paisLabel WHERE {
      SERVICE wikibase:mwapi {
        bd:serviceParam wikibase:api "EntitySearch".
        bd:serviceParam wikibase:endpoint "www.wikidata.org".
        bd:serviceParam mwapi:search "${nomeSeguro}".
        bd:serviceParam mwapi:language "en".
        bd:serviceParam mwapi:limit "10".
        ?item wikibase:apiOutputItem mwapi:item.
      }
      ?item wdt:P31 wd:Q5.
      ?item wdt:P27 ?pais.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
    }
    LIMIT 1
  `

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/sparql-results+json' },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.results?.bindings?.[0]?.paisLabel?.value ?? null
  } catch {
    return null
  }
}

export async function buscarOrigemAutor(nomeAutor: string): Promise<string | null> {
  return await buscarNomePaisEmPt(nomeAutor)
}