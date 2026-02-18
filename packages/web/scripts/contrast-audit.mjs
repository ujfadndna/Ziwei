const TOKENS = {
  "text-on-dark": "#eef5ff",
  "muted-on-dark": "#d0dced",
  "input-value-on-dark": "#eef5ff",
  "input-placeholder-on-dark": "#b8c8de",
  "input-disabled-on-dark": "#bfcee4",
  "surface-dark-input-bg": "#0c131e",
  "surface-dark-input-disabled-bg": "#182233",
  "text-on-light": "#121a2a",
  "muted-on-light": "#263246",
  "input-value-on-light": "#121a2a",
  "input-placeholder-on-light": "#43526c",
  "input-disabled-on-light": "#39485f",
  "surface-light-input-bg": "#d6deeb",
  "surface-light-input-disabled-bg": "#c2cddd",
  "surface-app-dark": "#06080d",
};

const CHECKS = [
  {
    id: "body-text-dark",
    role: "正文/关键数据",
    fg: "text-on-dark",
    bg: "surface-app-dark",
    min: 4.5,
  },
  {
    id: "input-value-dark",
    role: "输入值",
    fg: "input-value-on-dark",
    bg: "surface-dark-input-bg",
    min: 4.5,
  },
  {
    id: "input-placeholder-dark",
    role: "placeholder",
    fg: "input-placeholder-on-dark",
    bg: "surface-dark-input-bg",
    min: 3,
  },
  {
    id: "label-dark",
    role: "次要文字(label/hint)",
    fg: "muted-on-dark",
    bg: "surface-app-dark",
    min: 3,
  },
  {
    id: "disabled-dark",
    role: "禁用文字",
    fg: "input-disabled-on-dark",
    bg: "surface-dark-input-disabled-bg",
    min: 3,
  },
  {
    id: "heading-dark",
    role: "标题",
    fg: "text-on-dark",
    bg: "surface-app-dark",
    min: 3,
  },
  {
    id: "input-value-light",
    role: "输入值(light surface)",
    fg: "input-value-on-light",
    bg: "surface-light-input-bg",
    min: 4.5,
  },
  {
    id: "input-placeholder-light",
    role: "placeholder(light surface)",
    fg: "input-placeholder-on-light",
    bg: "surface-light-input-bg",
    min: 3,
  },
  {
    id: "label-light",
    role: "次要文字(light surface)",
    fg: "muted-on-light",
    bg: "surface-light-input-bg",
    min: 3,
  },
  {
    id: "disabled-light",
    role: "禁用文字(light surface)",
    fg: "input-disabled-on-light",
    bg: "surface-light-input-disabled-bg",
    min: 3,
  },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  if (h.length !== 6) {
    throw new Error(`Unsupported color: ${hex}`);
  }
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function srgbToLinear(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rl = srgbToLinear(r);
  const gl = srgbToLinear(g);
  const bl = srgbToLinear(b);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(fgHex, bgHex) {
  const l1 = luminance(fgHex);
  const l2 = luminance(bgHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

let failed = false;
const rows = CHECKS.map((check) => {
  const fg = TOKENS[check.fg];
  const bg = TOKENS[check.bg];
  const ratio = contrastRatio(fg, bg);
  const ok = ratio >= check.min;
  if (!ok) failed = true;
  return {
    ...check,
    fg,
    bg,
    ratio,
    ok,
  };
});

console.log("| ID | 类型 | 前景色 | 背景色 | 对比度 | 阈值 | 结果 |");
console.log("|---|---|---|---|---:|---:|---|");
for (const row of rows) {
  console.log(
    `| ${row.id} | ${row.role} | ${row.fg} | ${row.bg} | ${row.ratio.toFixed(2)}:1 | ${row.min.toFixed(
      1
    )}:1 | ${row.ok ? "PASS" : "FAIL"} |`
  );
}

if (failed) {
  console.error("\nContrast audit failed: one or more checks are below threshold.");
  process.exit(1);
}

console.log("\nContrast audit passed.");
