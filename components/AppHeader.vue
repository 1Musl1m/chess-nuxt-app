<template>
  <UiNavbar sticky>
    <UiContainer class="flex h-14 items-center justify-between">
      <NuxtLink class="text-lg font-semibold" to="/">Chess</NuxtLink>
      <!-- <div>
        <ul class="flex items-center gap-10">
          <li class="cursor-pointer text-xl transition-all duration-200 hover:font-semibold">
            <NuxtLink to="/">Главная</NuxtLink>
          </li>
          <li class="cursor-pointer text-xl transition-all duration-200 hover:font-semibold">
            <NuxtLink to="/chess">Игра</NuxtLink>
          </li>
          <li class="cursor-pointer text-xl transition-all duration-200 hover:font-semibold">
            <NuxtLink to="/about">О нас</NuxtLink>
          </li>
          <li class="cursor-pointer text-xl transition-all duration-200 hover:font-semibold">
            <NuxtLink to="/login">Конакты</NuxtLink>
          </li>
        </ul>
      </div> -->
      <div class="flex items-center gap-2">
        <UiButton
          @click="$colorMode.preference = $colorMode.value == 'dark' ? 'light' : 'dark'"
          size="icon-sm"
          variant="ghost"
          title="Цвет фона"
        >
          <span class="sr-only">Сменить цвет</span>
          <Icon class="h-4 w-4" name="lucide:sun-medium" />
        </UiButton>
      </div>
    </UiContainer>
  </UiNavbar>
</template>
