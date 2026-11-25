export const profileLanguages = ["Melayu", "Inggeris", "Cina", "India"];

export function registeredInstituteNames(institutes = []) {
  const names = institutes
    .filter(
      (item) =>
        !item.demo &&
        ![item.hidden, item._hidden].some(
          (value) => value === true || value === "true",
        ),
    )
    .map((item) => item.name?.trim())
    .filter(Boolean);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b, "ms"));
}
