<script setup lang="ts">
import { TheChessboard, type BoardApi } from 'vue3-chessboard'
import 'vue3-chessboard/style.css';
import { Engine } from '@/utils/engine'

let boardAPI: BoardApi | undefined
let engine: Engine | undefined

function handleBoardCreated(boardApi: BoardApi) {
  boardAPI = boardApi
  engine = new Engine(boardApi)
}

function handleMove() {
  const history = boardAPI?.getHistory(true)

  const moves = history?.map((move) =>
    typeof move === 'object' ? move.lan : move
  )

  if (moves) {
    engine?.sendPosition(moves.join(' '))
  }
}
</script>

<template>
  <TheChessboard
    @board-created="handleBoardCreated"
    @move="handleMove"
    :player-color="'white'"
  />
</template>