// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	devtools: { enabled: true },

	modules: [
		"@nuxtjs/tailwindcss",
		"@nuxtjs/color-mode",
		"@vueuse/nuxt",
		"nuxt-icon",
		"@vee-validate/nuxt",
		"@morev/vue-transitions/nuxt",
	],

	runtimeConfig: {
		public: {
			firebaseApiKey: process.env.FIREBASE_API_KEY,
			firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
			firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
			firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
			firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
			firebaseAppId: process.env.FIREBASE_APP_ID,
		},
	},

	tailwindcss: {
		exposeConfig: true,
	},

	colorMode: {
		classSuffix: "",
	},

	imports: {
		imports: [
			{
				from: "tailwind-variants",
				name: "tv",
			},
			{
				from: "tailwind-variants",
				name: "VariantProps",
				type: true,
			},
			{
				from: "vue-sonner",
				name: "toast",
				as: "useSonner",
			},
		],
	},

	vite: {
		optimizeDeps: {
			include: ["stockfish.js"],
		},
	},

	build: {
		transpile: ["vue-sonner"],
	},
});
