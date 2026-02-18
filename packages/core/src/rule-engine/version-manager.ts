/**
 * 版本管理器 - 管理规则集版本兼容性。
 */

/**
 * 版本信息。
 */
export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

/**
 * 版本管理器。
 */
class VersionManager {
  /** 当前引擎版本 */
  private readonly engineVersion = "1.0.0";

  /**
   * 获取当前引擎版本。
   */
  getLatestVersion(): string {
    return this.engineVersion;
  }

  /**
   * 解析版本字符串。
   */
  parseVersion(version: string): VersionInfo {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) {
      throw new Error(`Invalid version format: "${version}"`);
    }

    const majorStr = match[1];
    const minorStr = match[2];
    const patchStr = match[3];
    if (!majorStr || !minorStr || !patchStr) {
      // 理论上不会发生：正则已保证 1-3 组存在
      throw new Error(`Invalid version format: "${version}"`);
    }

    const info: VersionInfo = {
      major: parseInt(majorStr, 10),
      minor: parseInt(minorStr, 10),
      patch: parseInt(patchStr, 10),
    };

    const prerelease = match[4];
    if (typeof prerelease === "string" && prerelease.length > 0) {
      info.prerelease = prerelease;
    }

    return info;
  }

  /**
   * 比较两个版本。
   *
   * @returns 负数表示 v1 < v2，0 表示相等，正数表示 v1 > v2
   */
  compareVersions(v1: string, v2: string): number {
    const ver1 = this.parseVersion(v1);
    const ver2 = this.parseVersion(v2);

    // 比较主版本
    if (ver1.major !== ver2.major) {
      return ver1.major - ver2.major;
    }

    // 比较次版本
    if (ver1.minor !== ver2.minor) {
      return ver1.minor - ver2.minor;
    }

    // 比较补丁版本
    if (ver1.patch !== ver2.patch) {
      return ver1.patch - ver2.patch;
    }

    // 预发布版本比较
    if (ver1.prerelease && ver2.prerelease) {
      return ver1.prerelease.localeCompare(ver2.prerelease);
    }
    if (ver1.prerelease) return -1; // 预发布版本低于正式版本
    if (ver2.prerelease) return 1;

    return 0;
  }

  /**
   * 检查版本兼容性。
   *
   * 规则：主版本相同即兼容（语义化版本）。
   */
  isCompatible(v1: string, v2: string): boolean {
    const ver1 = this.parseVersion(v1);
    const ver2 = this.parseVersion(v2);

    return ver1.major === ver2.major;
  }

  /**
   * 检查规则集版本是否与引擎兼容。
   */
  isRuleSetCompatible(ruleSetVersion: string): boolean {
    return this.isCompatible(ruleSetVersion, this.engineVersion);
  }

  /**
   * 获取版本范围内的最新版本。
   */
  getLatestCompatible(versions: string[], targetMajor: number): string | undefined {
    const compatible = versions
      .filter((v) => {
        try {
          return this.parseVersion(v).major === targetMajor;
        } catch {
          return false;
        }
      })
      .sort((a, b) => this.compareVersions(b, a));

    return compatible[0];
  }

  /**
   * 格式化版本信息。
   */
  formatVersion(info: VersionInfo): string {
    let version = `${info.major}.${info.minor}.${info.patch}`;
    if (info.prerelease) {
      version += `-${info.prerelease}`;
    }
    return version;
  }

  /**
   * 递增版本号。
   */
  incrementVersion(
    version: string,
    type: "major" | "minor" | "patch"
  ): string {
    const info = this.parseVersion(version);

    switch (type) {
      case "major":
        info.major++;
        info.minor = 0;
        info.patch = 0;
        break;
      case "minor":
        info.minor++;
        info.patch = 0;
        break;
      case "patch":
        info.patch++;
        break;
    }

    // exactOptionalPropertyTypes：可选字段不要显式赋值 undefined
    delete info.prerelease;
    return this.formatVersion(info);
  }
}

/**
 * 全局版本管理器实例。
 */
export const versionManager = new VersionManager();

export { VersionManager };
