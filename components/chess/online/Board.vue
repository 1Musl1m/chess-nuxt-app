<script setup lang="ts">
import { TheChessboard } from "vue3-chessboard";
import type { BoardApi, BoardConfig, Move, MovePayload } from "vue3-chessboard";
import "vue3-chessboard/style.css";
import { io } from "socket.io-client";

const route = useRoute();
const roomId = route.params.roomId as string;
const socket = io("/game", { path: "/api/socket.io" });

// Состояние игры
const playerColor = ref<"white" | "black">();
const boardApi = ref<BoardApi | null>(null);
const gameStarted = ref(false);
const waitingForOpponent = ref(true);

// Таймеры
const whiteTime = ref(600);
const blackTime = ref(600);
const timerInterval = ref<NodeJS.Timeout | null>(null);
const isWhiteTurn = ref(true);

// История ходов
const moveHistory = ref<MovePayload[]>([]);
const currentMoveIndex = ref(-1);
const savedGames = ref<Array<{
  id: string;
  pgn: string;
  date: string;
  moves: MovePayload[];
}>>([]);

// Конфигурация доски
const boardConfig: BoardConfig = reactive({
  coordinates: true,
});

// Инициализация доски
function handleBoardCreated(api: BoardApi) {
  boardApi.value = api;
}

// Управление таймерами
function startTimers() {
  if (timerInterval.value) clearInterval(timerInterval.value);
  
  timerInterval.value = setInterval(() => {
    if (!gameStarted.value) return;
    
    if (isWhiteTurn.value) {
      whiteTime.value--;
    } else {
      blackTime.value--;
    }
    
    if (whiteTime.value <= 0 || blackTime.value <= 0) {
      endGameByTimeout();
    }
  }, 1000);
}

// Навигация по истории
function goBack() {
  if (currentMoveIndex.value >= 0) {
    boardApi.value?.undoLastMove();
    currentMoveIndex.value--;
    isWhiteTurn.value = !isWhiteTurn.value;
  }
}

function goForward() {
  if (currentMoveIndex.value < moveHistory.value.length - 1) {
    currentMoveIndex.value++;
    const move = moveHistory.value[currentMoveIndex.value];
    boardApi.value?.move(move);
    isWhiteTurn.value = !isWhiteTurn.value;
  }
}

// Сохранение/загрузка игр
async function saveGame() {
  if (!boardApi.value || moveHistory.value.length === 0) return;
  
  const pgn = await boardApi.value.getPgn();
  const gameData = {
    id: Date.now().toString(),
    pgn,
    date: new Date().toLocaleString(),
    moves: [...moveHistory.value]
  };
  
  savedGames.value.push(gameData);
  localStorage.setItem('savedChessGames', JSON.stringify(savedGames.value));
}

function loadGame(id: string) {
  const game = savedGames.value.find(g => g.id === id);
  if (!game || !boardApi.value) return;
  
  resetGame();
  game.moves.forEach((move: Move) => {
    boardApi.value?.move(move);
  });
  moveHistory.value = [...game.moves];
  currentMoveIndex.value = game.moves.length - 1;
}

function resetGame() {
  boardApi.value?.resetBoard();
  moveHistory.value = [];
  currentMoveIndex.value = -1;
  whiteTime.value = 600;
  blackTime.value = 600;
  isWhiteTurn.value = true;
  gameStarted.value = false;
  waitingForOpponent.value = true;
  if (timerInterval.value) clearInterval(timerInterval.value);
}

// Обработчики Socket.IO
onMounted(() => {
  const saved = localStorage.getItem('savedChessGames');
  if (saved) savedGames.value = JSON.parse(saved);

  socket.emit("joinRoom", roomId);

  socket.on("joined", ({ color }) => {
    playerColor.value = color;
    waitingForOpponent.value = false;
  });

  socket.on("startGame", () => {
    gameStarted.value = true;
    startTimers();
    // Первый ход всегда за белыми
    isWhiteTurn.value = true;
  });

  socket.on("opponentMove", (move: MovePayload) => {
    boardApi.value?.move(move);
    moveHistory.value.push(move);
    currentMoveIndex.value = moveHistory.value.length - 1;
    // Переключаем ход после хода соперника
    isWhiteTurn.value = !isWhiteTurn.value;
  });

  socket.on("roomFull", () => {
    alert("Комната уже заполнена");
    navigateTo('/');
  });

  socket.on("playerDisconnected", () => {
    alert("Соперник отключился");
    if (timerInterval.value) clearInterval(timerInterval.value);
    gameStarted.value = false;
  });
});

// Обработчик хода
function onMove(move: MovePayload) {
  if (!isWhiteTurn.value && playerColor.value === 'white') return;
  if (isWhiteTurn.value && playerColor.value === 'black') return;

  moveHistory.value.push(move);
  currentMoveIndex.value = moveHistory.value.length - 1;
  socket.emit("move", { roomId, move });
  // Переключаем ход после своего хода
  isWhiteTurn.value = !isWhiteTurn.value;
}

// Завершение игры
function endGameByTimeout() {
  if (timerInterval.value) clearInterval(timerInterval.value);
  const winner = whiteTime.value <= 0 ? 'black' : 'white';
  alert(`Время вышло! ${winner === 'white' ? 'Белые' : 'Чёрные'} побеждают`);
  saveGame();
}

// Очистка
onUnmounted(() => {
  if (timerInterval.value) clearInterval(timerInterval.value);
  socket.disconnect();
});

// Форматирование времени
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
</script>

<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Шапка игры -->
    <div class="flex flex-col md:flex-row justify-between items-center mt-20 mb-6 bg-gray-100 p-4 rounded-lg gap-4">
      <div class="text-xl font-bold text-gray-800">
        Комната #{{ roomId }}
      </div>
      
      <div class="flex items-center gap-4">
        <div 
          class="text-2xl font-bold px-4 py-2 rounded-lg transition-all"
          :class="{
            'bg-amber-100 shadow-md': isWhiteTurn,
            'bg-gray-200': !isWhiteTurn
          }"
        >
          {{ formatTime(whiteTime) }}
        </div>
        
        <div class="text-center">
          <div class="font-medium text-gray-800">
            <span v-if="waitingForOpponent" class="text-amber-600">Ожидаем соперника...</span>
            <span v-else>Вы играете за {{ playerColor === 'white' ? 'белых' : 'чёрных' }}</span>
          </div>
          <div class="text-sm text-gray-500">
            {{ isWhiteTurn ? "Ход белых" : "Ход чёрных" }}
          </div>
        </div>
        
        <div 
          class="text-2xl font-bold px-4 py-2 rounded-lg transition-all"
          :class="{
            'bg-gray-800 text-white shadow-md': !isWhiteTurn,
            'bg-gray-300': isWhiteTurn
          }"
        >
          {{ formatTime(blackTime) }}
        </div>
      </div>
    </div>

    <!-- Шахматная доска -->
    <div class="flex justify-center mb-6">
      <TheChessboard
        v-if="playerColor"
        :board-config="boardConfig"
        @board-created="handleBoardCreated"
        @move="onMove"
        :player-color="playerColor"
        class="border rounded-lg shadow-lg w-full max-w-2xl"
      />
      <div v-else class="bg-gray-100 p-8 rounded-lg text-center">
        <p class="text-gray-600">Подключение к игре...</p>
      </div>
    </div>

    <!-- Управление игрой -->
    <div class="flex flex-wrap justify-center gap-3 mb-8">
      <button 
        @click="goBack"
        :disabled="currentMoveIndex < 0"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        ← Назад
      </button>
      <button 
        @click="goForward"
        :disabled="currentMoveIndex >= moveHistory.length - 1"
        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
      >
        Вперёд →
      </button>
      <button 
        @click="saveGame"
        :disabled="moveHistory.length === 0"
        class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
      >
        Сохранить игру
      </button>
      <button 
        @click="resetGame"
        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Новая игра
      </button>
    </div>

    <!-- Сохранённые игры -->
    <div v-if="savedGames.length > 0" class="bg-gray-50 p-6 rounded-lg shadow-inner">
      <h3 class="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Сохранённые партии</h3>
      <div class="grid gap-3">
        <div 
          v-for="game in savedGames"
          :key="game.id"
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          <div class="mb-2 sm:mb-0">
            <div class="font-medium text-gray-900">{{ game.date }}</div>
            <div class="text-sm text-gray-500">{{ game.moves.length }} ходов</div>
          </div>
          <button 
            @click="loadGame(game.id)"
            class="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm transition-colors"
          >
            Загрузить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>