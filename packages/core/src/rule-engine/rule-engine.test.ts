import { describe, expect, it, beforeEach } from "vitest";

import type { BirthInfo, DateInfo, Rule, RuleSet } from "../types";
import {
  RuleRegistry,
  ruleRegistry,
  RuleExecutor,
  ruleExecutor,
  VersionManager,
  versionManager,
} from "./index";
import type { RuleContext } from "./index";

describe("RuleRegistry", () => {
  let registry: RuleRegistry;

  beforeEach(() => {
    registry = new RuleRegistry();
  });

  const createTestRule = (id: string, category: Rule["category"] = "通用"): Rule => ({
    id,
    name: `Test Rule ${id}`,
    category,
    when: { type: "genderIs", gender: "男" },
    then: { message: "Test outcome" },
  });

  describe("registerRule", () => {
    it("registers a rule successfully", () => {
      const rule = createTestRule("test-001");
      registry.registerRule(rule);

      expect(registry.hasRule("test-001")).toBe(true);
      expect(registry.getRule("test-001")).toEqual(rule);
    });

    it("throws on duplicate rule id", () => {
      const rule = createTestRule("test-001");
      registry.registerRule(rule);

      expect(() => registry.registerRule(rule)).toThrow(/already registered/);
    });
  });

  describe("registerRuleSet", () => {
    it("registers a rule set and its rules", () => {
      const ruleSet: RuleSet = {
        id: "test-set",
        name: "Test Set",
        version: "1.0.0",
        config: {},
        rules: [createTestRule("rule-001"), createTestRule("rule-002")],
      };

      registry.registerRuleSet(ruleSet);

      expect(registry.hasRuleSet("test-set")).toBe(true);
      expect(registry.hasRule("rule-001")).toBe(true);
      expect(registry.hasRule("rule-002")).toBe(true);
    });

    it("throws on duplicate rule set id", () => {
      const ruleSet: RuleSet = {
        id: "test-set",
        name: "Test Set",
        config: {},
        rules: [],
      };

      registry.registerRuleSet(ruleSet);
      expect(() => registry.registerRuleSet(ruleSet)).toThrow(/already registered/);
    });
  });

  describe("getRulesByCategory", () => {
    it("filters rules by category", () => {
      registry.registerRule(createTestRule("rule-001", "星曜"));
      registry.registerRule(createTestRule("rule-002", "宫位"));
      registry.registerRule(createTestRule("rule-003", "星曜"));

      const starRules = registry.getRulesByCategory("星曜");
      expect(starRules).toHaveLength(2);
      expect(starRules.map((r) => r.id)).toContain("rule-001");
      expect(starRules.map((r) => r.id)).toContain("rule-003");
    });
  });

  describe("clear", () => {
    it("removes all registrations", () => {
      registry.registerRule(createTestRule("rule-001"));
      registry.registerRuleSet({
        id: "test-set",
        name: "Test",
        config: {},
        rules: [],
      });

      registry.clear();

      expect(registry.getAllRules()).toHaveLength(0);
      expect(registry.getAllRuleSets()).toHaveLength(0);
    });
  });
});

describe("RuleExecutor", () => {
  let executor: RuleExecutor;

  const createContext = (gender: "男" | "女" = "男"): RuleContext => ({
    birthInfo: {
      gender,
      datetime: "1990-01-01T08:00:00+08:00",
      timeIndex: 4,
    } as BirthInfo,
    dateInfo: {
      solar: { year: 1990, month: 1, day: 1 },
      lunar: { year: 1989, month: 11, day: 5, isLeap: false },
      ganzhi: {
        year: "己巳",
        month: "丙子",
        day: "甲子",
        time: "戊辰",
      },
    } as DateInfo,
  });

  beforeEach(() => {
    executor = new RuleExecutor();
  });

  describe("execute", () => {
    it("matches gender condition", () => {
      const rule: Rule = {
        id: "gender-male",
        name: "Male Check",
        category: "通用",
        when: { type: "genderIs", gender: "男" },
        then: { message: "Is male" },
      };

      const result = executor.execute(rule, createContext("男"));
      expect(result.matched).toBe(true);
      expect(result.outcome?.message).toBe("Is male");

      const result2 = executor.execute(rule, createContext("女"));
      expect(result2.matched).toBe(false);
    });

    it("handles disabled rules", () => {
      const rule: Rule = {
        id: "disabled-rule",
        name: "Disabled",
        category: "通用",
        enabled: false,
        when: { type: "genderIs", gender: "男" },
        then: { message: "Should not match" },
      };

      const result = executor.execute(rule, createContext("男"));
      expect(result.matched).toBe(false);
    });

    it("evaluates AND conditions", () => {
      const rule: Rule = {
        id: "and-rule",
        name: "AND Test",
        category: "通用",
        when: {
          type: "and",
          conditions: [
            { type: "genderIs", gender: "男" },
            { type: "genderIs", gender: "男" },
          ],
        },
        then: { message: "Both true" },
      };

      expect(executor.execute(rule, createContext("男")).matched).toBe(true);
      expect(executor.execute(rule, createContext("女")).matched).toBe(false);
    });

    it("evaluates OR conditions", () => {
      const rule: Rule = {
        id: "or-rule",
        name: "OR Test",
        category: "通用",
        when: {
          type: "or",
          conditions: [
            { type: "genderIs", gender: "男" },
            { type: "genderIs", gender: "女" },
          ],
        },
        then: { message: "Either true" },
      };

      expect(executor.execute(rule, createContext("男")).matched).toBe(true);
      expect(executor.execute(rule, createContext("女")).matched).toBe(true);
    });

    it("evaluates NOT conditions", () => {
      const rule: Rule = {
        id: "not-rule",
        name: "NOT Test",
        category: "通用",
        when: {
          type: "not",
          condition: { type: "genderIs", gender: "男" },
        },
        then: { message: "Not male" },
      };

      expect(executor.execute(rule, createContext("男")).matched).toBe(false);
      expect(executor.execute(rule, createContext("女")).matched).toBe(true);
    });
  });

  describe("executeRuleSet", () => {
    it("executes all rules in a rule set", () => {
      const registry = new RuleRegistry();
      const ruleSet: RuleSet = {
        id: "test-set",
        name: "Test Set",
        config: {},
        rules: [
          {
            id: "rule-1",
            name: "Rule 1",
            category: "通用",
            when: { type: "genderIs", gender: "男" },
            then: { message: "Male" },
          },
          {
            id: "rule-2",
            name: "Rule 2",
            category: "通用",
            when: { type: "genderIs", gender: "女" },
            then: { message: "Female" },
          },
        ],
      };

      registry.registerRuleSet(ruleSet);

      // Use global registry for this test
      ruleRegistry.clear();
      ruleRegistry.registerRuleSet(ruleSet);

      const result = ruleExecutor.executeRuleSet("test-set", createContext("男"));

      expect(result.ruleSetId).toBe("test-set");
      expect(result.results).toHaveLength(2);
      expect(result.matchedCount).toBe(1);
      expect(result.results[0]!.matched).toBe(true);
      expect(result.results[1]!.matched).toBe(false);

      ruleRegistry.clear();
    });

    it("throws on unknown rule set", () => {
      expect(() =>
        ruleExecutor.executeRuleSet("unknown", createContext())
      ).toThrow(/not found/);
    });
  });
});

describe("VersionManager", () => {
  let manager: VersionManager;

  beforeEach(() => {
    manager = new VersionManager();
  });

  describe("parseVersion", () => {
    it("parses valid versions", () => {
      expect(manager.parseVersion("1.0.0")).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: undefined,
      });

      expect(manager.parseVersion("2.3.4")).toEqual({
        major: 2,
        minor: 3,
        patch: 4,
        prerelease: undefined,
      });

      expect(manager.parseVersion("1.0.0-beta")).toEqual({
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: "beta",
      });
    });

    it("throws on invalid versions", () => {
      expect(() => manager.parseVersion("invalid")).toThrow(/Invalid version/);
      expect(() => manager.parseVersion("1.0")).toThrow(/Invalid version/);
      expect(() => manager.parseVersion("v1.0.0")).toThrow(/Invalid version/);
    });
  });

  describe("compareVersions", () => {
    it("compares major versions", () => {
      expect(manager.compareVersions("2.0.0", "1.0.0")).toBeGreaterThan(0);
      expect(manager.compareVersions("1.0.0", "2.0.0")).toBeLessThan(0);
    });

    it("compares minor versions", () => {
      expect(manager.compareVersions("1.2.0", "1.1.0")).toBeGreaterThan(0);
      expect(manager.compareVersions("1.1.0", "1.2.0")).toBeLessThan(0);
    });

    it("compares patch versions", () => {
      expect(manager.compareVersions("1.0.2", "1.0.1")).toBeGreaterThan(0);
      expect(manager.compareVersions("1.0.1", "1.0.2")).toBeLessThan(0);
    });

    it("handles equal versions", () => {
      expect(manager.compareVersions("1.0.0", "1.0.0")).toBe(0);
    });

    it("handles prerelease versions", () => {
      expect(manager.compareVersions("1.0.0-alpha", "1.0.0")).toBeLessThan(0);
      expect(manager.compareVersions("1.0.0", "1.0.0-beta")).toBeGreaterThan(0);
    });
  });

  describe("isCompatible", () => {
    it("returns true for same major version", () => {
      expect(manager.isCompatible("1.0.0", "1.5.0")).toBe(true);
      expect(manager.isCompatible("1.0.0", "1.0.1")).toBe(true);
    });

    it("returns false for different major versions", () => {
      expect(manager.isCompatible("1.0.0", "2.0.0")).toBe(false);
      expect(manager.isCompatible("2.0.0", "1.0.0")).toBe(false);
    });
  });

  describe("incrementVersion", () => {
    it("increments major version", () => {
      expect(manager.incrementVersion("1.2.3", "major")).toBe("2.0.0");
    });

    it("increments minor version", () => {
      expect(manager.incrementVersion("1.2.3", "minor")).toBe("1.3.0");
    });

    it("increments patch version", () => {
      expect(manager.incrementVersion("1.2.3", "patch")).toBe("1.2.4");
    });

    it("removes prerelease on increment", () => {
      expect(manager.incrementVersion("1.0.0-beta", "patch")).toBe("1.0.1");
    });
  });

  describe("getLatestVersion", () => {
    it("returns engine version", () => {
      expect(manager.getLatestVersion()).toBe("1.0.0");
    });
  });

  describe("getLatestCompatible", () => {
    it("finds latest compatible version", () => {
      const versions = ["1.0.0", "1.1.0", "1.2.0", "2.0.0", "2.1.0"];
      expect(manager.getLatestCompatible(versions, 1)).toBe("1.2.0");
      expect(manager.getLatestCompatible(versions, 2)).toBe("2.1.0");
    });

    it("returns undefined when no compatible version", () => {
      const versions = ["1.0.0", "1.1.0"];
      expect(manager.getLatestCompatible(versions, 3)).toBeUndefined();
    });
  });
});
