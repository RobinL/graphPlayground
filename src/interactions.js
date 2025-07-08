import * as d3 from 'https://cdnjs.cloudflare.com/ajax/libs/d3/5.16.0/d3.min.js';
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

export function init(svgElement, dataModel, restartFn) {
  svg = svgElement;
  model = dataModel;
  restartCallback = restartFn;

  dragLine = svg.append("path")
    .attr("class", "dragLine hidden")
    .attr("d", "M0,0L0,0");

  svg.on("mousedown", () => {
    if (d3.event.button === 0) {
      model.addNode(d3.mouse(svg.node()));
      restartCallback();
    }
  })
    .on("mousemove", updateDragLine)
    .on("mouseup", hideDragLine)
    .on("contextmenu", function () { d3.event.preventDefault(); })
    .on("mouseleave", hideDragLine)
    .on("mousemove.prob", function () {
      if (isDraggingProb) {
        let dy = d3.event.y - dragStartY;
        let probChange = -dy * 0.001;

        d3.selectAll(".edge-group line.active").each(function (d) {
          d.probability = Math.min(1, Math.max(0, Math.round((dragStartProb + probChange) * 100) / 100));
          let parentGroup = d3.select(this.parentNode);
          parentGroup.select("text")
            .text(d.probability.toFixed(2));
          d3.select(this).style("stroke", PROB_COLOR_SCALE(d.probability));
          parentGroup.select("text").style("fill", PROB_COLOR_SCALE(d.probability));
        });
      }
    })
    .on("mouseup.prob", function () {
      isDraggingProb = false;
      d3.selectAll(".edge-group line").classed("active", false);
    })
    .on("mouseleave.prob", function () {
      if (isDraggingProb) {
        isDraggingProb = false;
        d3.selectAll(".edge-group line").classed("active", false);
      }
    });

  d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
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

function beginDragLine(d) {
  d3.event.stopPropagation();
  d3.event.preventDefault();
  if (d3.event.ctrlKey || d3.event.button != 0) return;
  mousedownNode = d;
  dragLine.classed("hidden", false)
    .attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
      "L" + mousedownNode.x + "," + mousedownNode.y);
}

function updateDragLine() {
  if (!mousedownNode) return;
  dragLine.attr("d", "M" + mousedownNode.x + "," + mousedownNode.y +
    "L" + d3.mouse(svg.node())[0] + "," + d3.mouse(svg.node())[1]);
}

function endDragLine(d) {
  if (!mousedownNode || mousedownNode === d) return;

  model.addLink(mousedownNode, d);
  restartCallback();
}

function keydown() {
  if (d3.event.key === "Meta") {
    d3.selectAll(".vertex-group").call(d3.drag()
      .on("start", function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", function (d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
      })
      .on("end", function (d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }));
  }
}

function keyup() {
  if (d3.event.key === "Meta") {
    d3.selectAll(".vertex-group circle").on("mousedown.drag", null);
  }
}