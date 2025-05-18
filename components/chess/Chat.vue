<script lang="ts" setup>
import { collection, addDoc, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { io, Socket } from 'socket.io-client';

interface Chat {
  id?: string;
  content: string;
  itsMe: boolean;
  username: string | null;
  timestamp: Date;
}

const message = ref('');
const chats = ref<Chat[]>([]);
const socket = ref<Socket | null>(null);
const userName = ref<string | null>(null);

const fetchMessages = async () => {
  try {
    const firestore = getFirestore();
    const q = query(collection(firestore, 'messages'), orderBy('timestamp'));
    const querySnapshot = await getDocs(q);
    chats.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  const auth = getAuth();
  auth.onAuthStateChanged(user => {
    userName.value = user?.displayName || 'Anonymous';
  });

  socket.value = io('/chat', {
    path: '/api/socket.io',
  });

  socket.value.on('chat', async (response: { id: string; text: string; username: string }) => {
    if (socket.value?.id === response.id) {
      return;
    }

    const newMessage = {
      content: response.text,
      itsMe: false,
      username: response.username,
      timestamp: new Date(),
    } as Chat;

    chats.value.unshift(newMessage);

    await addDoc(collection(getFirestore(), 'messages'), newMessage);
  });

  fetchMessages();
});

function onSend() {
  if (message.value.trim() === '') return;

  const newMessage = {
    text: message.value,
    username: userName.value,
    timestamp: new Date(),
  };

  socket.value?.emit('chat', newMessage);

  chats.value.unshift({
    itsMe: true,
    content: message.value,
    username: userName.value,
    timestamp: new Date(),
  });

  nextTick(() => (message.value = ''));
}

function onKeyPress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    onSend();
  }
}
</script>

<template>
	<div class="relative mx-auto w-full max-w-4xl border-2 rounded-xl border-gray-100">
		<div class="relative flex h-[calc(100vh_-_8rem)] flex-col-reverse overflow-y-auto pt-4">
			<div
				v-for="(chat, i) in chats"
				:key="chat.id || i"
				class="relative mb-3 flex flex-col px-3"
				:class="chat.itsMe ? 'items-end' : 'items-start'"
			>
      <h1 class="text-gray-500 text-sm">{{ chat.username }}</h1>
				<div
					class="inline-flex max-w-[70%] break-words rounded-t-xl px-4 py-2"
					:class="
						chat.itsMe
							? 'rounded-bl-xl border border-green-300 bg-green-200 text-green-800'
							: 'rounded-br-lg border border-blue-300 bg-blue-200 text-blue-800'
					"
				>
					{{ chat.content }}
				</div>
			</div>
		</div>
		<div class="flex items-center rounded-lg px-3 py-2">
			<textarea
				v-model="message"
				rows="1"
				class="mr-4 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
				placeholder="Your message..."
				@keydown="onKeyPress"
			></textarea>
			<button
				type="submit"
				class="inline-flex cursor-pointer justify-center rounded-full p-2 text-blue-600 hover:bg-blue-100"
				@click="onSend"
			>
				<svg
					class="h-5 w-5 rotate-90 rtl:-rotate-90"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="currentColor"
					viewBox="0 0 18 20"
				>
					<path
						d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z"
					/>
				</svg>
				<span class="sr-only">Send message</span>
			</button>
		</div>
	</div>
</template>