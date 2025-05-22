<script setup lang="ts">
	import { TheChessboard } from "vue3-chessboard";
	import type { BoardApi, BoardConfig, MovePayload, PieceColor } from "vue3-chessboard";

	import "vue3-chessboard/style.css";

	import { io } from "socket.io-client";
	import { onMounted, ref } from "vue";
	import { useRoute } from "vue-router";

	const route = useRoute();
	const roomId = route.params.roomId as string;
	const socket = io("/game", { path: "/api/socket.io" });

	const playerColor = ref<"white" | "black">("white");
	const boardApi = ref<BoardApi | null>(null);

	const boardConfig: BoardConfig = reactive({
		coordinates: true,
	});

	function handleBoardCreated(api: BoardApi) {
		boardApi.value = api;
		console.log("♟️ Доска создана. Ждём соперника...");
	}

	onMounted(() => {
		socket.emit("joinRoom", roomId);

		socket.on("joined", ({ color }) => {
			playerColor.value = color;
			console.log(`✅ Вы подключены как ${color === "white" ? "белый" : "чёрный"} игрок`);
		});

		socket.on("startGame", () => {
			console.log("🚀 Игра началась");
		});

		socket.on("opponentMove", (move: MovePayload) => {
			console.log("⬅️ Получен ход соперника:", move);
			if (boardApi.value) {
				boardApi.value.move(move);
			} else {
				console.warn("⚠️ boardApi не определён, невозможно выполнить ход");
			}
		});

		socket.on("roomFull", () => {
			alert("Комната уже заполнена двумя игроками.");
		});
	});

	function onMove(move: MovePayload) {
		console.log("➡️ Вы сделали ход:", move);
		socket.emit("move", { roomId, move });
	}

	function handleCheck(isInCheck: PieceColor) {
		alert(`${isInCheck} is in Check`);
	}

	function handleCheckmate(isMated: PieceColor) {
		alert(`${isMated} is mated`);
	}

	function handleStalemate() {
		alert("Stalemate");
	}

	function handleDraw() {
		alert("Draw");
	}
</script>

<template>
	<div>
		<p class="mb-4 text-center">Ваш цвет: {{ playerColor === "white" ? "белые" : "чёрные" }}</p>

		<div class="flex justify-center">
			<TheChessboard
				v-if="playerColor"
				:board-config="boardConfig"
				reactive-config
				@check="handleCheck"
				@checkmate="handleCheckmate"
				@stalemate="handleStalemate"
				@draw="handleDraw"
				:player-color="playerColor"
				@board-created="handleBoardCreated"
				@move="onMove"
			/>
			<p v-else class="text-red-500">⏳ Ожидание подключения...</p>
		</div>
	</div>
</template>
