/**
 * 星曜安星模块导出。
 */

// 主星安星
export {
  getZiweiPosition,
  getZiweiSeriesPositions,
  ZIWEI_SERIES_STARS,
} from "./major/ziwei-series";

export {
  getTianfuPosition,
  getTianfuSeriesPositions,
  getAllMajorStarPositions,
  TIANFU_SERIES_STARS,
} from "./major/tianfu-series";

// 六吉星安星
export {
  getLeftAssistantPosition,
  getRightAssistantPosition,
  getWenchangPosition,
  getWenchangPositionByTimeBranch,
  getWenquPosition,
  getWenquPositionByTimeBranch,
  getTiankuiPosition,
  getTianyuePosition,
} from "./minor/liu-ji";

// 六煞星及相关星曜安星
export {
  getLucunPosition,
  getQingyangPosition,
  getTuoluoPosition,
  getFireStarPosition,
  getBellStarPosition,
  getDikongPosition,
  getDijiePosition,
  getTianmaPosition,
} from "./minor/liu-sha";

export { getAdjectiveStarPositions, type AdjectiveStarInput } from "./minor/adjective";

// 亮度计算
export {
  getBrightness,
  isAuspiciousBrightness,
  isInauspiciousBrightness,
  BRIGHTNESS_TABLE,
} from "./brightness";
