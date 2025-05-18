<script lang="ts" setup>
import { getAuth, onAuthStateChanged } from "firebase/auth";

const userName = ref<string | null>(null);
const router = useRouter();

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    userName.value = user?.displayName || null;
  });
});

function startOnlineGame() {
  const roomId = Math.random().toString(36).substring(2, 8);
  router.push(`/game/${roomId}`);
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-center px-4">
    <div class="max-w-md w-full space-y-6">
      <h1 class="text-2xl font-semibold lg:text-3xl text-gray-800 dark:text-white">
        Привет, {{ userName }}
      </h1>
      
      <h2 class="text-xl text-gray-600 dark:text-gray-300">
        Добро пожаловать в шахматный мир
      </h2>
      
      <p class="text-gray-500 dark:text-gray-400">
        Выбери одну из ниже представленных режимов
      </p>

      <div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <UiButton size="lg" icon-placement="right" icon="lucide:arrow-right">
          <NuxtLink to="/chess">Компьютер</NuxtLink>
        </UiButton>
        
        <UiButton size="lg" variant="destructive" class="w-full sm:w-auto"  @click="startOnlineGame" >
          <NuxtLink>С другом</NuxtLink>
        </UiButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Дополнительные стили, если нужно */
a {
  @apply text-inherit no-underline;
}
</style>