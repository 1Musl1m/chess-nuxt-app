export function useStockfish() {
  const stockfish = typeof Worker !== 'undefined' 
    ? new Worker(new URL('stockfish/src/stockfish.js', import.meta.url)) 
    : null;

  const sendCommand = (cmd: string) => {
    stockfish?.postMessage(cmd)
  }

  const onMessage = (callback: (line: string) => void) => {
    stockfish?.addEventListener('message', (e) => {
      callback(e.data)
    })
  }

  return { sendCommand, onMessage }
}