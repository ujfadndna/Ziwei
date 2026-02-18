import { describe, expect, it, beforeEach } from "vitest";

import {
  createTracer,
  DerivationTracer,
  formatTraceAsText,
  formatTraceAsMarkdown,
  formatStep,
} from "./index";

describe("DerivationTracer", () => {
  let tracer: DerivationTracer;

  beforeEach(() => {
    tracer = createTracer();
  });

  it("creates a new tracer instance", () => {
    expect(tracer).toBeInstanceOf(DerivationTracer);
  });

  it("starts tracking with ruleset version", () => {
    tracer.start("default@1.0.0");
    expect(tracer.getRuleSetVersion()).toBe("default@1.0.0");
  });

  it("records a complete step with inputs and outputs", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("calendar", "calendar_conversion", "convert solar to lunar");
    tracer.recordInput("solarDate", "1990-01-15");
    tracer.recordOutput("lunarDate", { year: 1989, month: 12, day: 19 });
    tracer.recordFormula("table lookup");
    tracer.endStep();

    const trace = tracer.finish();

    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0]!.type).toBe("calendar");
    expect(trace.steps[0]!.description).toContain("calendar_conversion");
    expect(trace.steps[0]!.input).toEqual({
      solarDate: "1990-01-15",
      _formulas: ["table lookup"],
    });
    expect(trace.steps[0]!.output).toEqual({
      lunarDate: { year: 1989, month: 12, day: 19 },
    });
  });

  it("records rules used in a step", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("stars", "star_placement", "place main stars");
    tracer.recordRule("rule-001", "ziwei_placement", "1.0.0");
    tracer.recordRule("rule-002", "tianfu_placement", "1.0.0");
    tracer.endStep();

    const trace = tracer.finish();

    expect(trace.steps[0]!.input).toEqual({
      _rules: [
        { ruleId: "rule-001", ruleName: "ziwei_placement", ruleVersion: "1.0.0" },
        { ruleId: "rule-002", ruleName: "tianfu_placement", ruleVersion: "1.0.0" },
      ],
    });
  });

  it("handles multiple steps", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("input", "parse_input", "parse birth data");
    tracer.recordInput("raw", "1990-01-15 12:00");
    tracer.endStep();

    tracer.beginStep("calendar", "convert", "calendar conversion");
    tracer.recordOutput("lunar", { year: 1989, month: 12, day: 19 });
    tracer.endStep();

    const trace = tracer.finish();

    expect(trace.steps).toHaveLength(2);
    expect(trace.steps[0]!.id).toBe("step-1");
    expect(trace.steps[1]!.id).toBe("step-2");
  });

  it("auto-closes previous step when beginning new one", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("input", "step1", "first step");
    tracer.recordInput("a", 1);
    // No endStep() call

    tracer.beginStep("normalize", "step2", "second step");
    tracer.recordInput("b", 2);
    tracer.endStep();

    const trace = tracer.finish();

    expect(trace.steps).toHaveLength(2);
    expect(trace.steps[0]!.input).toEqual({ a: 1 });
    expect(trace.steps[1]!.input).toEqual({ b: 2 });
  });

  it("records warnings at step level", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("calendar", "convert", "conversion");
    tracer.addWarning("date near boundary");
    tracer.endStep();

    const trace = tracer.finish();

    expect(trace.steps[0]!.warnings).toEqual(["date near boundary"]);
  });

  it("records warnings at global level when no step active", () => {
    tracer.start("default@1.0.0");
    tracer.addWarning("global warning");

    const trace = tracer.finish();

    expect(trace.warnings).toEqual(["global warning"]);
  });

  it("records errors in steps", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("calendar", "convert", "conversion");
    tracer.addError("invalid date format");
    tracer.endStep();

    const trace = tracer.finish();

    expect(trace.steps[0]!.error).toEqual({ message: "invalid date format" });
  });

  it("getTrace returns current state including in-progress step", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("input", "parse", "parsing");
    tracer.recordInput("data", "test");

    const trace = tracer.getTrace();

    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0]!.description).toContain("in progress");
  });

  it("finish auto-closes current step", () => {
    tracer.start("default@1.0.0");

    tracer.beginStep("input", "parse", "parsing");
    tracer.recordInput("data", "test");
    // No endStep() call

    const trace = tracer.finish();

    expect(trace.steps).toHaveLength(1);
    expect(trace.steps[0]!.description).not.toContain("in progress");
  });
});

describe("formatTraceAsText", () => {
  it("formats trace as readable text", () => {
    const tracer = createTracer();
    tracer.start("default@1.0.0");

    tracer.beginStep("calendar", "convert", "calendar conversion");
    tracer.recordInput("solar", "1990-01-15");
    tracer.recordOutput("lunar", { year: 1989, month: 12, day: 19 });
    tracer.endStep();

    const trace = tracer.finish();
    const text = formatTraceAsText(trace);

    expect(text).toContain("=== Derivation Trace ===");
    expect(text).toContain("[calendar]");
    expect(text).toContain("convert");
    expect(text).toContain("Input:");
    expect(text).toContain("Output:");
  });

  it("includes global warnings", () => {
    const tracer = createTracer();
    tracer.start("default@1.0.0");
    tracer.addWarning("test warning");

    const trace = tracer.finish();
    const text = formatTraceAsText(trace);

    expect(text).toContain("Global Warnings:");
    expect(text).toContain("test warning");
  });
});

describe("formatTraceAsMarkdown", () => {
  it("formats trace as markdown", () => {
    const tracer = createTracer();
    tracer.start("default@1.0.0");

    tracer.beginStep("calendar", "convert", "calendar conversion");
    tracer.recordInput("solar", "1990-01-15");
    tracer.recordOutput("lunar", { year: 1989, month: 12, day: 19 });
    tracer.endStep();

    const trace = tracer.finish();
    const md = formatTraceAsMarkdown(trace);

    expect(md).toContain("# Derivation Trace");
    expect(md).toContain("## Step 1:");
    expect(md).toContain("### Input");
    expect(md).toContain("### Output");
    expect(md).toContain("```json");
  });

  it("includes step warnings and errors", () => {
    const tracer = createTracer();
    tracer.start("default@1.0.0");

    tracer.beginStep("calendar", "convert", "conversion");
    tracer.addWarning("boundary warning");
    tracer.addError("conversion failed");
    tracer.endStep();

    const trace = tracer.finish();
    const md = formatTraceAsMarkdown(trace);

    expect(md).toContain("### Warnings");
    expect(md).toContain("boundary warning");
    expect(md).toContain("### Error");
    expect(md).toContain("conversion failed");
  });
});

describe("formatStep", () => {
  it("formats a single step", () => {
    const step = {
      id: "step-1",
      type: "calendar" as const,
      description: "[convert] calendar conversion",
      input: { solar: "1990-01-15" },
      output: { lunar: { year: 1989, month: 12, day: 19 } },
    };

    const text = formatStep(step);

    expect(text).toContain("[calendar]");
    expect(text).toContain("convert");
    expect(text).toContain("ID: step-1");
    expect(text).toContain("Input:");
    expect(text).toContain("Output:");
  });

  it("respects indent parameter", () => {
    const step = {
      id: "step-1",
      type: "input" as const,
      description: "test",
    };

    const text = formatStep(step, 2);

    expect(text).toMatch(/^    \[input\]/);
  });

  it("truncates long values", () => {
    const step = {
      id: "step-1",
      type: "input" as const,
      description: "test",
      input: { data: "a".repeat(100) },
    };

    const text = formatStep(step);

    expect(text).toContain("...");
  });
});
