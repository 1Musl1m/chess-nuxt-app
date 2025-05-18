<script setup lang="ts">
	import ChessBoard from "@/components/chess/Board";
	import ChessBoardStockfish from "@/components/chess/BoardStockfish";

	const useStockfish = ref(false);
</script>

<template>
	<div class="flex h-screen p-4">
		<div class="flex w-4/5 items-center justify-center p-4">
			<component :is="useStockfish ? ChessBoardStockfish : ChessBoard" />
		</div>

		<div class="w-1/5 p-4 flex items-center">
			<button
				class="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
				@click="useStockfish = !useStockfish"
			>
				{{ useStockfish ? "Выключить Stockfish" : "Включить Stockfish" }}
			</button>
		</div>
	</div>
</template>
