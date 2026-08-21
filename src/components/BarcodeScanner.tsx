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
  const rodandoRef = useRef(false)
  const [erro, setErro] = useState('')
  const [carregandoCamera, setCarregandoCamera] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function iniciar() {
      try {
        const cameras = await Html5Qrcode.getCameras()

        if (cancelado) return

        if (!cameras || cameras.length === 0) {
          setErro('Nenhuma câmera encontrada neste dispositivo.')
          setCarregandoCamera(false)
          return
        }

        // Tenta achar a câmera traseira pelo nome; se não achar, usa a última da lista
        // (em celulares, a traseira geralmente vem depois da frontal na lista)
        const traseira = cameras.find((c) => /back|traseira|rear/i.test(c.label))
        const cameraId = traseira?.id ?? cameras[cameras.length - 1].id

        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
          verbose: false,
        })
        scannerRef.current = scanner

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 300, height: 120 } },
          (textoDetectado) => {
            onDetectado(textoDetectado)
            pararScanner()
          },
          () => {
            // erro de leitura em um frame específico — normal, ignorado
          }
        )

        if (cancelado) {
          await scanner.stop()
          return
        }

        rodandoRef.current = true
        setCarregandoCamera(false)
      } catch (e) {
        if (!cancelado) {
          setErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
          setCarregandoCamera(false)
        }
      }
    }

    iniciar()

    return () => {
      cancelado = true
      pararScanner()
    }
  }, [])

  function pararScanner() {
    const scanner = scannerRef.current
    if (scanner && rodandoRef.current) {
      rodandoRef.current = false
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

        {erro && <p className="erro">{erro}</p>}
        {!erro && carregandoCamera && <p className="scanner-dica">Abrindo câmera...</p>}

        <div id={containerId} className="scanner-video" />

        {!erro && !carregandoCamera && (
          <p className="scanner-dica">Aponte a câmera para o código de barras do livro</p>
        )}
      </div>
    </div>
  )
}