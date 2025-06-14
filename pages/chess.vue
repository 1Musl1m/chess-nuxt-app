<script setup lang="ts">
import ChessBoard from "@/components/chess/Board.vue";
import ChessBoardStockfish from "@/components/chess/BoardStockfish.vue";

const useStockfish = ref(false);
const movesHistory = ref<string[]>([]);
const gameStatus = ref({
  whiteTime: 300, // 5 минут в секундах
  blackTime: 300, // 5 минут в секундах
  whiteCaptures: [] as string[],
  blackCaptures: [] as string[],
  currentTurn: "white" as "white" | "black"
});

let timerInterval: NodeJS.Timeout | null = null;

// Запуск таймера
const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    if (gameStatus.value.currentTurn === "white") {
      gameStatus.value.whiteTime--;
    } else {
      gameStatus.value.blackTime--;
    }
    
    // Проверка на окончание времени
    if (gameStatus.value.whiteTime <= 0 || gameStatus.value.blackTime <= 0) {
      if (timerInterval) clearInterval(timerInterval);
    }
  }, 1000);
};

// Форматирование времени в MM:SS
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Обработчик хода (будет вызываться из компонента доски)
const handleMove = (move: { from: string; to: string; captured?: string }) => {
  // Добавляем ход в историю в шахматной нотации (например, "e2e4")
  const moveNotation = `${move.from}${move.to}`;
  movesHistory.value.push(moveNotation);
  
  // Обновляем захваченные фигуры
  if (move.captured) {
    if (gameStatus.value.currentTurn === "white") {
      gameStatus.value.whiteCaptures.push(move.captured);
    } else {
      gameStatus.value.blackCaptures.push(move.captured);
    }
  }
  
  // Меняем ход
  gameStatus.value.currentTurn = gameStatus.value.currentTurn === "white" ? "black" : "white";
  
  // Перезапускаем таймер
  startTimer();
};

// Инициализация и очистка
onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<template>
  <div class="flex h-screen p-4">
    <!-- Левая часть с доской -->
    <div class="flex flex-col w-3/4 p-4 space-y-4">
      <div class="flex justify-center">
        <button
          class="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 mb-4"
          @click="useStockfish = !useStockfish"
        >
          {{ useStockfish ? "Выключить Stockfish" : "Включить Stockfish" }}
        </button>
      </div>
      <div class="flex-grow flex items-center justify-center rounded-lg shadow-lg">
        <!-- Передаем обработчик хода в компонент доски -->
        <component 
          :is="useStockfish ? ChessBoardStockfish : ChessBoard" 
          @move="handleMove"
        />
      </div>
    </div>

    <!-- Правая часть с дополнительной информацией -->
    <div class="w-1/4 p-4 space-y-6">
      <div class="bg-gray-300 rounded-lg shadow-lg p-4 h-full flex flex-col">
        <h2 class="text-xl font-bold mb-4 text-gray-800 border-b pb-2">Информация о партии</h2>
        
        <!-- Таймеры -->
        <div class="space-y-2 mb-6">
          <div 
            class="flex justify-between items-center p-2 rounded"
            :class="{
              'bg-gray-800 text-white': gameStatus.currentTurn === 'white',
              'bg-gray-200 text-black': gameStatus.currentTurn !== 'white'
            }"
          >
            <span>Белые:</span>
            <span class="font-mono">{{ formatTime(gameStatus.whiteTime) }}</span>
          </div>
          <div 
            class="flex justify-between items-center p-2 rounded"
            :class="{
              'bg-gray-800 text-white': gameStatus.currentTurn === 'black',
              'bg-gray-200 text-black': gameStatus.currentTurn !== 'black'
            }"
          >
            <span>Чёрные:</span>
            <span class="font-mono">{{ formatTime(gameStatus.blackTime) }}</span>
          </div>
        </div>
        
        <!-- История ходов -->
        <div class="flex-grow mb-4">
          <h3 class="font-semibold mb-2 text-gray-700">История ходов:</h3>
          <div class="bg-gray-50 text-black p-2 rounded max-h-64 overflow-y-auto">
            <div 
              v-for="(move, index) in movesHistory" 
              :key="index" 
              class="py-1 px-2 hover:bg-gray-100 rounded"
            >
              {{ index + 1 }}. {{ move }}
            </div>
            <div v-if="!movesHistory.length" class="text-gray-500 italic">
              Ходов пока нет
            </div>
          </div>
        </div>
        
        <!-- Съеденные фигуры -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium text-gray-700 mb-1">Белые взяли:</h4>
            <div class="flex flex-wrap gap-1 min-h-8">
              <span v-if="!gameStatus.whiteCaptures.length" class="text-gray-400 italic">-</span>
              <span v-else v-for="(piece, i) in gameStatus.whiteCaptures" :key="i" class="text-lg">
                {{ piece }}
              </span>
            </div>
          </div>
          <div>
            <h4 class="font-medium text-gray-700 mb-1">Чёрные взяли:</h4>
            <div class="flex flex-wrap gap-1 min-h-8">
              <span v-if="!gameStatus.blackCaptures.length" class="text-gray-400 italic">-</span>
              <span v-else v-for="(piece, i) in gameStatus.blackCaptures" :key="i" class="text-lg">
                {{ piece }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>