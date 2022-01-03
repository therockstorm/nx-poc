/** @type {import('@sveltejs/kit').RequestHandler} */
export function get() {
  return { body: { message: "Hello, api!" } };
}
