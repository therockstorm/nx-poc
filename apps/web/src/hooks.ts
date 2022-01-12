import type { Handle } from "@sveltejs/kit/types/hooks";
import { head } from "core/src";

import { headers as vercelHeaders } from "../vercel.json";

/** @type {import('@sveltejs/kit').Handle} */
export const handle: Handle = async ({ request, resolve }) => {
  const response = await resolve(request);

  const hs = head(vercelHeaders.filter((vhs) => vhs.source === "/(.*)"));
  if (hs) {
    hs.headers.forEach(({ key, value }) => (response.headers[key] = value));
  }
  return { ...response, headers: response.headers };
};
