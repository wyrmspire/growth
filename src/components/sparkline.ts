/**
 * sparkline.ts — FW-7
 * Tiny inline SVG trend-line renderer. Self-contained, no dependencies.
 * Returns an inline SVG string suitable for insertion into innerHTML.
 *
 * Target phase: P7 (Dashboard Premium)
 */

export interface SparklineOptions {
  /** Width of the SVG element in pixels. Default: 80 */
  width?: number;
  /** Height of the SVG element in pixels. Default: 24 */
  height?: number;
  /** Stroke color. Default: currentColor */
  color?: string;
  /** Stroke width. Default: 1.5 */
  strokeWidth?: number;
  /** Whether to fill the area under the line. Default: false */
  fill?: boolean;
}

/**
 * Render a sparkline as an inline SVG string.
 *
 * Edge cases:
 * - Empty array → returns an empty SVG shell (no polyline)
 * - Single value → horizontal line at mid-height
 * - All same values → flat horizontal line (treated as flat range)
 *
 * @param values - Array of numeric data points to plot.
 * @param opts   - Optional rendering configuration.
 * @returns An inline `<svg>` string.
 */
export function renderSparkline(
  values: number[],
  opts: SparklineOptions = {},
): string {
  const {
    width = 80,
    height = 24,
    color = 'currentColor',
    strokeWidth = 1.5,
    fill = false,
  } = opts;

  const svgOpen = `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="${width}"
    height="${height}"
    viewBox="0 0 ${width} ${height}"
    aria-hidden="true"
    focusable="false"
    style="display:inline-block;vertical-align:middle;overflow:visible"
  >`;
  const svgClose = '</svg>';

  // Empty array → empty SVG
  if (values.length === 0) {
    return `${svgOpen}${svgClose}`;
  }

  const padding = strokeWidth;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // Flat line / single value: range = 0, place at vertical midpoint
  const range = max - min || 1;

  let points: string[];

  if (values.length === 1) {
    // Single value → horizontal line across full width at mid-height
    const y = (height / 2).toFixed(2);
    points = [`${padding.toFixed(2)},${y}`, `${(padding + plotWidth).toFixed(2)},${y}`];
  } else {
    points = values.map((v, i) => {
      const x = padding + (i / (values.length - 1)) * plotWidth;
      // Invert Y: SVG origin is top-left
      const y = padding + (1 - (v - min) / range) * plotHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
  }

  const pointsStr = points.join(' ');

  // Build optional fill path (area under the line, closed to baseline)
  let fillPath = '';
  if (fill && points.length >= 2) {
    const firstX = padding.toFixed(2);
    const lastX = (padding + plotWidth).toFixed(2);
    const baseY = (padding + plotHeight).toFixed(2);
    fillPath = `<path
        d="M ${firstX},${baseY} L ${points.join(' L ')} L ${lastX},${baseY} Z"
        fill="${color}"
        fill-opacity="0.12"
        stroke="none"
      />`;
  }

  return `${svgOpen}${fillPath}
    <polyline
      points="${pointsStr}"
      fill="none"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  ${svgClose}`;
}
