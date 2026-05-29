import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// base "./" keeps the build portable so it can be hosted from any static path
// (GitHub Pages subfolder, Netlify, plain file server, etc.)
export default defineConfig({
    plugins: [react()],
    base: "./",
});
