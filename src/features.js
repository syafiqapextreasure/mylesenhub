// Keep existing programme records available for a future reopening.
export const promotionsEnabled = false;
export const isPausedPromotionPage = (path) =>
  !promotionsEnabled &&
  /^\/dashboard\/institut\/promosi(?:-borang)?\/?$/.test(path);
export const promotionFields = [
  "promotionTitle",
  "promotionDescription",
  "promotionStart",
  "promotionEnd",
  "promotionPoster",
];
