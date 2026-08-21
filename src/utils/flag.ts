export function bandeiraDoCodigoPais(codigo: string | null): string {
    if (!codigo || codigo.length !== 2) return '🏳️'
  
    const codePoints = codigo
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
  
    return String.fromCodePoint(...codePoints)
  }