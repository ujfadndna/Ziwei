import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Electron production runs from file://, so assets must use relative paths.
  base: "./",
  plugins: [react()],
});
