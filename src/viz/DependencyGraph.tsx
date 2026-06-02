import { useEffect, useRef } from "react";
import * as d3 from "d3";

import {
  depNodes,
  depLinks,
  envNodes,
  vulnPath,
  type DepNode,
} from "./graphData.ts";
import { STEP } from "./steps.ts";

type SimNode = DepNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { source: any; target: any };

const W = 920;
const H = 640;
const ENV_R = Math.min(W, H) * 0.36; // ring radius for the environment nodes

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  "#999";

const vulnSet = new Set(vulnPath);

function visibleUpTo(step: number) {
  return step >= 2 ? 2 : step;
}

// Padded convex hull → smooth closed path, used to draw the lockfile and Flox
// boundaries that hug the live force layout.
function hullPath(pts: [number, number][], pad: number): string {
  if (pts.length < 3) return "";
  const hull = d3.polygonHull(pts);
  if (!hull) return "";
  const [cx, cy] = d3.polygonCentroid(hull);
  const expanded = hull.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.hypot(dx, dy) || 1;
    return [x + (dx / d) * pad, y + (dy / d) * pad] as [number, number];
  });
  return d3.line().curve(d3.curveCatmullRomClosed.alpha(0.8))(expanded) ?? "";
}

interface NodeStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  opacity: number;
}

function styleFor(n: SimNode, step: number, palette: Record<string, string>): NodeStyle {
  const limit = visibleUpTo(step);
  const visible = n.revealStep <= limit;
  const base: NodeStyle = {
    fill: n.depth <= 1 ? palette.direct : palette.transitive,
    stroke: "transparent",
    strokeWidth: 0,
    radius: n.id === "root" ? 13 : n.depth === 1 ? 8 : 5,
    opacity: visible ? 1 : 0,
  };
  if (!visible) return base;

  // Reproducible: everything pinned to one calm, uniform state.
  if (step >= STEP.reproducible) {
    base.fill = palette.repro;
    base.stroke = palette.repro;
    base.strokeWidth = 1.5;
    if (n.vulnerable) {
      // pinned to a known-good version — no longer hot
      base.fill = palette.repro;
    }
    return base;
  }

  // Vulnerability stays lit from the vuln step until reproducibility resolves it.
  if (step >= STEP.vulnerability && n.vulnerable) {
    base.fill = palette.vuln;
    base.stroke = palette.vuln;
    base.strokeWidth = 3;
    base.radius = 9;
    return base;
  }

  // SBOM: every component gets cataloged (subtle ink outline).
  if (step === STEP.sbom) {
    base.stroke = "rgba(2,8,23,0.28)";
    base.strokeWidth = 1;
  }

  // Provenance: signed get a gold ring, unsigned flagged rose.
  if (step === STEP.provenance) {
    if (n.signed) {
      base.stroke = palette.signed;
      base.strokeWidth = 1.6;
    } else {
      base.fill = palette.unsigned;
      base.stroke = palette.vuln;
      base.strokeWidth = 1.4;
    }
  }

  // Vulnerability: dim everything except the blast-radius path.
  if (step === STEP.vulnerability) {
    if (!vulnSet.has(n.id) && !n.vulnerable) base.opacity = 0.25;
  }

  return base;
}

export function DependencyGraph({ step }: { step: number }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const sim = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodeSel = useRef<d3.Selection<any, SimNode, any, any> | null>(null);
  const linkSel = useRef<d3.Selection<any, SimLink, any, any> | null>(null);
  const innerPath = useRef<d3.Selection<any, unknown, any, any> | null>(null);
  const outerPath = useRef<d3.Selection<any, unknown, any, any> | null>(null);
  const innerLabel = useRef<d3.Selection<any, unknown, any, any> | null>(null);
  const outerLabel = useRef<d3.Selection<any, unknown, any, any> | null>(null);
  const envSel = useRef<d3.Selection<any, any, any, any> | null>(null);
  const palette = useRef<Record<string, string>>({});
  const stepRef = useRef(step);
  stepRef.current = step;

  // Build the simulation once.
  useEffect(() => {
    palette.current = {
      direct: css("--node-direct"),
      transitive: css("--node-transitive"),
      vuln: css("--node-vuln"),
      signed: css("--node-signed"),
      unsigned: css("--color-gray-300"),
      repro: css("--node-repro"),
      edge: css("--color-gray-300"),
      edgeHot: css("--node-vuln"),
    };

    const nodes: SimNode[] = depNodes.map((n) => ({ ...n }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = depLinks.map((l) => ({
      source: byId.get(l.source)!,
      target: byId.get(l.target)!,
    }));

    const root = byId.get("root")!;
    root.fx = W / 2;
    root.fy = H / 2;

    // Fixed perimeter positions for the environment nodes (outside the JS tree).
    const envPos = envNodes.map((e) => ({
      ...e,
      x: W / 2 + ENV_R * Math.cos(e.angle),
      y: H / 2 + ENV_R * Math.sin(e.angle),
    }));

    const svg = d3.select(ref.current!);
    svg.selectAll("*").remove();
    const g = svg.append("g");

    // Boundary layer sits behind everything.
    const boundaryLayer = g.append("g");
    innerPath.current = boundaryLayer
      .append("path")
      .attr("class", "dep-boundary lock")
      .style("opacity", 0);
    outerPath.current = boundaryLayer
      .append("path")
      .attr("class", "dep-boundary flox")
      .style("opacity", 0);
    innerLabel.current = boundaryLayer
      .append("text")
      .attr("class", "dep-boundary-label")
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .text("package-lock.json");
    outerLabel.current = boundaryLayer
      .append("text")
      .attr("class", "dep-boundary-label")
      .attr("text-anchor", "middle")
      .style("opacity", 0)
      .text("flox");

    const link = g
      .append("g")
      .attr("stroke-linecap", "round")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", palette.current.edge)
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0);

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("fill", palette.current.transitive)
      .attr("opacity", 0)
      .style("cursor", "default");

    node.append("title").text((d) => `${d.name}@${d.version}`);

    // Environment nodes + labels, fixed on the perimeter ring.
    const envG = g
      .append("g")
      .selectAll("g.env")
      .data(envPos)
      .join("g")
      .attr("class", "env")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .style("opacity", 0);
    envG.append("circle").attr("class", "env-node").attr("r", 7);
    envG
      .append("text")
      .attr("class", "env-label")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.y < H / 2 ? -12 : 20))
      .text((d) => d.label);
    envSel.current = envG;

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l: any) => 26 + l.target.depth * 6)
          .strength(0.7),
      )
      .force("charge", d3.forceManyBody().strength(-44))
      .force("collide", d3.forceCollide<SimNode>().radius((d) => (d.id === "root" ? 18 : 9)))
      .force("x", d3.forceX(W / 2).strength(0.05))
      .force("y", d3.forceY(H / 2).strength(0.05))
      .on("tick", () => {
        link
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);
        node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);

        // Redraw the boundaries around the live layout.
        const limit = visibleUpTo(stepRef.current);
        const jsPts = nodes
          .filter((n) => n.revealStep <= limit && n.x != null)
          .map((n) => [n.x!, n.y!] as [number, number]);
        if (!jsPts.length) return;
        const envPts = envPos.map((e) => [e.x, e.y] as [number, number]);

        innerPath.current?.attr("d", hullPath(jsPts, 40));
        outerPath.current?.attr("d", hullPath(jsPts.concat(envPts), 26));

        const innerTop = d3.min(jsPts, (p) => p[1]) ?? H / 2;
        innerLabel.current?.attr("x", W / 2).attr("y", innerTop - 32);
        const outerBottom = d3.max(envPts, (p) => p[1]) ?? H;
        outerLabel.current?.attr("x", W / 2).attr("y", outerBottom + 34);
      });

    sim.current = simulation;
    nodeSel.current = node;
    linkSel.current = link;

    return () => {
      simulation.stop();
    };
  }, []);

  // Restyle on every step change.
  useEffect(() => {
    const node = nodeSel.current;
    const link = linkSel.current;
    if (!node || !link) return;
    const pal = palette.current;

    node
      .transition()
      .duration(620)
      .attr("opacity", (d) => styleFor(d, step, pal).opacity)
      .attr("fill", (d) => styleFor(d, step, pal).fill)
      .attr("stroke", (d) => styleFor(d, step, pal).stroke)
      .attr("stroke-width", (d) => styleFor(d, step, pal).strokeWidth)
      .attr("r", (d) => styleFor(d, step, pal).radius);

    const limit = visibleUpTo(step);
    link
      .transition()
      .duration(620)
      .attr("stroke", (d: any) =>
        step === STEP.vulnerability && vulnSet.has(d.target.id)
          ? pal.edgeHot
          : pal.edge,
      )
      .attr("stroke-width", (d: any) =>
        step === STEP.vulnerability && vulnSet.has(d.target.id) ? 2.4 : 1,
      )
      .attr("stroke-opacity", (d: any) => {
        const tVisible = d.target.revealStep <= limit;
        if (!tVisible) return 0;
        if (step === STEP.vulnerability)
          return vulnSet.has(d.target.id) ? 0.9 : 0.12;
        if (step >= STEP.reproducible) return 0.5;
        return 0.35;
      });

    // Nested-boundary arc: lockfile box → environment nodes → Flox envelope.
    const innerOpacity =
      step === STEP.lockfile ? 0.9 : step === STEP.environment ? 0.45 : 0;
    const outerOpacity = step >= STEP.reproducible ? 1 : 0;
    const envOpacity = step >= STEP.environment ? 1 : 0;

    innerPath.current?.transition().duration(620).style("opacity", innerOpacity);
    innerLabel.current
      ?.transition()
      .duration(620)
      .style("opacity", innerOpacity > 0 ? 1 : 0);
    outerPath.current?.transition().duration(620).style("opacity", outerOpacity);
    outerLabel.current?.transition().duration(620).style("opacity", outerOpacity);
    envSel.current?.transition().duration(620).style("opacity", envOpacity);

    // For the boundary arc, pull the tree into a tight central disk so the
    // boundaries read and the environment ring sits clearly outside it. The
    // earlier steps keep the loose, sprawling "exploded" layout. Collapsing the
    // link distances is what actually compacts the 6-deep tree — centering
    // alone can't overcome the links.
    const tight = step >= STEP.lockfile;
    const linkForce = sim.current?.force("link") as
      | d3.ForceLink<SimNode, SimLink>
      | undefined;
    linkForce
      ?.distance((l: any) => (tight ? 7 : 26 + l.target.depth * 6))
      .strength(tight ? 1 : 0.7);
    (sim.current?.force("charge") as d3.ForceManyBody<SimNode> | undefined)?.strength(
      tight ? -12 : -44,
    );
    sim.current?.force("x", d3.forceX(W / 2).strength(tight ? 0.18 : 0.05));
    sim.current?.force("y", d3.forceY(H / 2).strength(tight ? 0.18 : 0.05));

    // Reheat so newly revealed nodes settle nicely.
    sim.current?.alpha(0.7).restart();
  }, [step]);

  return (
    <svg
      ref={ref}
      className="dep-graph"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Animated npm dependency graph"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
