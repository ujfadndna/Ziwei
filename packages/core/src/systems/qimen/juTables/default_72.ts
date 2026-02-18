import type { QimenJuTableDefinition } from "../../../types";

/**
 * default_72:
 * 节气 × 上中下元（每元 5 日）的 72 局查表。
 *
 * 数据来源：
 * - 初版取自开源项目 qfdk/qimen 的 `JIE_QI_JU_SUAN` 常量
 *   （https://github.com/qfdk/qimen/blob/master/lib/qimen.js）
 * - 该项目将每个节气对应为一个三位数字（上/中/下元）。
 *
 * 可替换格式：
 * - 通过相同结构的 `QimenJuTableDefinition` 传入 registry，
 *   即可替换默认 72 局表。
 */
export const DEFAULT_72_JU_TABLE: QimenJuTableDefinition = {
  id: "default_72",
  source: "qfdk/qimen JIE_QI_JU_SUAN (normalized)",
  description: "24节气 × 三元（每元5日）局数映射",
  entries: {
    冬至: { solarTerm: "冬至", recommendedDun: "yang", upper: 1, middle: 7, lower: 4 },
    小寒: { solarTerm: "小寒", recommendedDun: "yang", upper: 2, middle: 8, lower: 5 },
    大寒: { solarTerm: "大寒", recommendedDun: "yang", upper: 3, middle: 9, lower: 6 },
    立春: { solarTerm: "立春", recommendedDun: "yang", upper: 8, middle: 5, lower: 2 },
    雨水: { solarTerm: "雨水", recommendedDun: "yang", upper: 9, middle: 6, lower: 3 },
    惊蛰: { solarTerm: "惊蛰", recommendedDun: "yang", upper: 1, middle: 7, lower: 4 },
    春分: { solarTerm: "春分", recommendedDun: "yang", upper: 3, middle: 9, lower: 6 },
    清明: { solarTerm: "清明", recommendedDun: "yang", upper: 4, middle: 1, lower: 7 },
    谷雨: { solarTerm: "谷雨", recommendedDun: "yang", upper: 5, middle: 2, lower: 8 },
    立夏: { solarTerm: "立夏", recommendedDun: "yang", upper: 4, middle: 1, lower: 7 },
    小满: { solarTerm: "小满", recommendedDun: "yang", upper: 5, middle: 2, lower: 8 },
    芒种: { solarTerm: "芒种", recommendedDun: "yang", upper: 6, middle: 3, lower: 9 },
    夏至: { solarTerm: "夏至", recommendedDun: "yin", upper: 9, middle: 3, lower: 6 },
    小暑: { solarTerm: "小暑", recommendedDun: "yin", upper: 8, middle: 2, lower: 5 },
    大暑: { solarTerm: "大暑", recommendedDun: "yin", upper: 7, middle: 1, lower: 4 },
    立秋: { solarTerm: "立秋", recommendedDun: "yin", upper: 2, middle: 5, lower: 8 },
    处暑: { solarTerm: "处暑", recommendedDun: "yin", upper: 1, middle: 4, lower: 7 },
    白露: { solarTerm: "白露", recommendedDun: "yin", upper: 9, middle: 3, lower: 6 },
    秋分: { solarTerm: "秋分", recommendedDun: "yin", upper: 7, middle: 1, lower: 4 },
    寒露: { solarTerm: "寒露", recommendedDun: "yin", upper: 6, middle: 9, lower: 3 },
    霜降: { solarTerm: "霜降", recommendedDun: "yin", upper: 5, middle: 8, lower: 2 },
    立冬: { solarTerm: "立冬", recommendedDun: "yin", upper: 6, middle: 9, lower: 3 },
    小雪: { solarTerm: "小雪", recommendedDun: "yin", upper: 5, middle: 8, lower: 2 },
    大雪: { solarTerm: "大雪", recommendedDun: "yin", upper: 4, middle: 7, lower: 1 },
  },
};
