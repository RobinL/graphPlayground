import { FORCES, W, H } from './constants.js';

let simulation;
let tickCallback;

export function init(d3_global, callback) {
  tickCallback = callback;
  simulation = d3_global.forceSimulation()
    .force("charge", d3.forceManyBody().strength(FORCES.CHARGE_STRENGTH).distanceMax(FORCES.CHARGE_MAX_DISTANCE))
    .force("link", d3.forceLink().distance(FORCES.LINK_DISTANCE).strength(FORCES.LINK_STRENGTH))
    .force("x", d3.forceX(W / 2))
    .force("y", d3.forceY(H / 2))
    .on("tick", tick);

  return simulation;
}

export function update(nodes, links) {
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(0.8).restart();
}

function tick() {
  tickCallback();
}