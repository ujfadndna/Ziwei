import type { DerivationStep, DerivationTrace } from "../types";

/**
 * 格式化为可读文本
 */
export function formatTraceAsText(trace: DerivationTrace): string {
  const lines: string[] = [];

  lines.push("=== Derivation Trace ===");
  lines.push("");

  for (const step of trace.steps) {
    lines.push(formatStep(step, 0));
    lines.push("");
  }

  if (trace.warnings && trace.warnings.length > 0) {
    lines.push("Global Warnings:");
    for (const warning of trace.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join("\n");
}

/**
 * 格式化为Markdown
 */
export function formatTraceAsMarkdown(trace: DerivationTrace): string {
  const lines: string[] = [];

  lines.push("# Derivation Trace");
  lines.push("");

  for (let i = 0; i < trace.steps.length; i++) {
    const step = trace.steps[i]!;
    lines.push(`## Step ${i + 1}: ${step.description}`);
    lines.push("");
    lines.push(`- **Type**: \`${step.type}\``);
    lines.push(`- **ID**: \`${step.id}\``);

    if (step.input) {
      lines.push("");
      lines.push("### Input");
      lines.push("```json");
      lines.push(JSON.stringify(step.input, null, 2));
      lines.push("```");
    }

    if (step.output) {
      lines.push("");
      lines.push("### Output");
      lines.push("```json");
      lines.push(JSON.stringify(step.output, null, 2));
      lines.push("```");
    }

    if (step.warnings && step.warnings.length > 0) {
      lines.push("");
      lines.push("### Warnings");
      for (const warning of step.warnings) {
        lines.push(`- ${warning}`);
      }
    }

    if (step.error) {
      lines.push("");
      lines.push("### Error");
      lines.push(`**${step.error.message}**`);
    }

    lines.push("");
  }

  if (trace.warnings && trace.warnings.length > 0) {
    lines.push("## Global Warnings");
    for (const warning of trace.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join("\n");
}

/**
 * 格式化单个步骤
 */
export function formatStep(step: DerivationStep, indent = 0): string {
  const prefix = "  ".repeat(indent);
  const lines: string[] = [];

  lines.push(`${prefix}[${step.type}] ${step.description}`);
  lines.push(`${prefix}  ID: ${step.id}`);

  if (step.input) {
    const inputStr = formatValue(step.input);
    lines.push(`${prefix}  Input: ${inputStr}`);
  }

  if (step.output) {
    const outputStr = formatValue(step.output);
    lines.push(`${prefix}  Output: ${outputStr}`);
  }

  if (step.warnings && step.warnings.length > 0) {
    lines.push(`${prefix}  Warnings:`);
    for (const warning of step.warnings) {
      lines.push(`${prefix}    - ${warning}`);
    }
  }

  if (step.error) {
    lines.push(`${prefix}  Error: ${step.error.message}`);
  }

  return lines.join("\n");
}

/**
 * 格式化值为紧凑字符串
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }

  if (typeof value === "object") {
    const str = JSON.stringify(value);
    if (str.length > 80) {
      return str.slice(0, 77) + "...";
    }
    return str;
  }

  return String(value);
}
