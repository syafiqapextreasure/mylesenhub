export const licenceClasses = ["B", "B2", "D", "DA", "QTI"];

export function teachingClasses(profile) {
  const value = profile.spim || profile.classes || [];
  const codes = Array.isArray(value) ? value : String(value).split(/[,;/\s&]+/);
  return [...new Set(codes.map((code) => String(code).trim().toUpperCase()))]
    .filter((code) => licenceClasses.includes(code));
}
