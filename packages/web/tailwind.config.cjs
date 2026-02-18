/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: "var(--hud-bg-20)",
          panel: "var(--hud-panel-fill)",
          border: "var(--hud-panel-border)",
          text: "var(--hud-text-primary)",
          muted: "var(--hud-text-muted)",
          accent: "var(--hud-accent)",
          warning: "var(--hud-warning)",
          risk: "var(--hud-danger)",
        },
      },
      transitionDuration: {
        "hud-fast": "var(--hud-motion-fast)",
        hud: "var(--hud-motion-base)",
        "hud-slow": "var(--hud-motion-slow)",
      },
      transitionTimingFunction: {
        hud: "var(--hud-ease)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
          // Chinese-first fallbacks
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
