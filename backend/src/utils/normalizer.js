// backend/src/utils/normalizers.js
export function normalizeGenero(input) {
  if (!input) return "NO ESPECIFICADO";

  const v = String(input).trim().toUpperCase().replace(/\s+/g, " ");

  if (["M", "MASC", "MASCULINO"].includes(v)) return "MASCULINO";
  if (["F", "FEM", "FEMENINO"].includes(v)) return "FEMENINO";
  if (
    [
      "N",
      "NO ESPECIFICADO",
      "NO_ESPECIFICADO",
      "NO-ESPECIFICADO",
      "NE",
      "NOESPECIFICADO",
    ].includes(v)
  )
    return "NO ESPECIFICADO";

  return "NO ESPECIFICADO";
}
