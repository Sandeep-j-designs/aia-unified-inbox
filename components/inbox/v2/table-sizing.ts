/** Automatic layouts adapt; manual layouts retain exact CSS-pixel widths. */
export const COLUMN_SIZES: Record<
  string,
  { min: number; preferred: number; max: number }
> = {
  File: { min: 180, preferred: 240, max: 600 },
  Source: { min: 110, preferred: 120, max: 200 },
  User: { min: 150, preferred: 200, max: 360 },
  Vendor: { min: 120, preferred: 160, max: 360 },
  "Voucher type": { min: 140, preferred: 150, max: 240 },
  "GST Registration": { min: 150, preferred: 180, max: 360 },
  Amount: { min: 120, preferred: 130, max: 220 },
  Received: { min: 168, preferred: 190, max: 280 },
  Status: { min: 120, preferred: 130, max: 200 },
};
export const SELECT_WIDTH = 40;
/**
 * The kebab column. Fixed, like the checkbox: it holds one 32px button, so
 * there is nothing in it for extra width to do, and both bookends stay out of
 * the distribution below.
 */
export const ACTIONS_WIDTH = 78;
export const DEFAULT_WIDTHS = Object.fromEntries(
  Object.entries(COLUMN_SIZES).map(([key, size]) => [key, size.preferred])
);
export function clampWidth(column: string, value: number) {
  const size = COLUMN_SIZES[column];
  return Math.round(
    Math.max(
      size.min,
      Math.min(size.max, Number.isFinite(value) ? value : size.preferred)
    )
  );
}
export function readWidths(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key, width]) =>
          Object.prototype.hasOwnProperty.call(COLUMN_SIZES, key) &&
          typeof width === "number" &&
          Number.isFinite(width)
      )
      .map(([key, width]) => [key, clampWidth(key, width as number)])
  );
}
export function sizeColumns(
  shown: string[],
  available: number | null,
  manual: Record<string, number>
): Record<string, number> {
  if (Object.keys(manual).length)
    return Object.fromEntries(
      shown.map((key) => [
        key,
        clampWidth(key, manual[key] ?? DEFAULT_WIDTHS[key]),
      ])
    );
  const preferred = shown.reduce(
    (sum, key) => sum + COLUMN_SIZES[key].preferred,
    0
  );
  const minimum = shown.reduce((sum, key) => sum + COLUMN_SIZES[key].min, 0);
  const maximum = shown.reduce((sum, key) => sum + COLUMN_SIZES[key].max, 0);
  const target = Math.round(
    Math.max(
      minimum,
      Math.min(
        maximum,
        available === null
          ? preferred
          : available - SELECT_WIDTH - ACTIONS_WIDTH
      )
    )
  );
  const growing = target >= preferred;
  const room = growing ? maximum - preferred : preferred - minimum;
  // Carry rounding across columns so exact fits never create a 1px scrollbar.
  let fractional = 0,
    allocated = 0;
  return Object.fromEntries(
    shown.map((key) => {
      const size = COLUMN_SIZES[key];
      const capacity = growing
        ? size.max - size.preferred
        : size.preferred - size.min;
      fractional +=
        size.preferred + (room ? ((target - preferred) * capacity) / room : 0);
      const width = Math.round(fractional) - allocated;
      allocated += width;
      return [key, width];
    })
  );
}
