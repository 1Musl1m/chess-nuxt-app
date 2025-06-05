<script setup lang="ts">
	import { TheChessboard } from "vue3-chessboard";
	import type { BoardApi, BoardConfig, Move, MovePayload, PieceColor } from "vue3-chessboard";

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
	const savedGames = ref<
		Array<{
			id: string;
			pgn: string;
			date: string;
			moves: MovePayload[];
		}>
	>([]);

	// Конфигурация доски
	const boardConfig: BoardConfig = reactive({
		coordinates: true,
	});

	// Инициализация доски
	function handleBoardCreated(api: BoardApi) {
		boardApi.value = api;
	}

	// Обработчики событий игры
	function handleCheck(isInCheck: PieceColor) {
		alert(`${isInCheck === "white" ? "Белые" : "Чёрные"} под шахом!`);
	}

	function stopTimers() {
		if (timerInterval.value) {
			clearInterval(timerInterval.value);
			timerInterval.value = null;
		}
	}

	function handleCheckmate(isMated: PieceColor) {
		stopTimers();
		alert(`${isMated === "white" ? "Белые" : "Чёрные"} получили мат! Игра окончена.`);
		saveGame();
	}

	function handleStalemate() {
		stopTimers();
		alert("Пат! Игра завершена вничью.");
		saveGame();
	}

	function handleDraw() {
		stopTimers();
		alert("Ничья! Игра завершена.");
		saveGame();
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
			moves: [...moveHistory.value],
		};

		savedGames.value.push(gameData);
		localStorage.setItem("savedChessGames", JSON.stringify(savedGames.value));
	}

	function loadGame(id: string) {
		const game = savedGames.value.find((g) => g.id === id);
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
		stopTimers();
	}

	// Обработчики Socket.IO
	onMounted(() => {
		const saved = localStorage.getItem("savedChessGames");
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
			navigateTo("/");
		});

		socket.on("playerDisconnected", () => {
			stopTimers();
			alert("Соперник отключился");
			gameStarted.value = false;
		});
	});

	// Обработчик хода
	function onMove(move: MovePayload) {
		if (!isWhiteTurn.value && playerColor.value === "white") return;
		if (isWhiteTurn.value && playerColor.value === "black") return;

		moveHistory.value.push(move);
		currentMoveIndex.value = moveHistory.value.length - 1;
		socket.emit("move", { roomId, move });
		// Переключаем ход после своего хода
		isWhiteTurn.value = !isWhiteTurn.value;
	}

	// Завершение игры
	function endGameByTimeout() {
		stopTimers();
		const winner = whiteTime.value <= 0 ? "black" : "white";
		alert(`Время вышло! ${winner === "white" ? "Белые" : "Чёрные"} побеждают`);
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
		return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
	}
</script>

<template>
	<div class="container mx-auto max-w-4xl px-4 py-8">
		<!-- Шапка игры -->
		<div
			class="mb-6 mt-20 flex flex-col items-center justify-between gap-4 rounded-lg bg-gray-100 p-4 md:flex-row"
		>
			<div class="text-xl font-bold text-gray-800">Комната #{{ roomId }}</div>

			<div class="flex items-center gap-4">
				<div
					class="rounded-lg px-4 py-2 text-2xl font-bold transition-all"
					:class="{
						'bg-amber-100 shadow-md': isWhiteTurn,
						'bg-gray-200': !isWhiteTurn,
					}"
				>
					{{ formatTime(whiteTime) }}
				</div>

				<div class="text-center">
					<div class="font-medium text-gray-800">
						<span v-if="waitingForOpponent" class="text-amber-600"
							>Ожидаем соперника...</span
						>
						<span v-else
							>Вы играете за {{ playerColor === "white" ? "белых" : "чёрных" }}</span
						>
					</div>
					<div class="text-sm text-gray-500">
						{{ isWhiteTurn ? "Ход белых" : "Ход чёрных" }}
					</div>
				</div>

				<div
					class="rounded-lg px-4 py-2 text-2xl font-bold transition-all"
					:class="{
						'bg-gray-800 text-white shadow-md': !isWhiteTurn,
						'bg-gray-300': isWhiteTurn,
					}"
				>
					{{ formatTime(blackTime) }}
				</div>
			</div>
		</div>

		<!-- Шахматная доска -->
		<div class="mb-6 flex justify-center">
			<TheChessboard
				v-if="playerColor"
				:board-config="boardConfig"
				@board-created="handleBoardCreated"
				reactive-config
				@move="onMove"
				@check="handleCheck"
				@checkmate="handleCheckmate"
				@stalemate="handleStalemate"
				@draw="handleDraw"
				:player-color="playerColor"
				class="w-full max-w-2xl rounded-lg border shadow-lg"
			/>
			<div v-else class="rounded-lg bg-gray-100 p-8 text-center">
				<p class="text-gray-600">Подключение к игре...</p>
			</div>
		</div>

		<!-- Управление игрой -->
		<div class="mb-8 flex flex-wrap justify-center gap-3">
			<button
				@click="goBack"
				:disabled="currentMoveIndex < 0"
				class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
			>
				← Назад
			</button>
			<button
				@click="goForward"
				:disabled="currentMoveIndex >= moveHistory.length - 1"
				class="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
			>
				Вперёд →
			</button>
			<button
				@click="saveGame"
				:disabled="moveHistory.length === 0"
				class="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
			>
				Сохранить игру
			</button>
			<button
				@click="resetGame"
				class="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
			>
				Новая игра
			</button>
		</div>

		<!-- Сохранённые игры -->
		<div v-if="savedGames.length > 0" class="rounded-lg bg-gray-50 p-6 shadow-inner">
			<h3 class="mb-4 border-b pb-2 text-xl font-bold text-gray-800">Сохранённые партии</h3>
			<div class="grid gap-3">
				<div
					v-for="game in savedGames"
					:key="game.id"
					class="flex flex-col items-start justify-between rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center"
				>
					<div class="mb-2 sm:mb-0">
						<div class="font-medium text-gray-900">{{ game.date }}</div>
						<div class="text-sm text-gray-500">{{ game.moves.length }} ходов</div>
					</div>
					<button
						@click="loadGame(game.id)"
						class="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors hover:bg-blue-200"
					>
						Загрузить
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
