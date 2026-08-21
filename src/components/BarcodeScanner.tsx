import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import './BarcodeScanner.css'

type Props = {
  onDetectado: (isbn: string) => void
  onFechar: () => void
}

export function BarcodeScanner({ onDetectado, onFechar }: Props) {
  const containerId = 'leitor-codigo-barras'
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      verbose: false,
    })
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 300, height: 120 } },
        (textoDetectado) => {
          onDetectado(textoDetectado)
          pararScanner()
        },
        () => {
          // erro de leitura em um frame específico (sem código visível ainda) — normal, ignorado
        }
      )
      .catch(() => {
        setErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      })

    return () => {
      pararScanner()
    }
  }, [])

  function pararScanner() {
    const scanner = scannerRef.current
    if (scanner) {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {})
    }
  }

  function handleFechar() {
    pararScanner()
    onFechar()
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <button className="scanner-fechar" onClick={handleFechar}>
          Fechar
        </button>
        {erro ? (
          <p className="erro">{erro}</p>
        ) : (
          <div id={containerId} className="scanner-video" />
        )}
        <p className="scanner-dica">Aponte a câmera para o código de barras do livro</p>
      </div>
    </div>
  )
}