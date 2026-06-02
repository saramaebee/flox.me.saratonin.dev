import { useEffect, useRef } from "react";
import * as d3 from "d3";

import {
  depNodes,
  depLinks,
  vulnId,
  vulnPath,
  type DepNode,
} from "./graphData.ts";

type SimNode = DepNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { source: any; target: any };

const W = 920;
const H = 640;

const css = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
  "#999";

const vulnSet = new Set(vulnPath);

function visibleUpTo(step: number) {
  return step >= 2 ? 2 : step;
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

  // Step 6 — reproducible: everything pinned to one calm, uniform state.
  if (step >= 6) {
    base.fill = n.id === "root" ? palette.repro : palette.repro;
    base.stroke = palette.repro;
    base.strokeWidth = 1.5;
    if (n.vulnerable) {
      // pinned to a known-good version — no longer hot
      base.fill = palette.repro;
    }
    return base;
  }

  // Step 4+ — vulnerability stays lit until reproducibility resolves it.
  if (step >= 3 && n.vulnerable) {
    base.fill = palette.vuln;
    base.stroke = palette.vuln;
    base.strokeWidth = 3;
    base.radius = 9;
    return base;
  }

  // Step 4 — SBOM: every component gets cataloged (subtle ink outline).
  if (step === 4) {
    base.stroke = "rgba(2,8,23,0.28)";
    base.strokeWidth = 1;
  }

  // Step 5 — provenance: signed get a gold ring, unsigned flagged rose.
  if (step === 5) {
    if (n.signed) {
      base.stroke = palette.signed;
      base.strokeWidth = 1.6;
    } else {
      base.fill = palette.unsigned;
      base.stroke = palette.vuln;
      base.strokeWidth = 1.4;
    }
  }

  // Step 3 — vulnerability: dim everything except the blast-radius path.
  if (step === 3) {
    if (!vulnSet.has(n.id) && !n.vulnerable) base.opacity = 0.25;
  }

  return base;
}

export function DependencyGraph({ step }: { step: number }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const sim = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const nodeSel = useRef<d3.Selection<any, SimNode, any, any> | null>(null);
  const linkSel = useRef<d3.Selection<any, SimLink, any, any> | null>(null);
  const palette = useRef<Record<string, string>>({});

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

    const svg = d3.select(ref.current!);
    svg.selectAll("*").remove();
    const g = svg.append("g");

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
        step === 3 && vulnSet.has(d.target.id) ? pal.edgeHot : pal.edge,
      )
      .attr("stroke-width", (d: any) =>
        step === 3 && vulnSet.has(d.target.id) ? 2.4 : 1,
      )
      .attr("stroke-opacity", (d: any) => {
        const tVisible = d.target.revealStep <= limit;
        if (!tVisible) return 0;
        if (step === 3) return vulnSet.has(d.target.id) ? 0.9 : 0.12;
        if (step >= 6) return 0.5;
        return 0.35;
      });

    // Reheat so newly revealed nodes settle nicely.
    sim.current?.alpha(0.45).restart();
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
