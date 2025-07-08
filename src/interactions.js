import { PROB_COLOR_SCALE } from './constants.js';

let mousedownNode = null;
let mouseupNode = null;
let dragLine;

let isDraggingProb = false;
let dragStartY;
let dragStartProb;

let svg;
let model;
let restartCallback;
let d3_global;

export function init(d3_obj, svgElement, dataModel, restartFn, simulation_obj) {
  d3_global = d3_obj;
  svg = svgElement;
  model = dataModel;
  restartCallback = restartFn;

  dragLine = svg.append("path")
    .attr("class", "dragLine hidden")
    .attr("d", "M0,0L0,0");

  svg.on("mousedown", () => {
    if (d3_global.event.button === 0) {
      model.addNode(d3_global.mouse(svg.node()));
      restartCallback();
    }
  })
    .on("mousemove", updateDragLine)
    .on("mouseup", hideDragLine)
    .on("contextmenu", function () { d3_global.event.preventDefault(); })
    .on("mouseleave", hideDragLine)
    .on("mousemove.prob", function () {
      if (isDraggingProb) {
        let dy = d3_global.event.y - dragStartY;
        let probChange = -dy * 0.001;

        d3_global.selectAll(".edge-group line.active").each(function (d) {
          d.probability = Math.min(1, Math.max(0, Math.round((dragStartProb + probChange) * 100) / 100));
          let parentGroup = d3_global.select(this.parentNode);
          parentGroup.select("text")
            .text(d.probability.toFixed(2));
          d3_global.select(this).style("stroke", PROB_COLOR_SCALE(d.probability));
          parentGroup.select("text").style("fill", PROB_COLOR_SCALE(d.probability));
        });
      }
    })
    .on("mouseup.prob", function () {
      isDraggingProb = false;
      d3_global.selectAll(".edge-group line").classed("active", false);
    })
    .on("mouseleave.prob", function () {
      if (isDraggingProb) {
        isDraggingProb = false;
        d3_global.selectAll(".edge-group line").classed("active", false);
      }
    });

  d3_global.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);

  d3_global.select("#clear")
    .on('click', function () {
      model.clearGraph();
      restartCallback();
    });
}

function resetMouseVar() {
  mousedownNode = null;
  mouseupNode = null;
}

function hideDragLine() {
  dragLine.classed("hidden", true);
  resetMouseVar();
  restartCallback();
}

export function beginDragLine(d) {
  d3_global.event.stopPropagation();
  d3_global.event.preventDefault();
  if (d3_global.event.ctrlKey || d3_global.event.button != 0) return;
  mousedownNode = d;
  dragLine.classed("hidden", false)
    .attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
      "L" + mousedownNode.x + "," + mousedownNode.y);
}

function updateDragLine() {
  if (!mousedownNode) return;
  dragLine.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
    "L" + d3_global.mouse(svg.node())[0] + "," + d3_global.mouse(svg.node())[1]);
}

export function endDragLine(d) {
  if (!mousedownNode || mousedownNode === d) return;

  model.addLink(mousedownNode, d);
  restartCallback();
}

function keydown() {
  if (d3_global.event.key === "Meta") {
    d3_global.selectAll(".vertex-group").call(d3_global.drag()
      .on("start", function dragstarted(d) {
        if (!d3_global.event.active) simulation_obj.alphaTarget(1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (d) {
        d.fx = d3_global.event.x;
        d.fy = d3_global.event.y;
      })
      .on("end", function (d) {
        if (!d3_global.event.active) simulation_obj.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));
  }
}

export function keyup() {
  if (d3_global.event.key === "Meta") {
    d3_global.selectAll(".vertex-group circle").on("mousedown.drag", null);
  }
}

export function beginProbabilityDrag(d, event) {
    isDraggingProb = true;
    dragStartY = event.y;
    dragStartProb = d.probability;
    d3_global.select(event.currentTarget).classed("active", true);
    event.stopPropagation();
}