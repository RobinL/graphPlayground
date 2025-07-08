// Tunable constants & colour palettes

export const COLORS = d3.schemeCategory10.slice(1, 6);  // Get the first 5 colors from schemeCategory10

const viewWid = document.documentElement.clientWidth;
export const W = viewWid > 1200 ? 900 : 700;
export const H = W === 900 ? 600 : 500;
export const RAD = 10;

// Color scale for edge probability
export const PROB_COLOR_SCALE = d3.scaleLinear()
  .domain([0, 0.5, 1])
  .range(["red", "orange", "green"]);

// Force simulation constants
export const FORCES = {
  CHARGE_STRENGTH: -300,
  CHARGE_MAX_DISTANCE: W / 2,
  LINK_DISTANCE: d => d.probability === 0 ? 150 : 60,
  LINK_STRENGTH: d => d.probability === 0 ? 0 : 1
};