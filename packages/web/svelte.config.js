import vercel from "@sveltejs/adapter-vercel";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: { adapter: vercel(), target: "#svelte" },
  preprocess: preprocess(),
};

export default config;
