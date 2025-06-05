<script setup lang="ts">
	import { TheChessboard } from "vue3-chessboard";
	import type { BoardApi, BoardConfig, PieceColor } from "vue3-chessboard";

	import "vue3-chessboard/style.css";

	import { Engine } from "@/utils/engine";

	let boardAPI: BoardApi | undefined;
	let engine: Engine | undefined;
	const boardConfig: BoardConfig = reactive({
		coordinates: true,
	});

	function handleBoardCreated(boardApi: BoardApi) {
		boardAPI = boardApi;
		engine = new Engine(boardApi);
	}

	function handleMove() {
		const history = boardAPI?.getHistory(true);

		const moves = history?.map((move) => (typeof move === "object" ? move.lan : move));

		if (moves) {
			engine?.sendPosition(moves.join(" "));
		}
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
	<TheChessboard
		@board-created="handleBoardCreated"
		:board-config="boardConfig"
		reactive-config
		@check="handleCheck"
		@checkmate="handleCheckmate"
		@stalemate="handleStalemate"
		@draw="handleDraw"
		@move="handleMove"
		:player-color="'white'"
	/>
</template>