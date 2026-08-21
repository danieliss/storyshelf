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
  const [semLeitura, setSemLeitura] = useState(false)

  useEffect(() => {
    let cancelado = false
    let timeoutSemLeitura: ReturnType<typeof setTimeout>

    async function iniciar() {
      try {
        const cameras = await Html5Qrcode.getCameras()

        if (cancelado) return

        if (!cameras || cameras.length === 0) {
          setErro('Nenhuma câmera encontrada neste dispositivo.')
          setCarregandoCamera(false)
          return
        }

        const traseira = cameras.find((c) => /back|traseira|rear/i.test(c.label))
        const cameraId = traseira?.id ?? cameras[cameras.length - 1].id

        const scanner = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.UPC_A,
          ],
          verbose: false,
          useBarCodeDetectorIfSupported: true,
        })
        scannerRef.current = scanner

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
            videoConstraints: {
              deviceId: cameraId,
              width: { min: 1280, ideal: 1920 },
              height: { min: 720, ideal: 1080 },
            },
          },
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

        // se não conseguir ler em 20 segundos, avisa o usuário
        timeoutSemLeitura = setTimeout(() => {
          if (!cancelado) setSemLeitura(true)
        }, 20000)
      } catch {
        if (!cancelado) {
          setErro('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
          setCarregandoCamera(false)
        }
      }
    }

    iniciar()

    return () => {
      cancelado = true
      clearTimeout(timeoutSemLeitura)
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

        {!erro && !carregandoCamera && !semLeitura && (
          <p className="scanner-dica">Aponte a câmera para o código de barras do livro</p>
        )}

        {semLeitura && (
          <p className="scanner-dica scanner-aviso">
            Não conseguimos ler o código. Tente aproximar mais, melhorar a iluminação, ou
            feche esta janela e digite o ISBN manualmente.
          </p>
        )}
      </div>
    </div>
  )
}