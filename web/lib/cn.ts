/**
 * Minimal class concatenator. No tailwind-merge: by contract, `className`
 * on the ui/ primitives is only for layout (margin, width, grid), never for
 * restyling — so there's no need to resolve utility collisions.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
