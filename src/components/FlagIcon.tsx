type Props = {
  codigoPais: string | null
}

export function FlagIcon({ codigoPais }: Props) {
  if (!codigoPais || codigoPais.length !== 2) {
    return <span className="flag-placeholder">🏳️</span>
  }

  return (
    <img
      src={`https://flagcdn.com/24x18/${codigoPais.toLowerCase()}.png`}
      alt={codigoPais}
      className="flag-icon"
    />
  )
}