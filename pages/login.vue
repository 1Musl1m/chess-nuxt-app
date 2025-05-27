<script lang="ts" setup>
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

definePageMeta({
  layout: 'empty'
})
const isLogin = ref<boolean>(true);
const name = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');

const toggleAuth = () => {
    isLogin.value = !isLogin.value;
};
const subtitleText = computed<string>(() => {
    return isLogin.value ? "Аккаунта еще нет ?" : "Уже есть аккаунт ?";
});

const linkedAccountText = computed<string>(() => {
    return isLogin.value ? "Создать сейчас" : "Войти в него";
});

const submitText = computed<string>(() => {
    return isLogin.value ? "Войти" : "Зарегистрироваться";
});


const signUp = async (): Promise<void>  => {
  try {
    const userCredential = await createUserWithEmailAndPassword(getAuth(), email.value, password.value);
    useSonner.success('', {
      description: 'Вы успешно зарегистрировались'
    })
    await updateProfile(userCredential.user, {
      displayName: name.value
    });

    await navigateTo('/');
  } catch (error: any) {
    useSonner.error('', {
      description: "Ошибка"
    })
    console.log(error)
  }
};

const signIn = async (): Promise<void>  => {
  try {
    await signInWithEmailAndPassword(getAuth(), email.value, password.value);
    useSonner.success('', {
      description: 'Вы успешно вошли в ваш аккаунт'
    })
    await navigateTo('/');
  } catch (error: any) {
    useSonner.error('', {
      description: "Неверные данные"
    })
    console.log(error)
  }
};
const signUpWithGoogle = async () => {
  const provider = new GoogleAuthProvider();

  try {
    await signInWithPopup(getAuth(), provider);
    await navigateTo('/');
  } catch (error: any) {
    error.message;
  }
};

const submitForm = (): void => {
    if (isLogin.value) {
        signIn();
    } else {
        signUp();
    }
};
</script>

<template>
  <div class="flex h-screen items-center justify-between">
    <div class="w-full md:w-1/2">
      <div class="mx-auto w-full max-w-[330px] px-5">
        <h1 class="text-2xl font-bold tracking-tight lg:text-3xl">{{ isLogin ? 'Вход' : 'Регистрация' }}</h1>

        <form class="mt-10" @submit.prevent="submitForm" >
          <fieldset class="grid gap-5">
            <div>
              <UiVeeInput v-if="!isLogin" v-model="name" name="name" label="Имя" placeholder="Имя"/>
            </div>
            <div>
              <UiVeeInput v-model="email" name="email" label="Почта" placeholder="example@gmail.com" type="email" />
            </div>
            <div>
              <UiVeeInput v-model="password" name="password" label="Пароль" type="password" placeholder="∗∗∗∗∗∗∗∗"/>
            </div>
            <div>
              <UiButton type="submit" class="w-full">{{ submitText }}</UiButton>
            </div>
            <UiDivider label="или" />
            <UiButton @click="signUpWithGoogle" type="button" class="w-full" variant="outline">
              <Icon name="logos:google-icon" /> {{ submitText }} через Google
            </UiButton>
          </fieldset>
        </form>
        <p class="mt-10 text-center text-sm">
        {{ subtitleText }}
        <a href="#" @click="toggleAuth" class="text-sm font-semibold text-primary hover:underline">{{ linkedAccountText }}</a>
      </p>
      </div>
    </div>
    <div class="hidden h-screen md:block md:w-1/2 lg:w-1/2">
      <img
        src="https://images.unsplash.com/photo-1512551980832-13df02babc9e?q=60&w=2864&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Login form image"
        class="size-full object-cover"
      />
    </div>
  </div>
</template>
