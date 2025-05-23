import type { BoardApi } from 'vue3-chessboard'
import { type SquareKey } from 'vue3-chessboard'

export class Engine {
  private stockfish: Worker
  private boardApi: BoardApi
  public bestMove: string | null = null
  public engineName: string | null = null

  constructor(boardApi: BoardApi) {
    this.boardApi = boardApi

    const wasmSupported =
      typeof WebAssembly === 'object' &&
      WebAssembly.validate(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00),
      )

    this.stockfish = new Worker(
      wasmSupported ? '/stockfish.wasm.js' : '/stockfish.js'
    )

    this.setupListeners()
    this.stockfish.postMessage('uci')
  }

  private setupListeners() {
    this.stockfish.addEventListener('message', (data) =>
      this.handleEngineStdout(data)
    )

    this.stockfish.addEventListener('error', (err) => console.error(err))
    this.stockfish.addEventListener('messageerror', (err) => console.error(err))
  }

  private handleEngineStdout(data: MessageEvent<unknown>) {
    const uciString = (data.data as string).split(' ')

    if (uciString[0] === 'uciok') {
      this.setOption('UCI_AnalyseMode', 'true')
      this.setOption('Analysis Contempt', 'Off')

      this.stockfish.postMessage('ucinewgame')
      this.stockfish.postMessage('isready')
    }

    if (uciString[0] === 'readyok') {
      this.stockfish.postMessage('go movetime 1500')
    }

    if (uciString[0] === 'bestmove' && uciString[1]) {
      if (uciString[1] !== this.bestMove) {
        this.bestMove = uciString[1]

        if (this.boardApi.getTurnColor() === 'black') {
          this.boardApi.move({
            from: this.bestMove.slice(0, 2) as SquareKey,
            to: this.bestMove.slice(2, 4) as SquareKey,
          })
        }
      }
    }
  }

  private setOption(name: string, value: string) {
    this.stockfish.postMessage(`setoption name ${name} value ${value}`)
  }

  public sendPosition(position: string) {
    this.stockfish.postMessage(`position startpos moves ${position}`)
    this.stockfish.postMessage('go movetime 2000')
  }
}