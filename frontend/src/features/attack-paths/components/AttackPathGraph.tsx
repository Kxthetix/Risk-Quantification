"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  ShieldAlert,
  Globe,
  Server,
  Database,
  Key,
  Bug,
  Lock,
  Cloud,
  ShieldCheck,
  User,
  Briefcase,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttackGraphData, GraphVisualNode, GraphVisualEdge } from "../types";
import { NODE_TYPE_CONFIG, EDGE_TYPE_CONFIG } from "../constants";

export interface AttackPathGraphProps {
  data?: AttackGraphData;
  isLoading?: boolean;
  focusedPathNodeIds?: string[];
  onSelectNode?: (node: GraphVisualNode | null) => void;
  selectedNodeId?: string | null;
  height?: number | string;
}

export function AttackPathGraph({
  data,
  isLoading = false,
  focusedPathNodeIds,
  onSelectNode,
  selectedNodeId,
  height = 540,
}: AttackPathGraphProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Fallback / default graph data if backend returns empty during demo
  const nodes: GraphVisualNode[] = useMemo(() => {
    if (data?.nodes && data.nodes.length > 0) return data.nodes;
    return [
      { id: "node-internet", label: "Internet (Adversary)", type: "INTERNET", risk_score: 95.0, is_entry_point: true },
      { id: "node-vpn", label: "VPN Gateway (CVE-2024-3094)", type: "ENTRY_POINT", risk_score: 92.0, is_entry_point: true },
      { id: "node-app", label: "Payment API Server", type: "APPLICATION", criticality: "CRITICAL", risk_score: 88.0, is_entry_point: false },
      { id: "node-ad", label: "Domain Controller (AD)", type: "IDENTITY", criticality: "CRITICAL", risk_score: 94.0, is_entry_point: false },
      { id: "node-db", label: "Primary Financial DB", type: "DATABASE", criticality: "CRITICAL", risk_score: 96.0, is_entry_point: false },
      { id: "node-backup", label: "Cold Backup Store", type: "CLOUD_RESOURCE", criticality: "HIGH", risk_score: 72.0, is_entry_point: false },
      { id: "node-waf", label: "WAF Filter (Active)", type: "SECURITY_CONTROL", risk_score: 10.0, is_entry_point: false },
    ];
  }, [data]);

  const edges: GraphVisualEdge[] = useMemo(() => {
    if (data?.edges && data.edges.length > 0) return data.edges;
    return [
      { id: "e1", source: "node-internet", target: "node-vpn", type: "NETWORK_REACHABILITY", probability: 0.95, confidence: 0.9, is_blocked: false },
      { id: "e2", source: "node-vpn", target: "node-app", type: "EXPLOITATION", probability: 0.85, confidence: 0.88, is_blocked: false },
      { id: "e3", source: "node-app", target: "node-ad", type: "PRIVILEGE_ESCALATION", probability: 0.78, confidence: 0.85, is_blocked: false },
      { id: "e4", source: "node-ad", target: "node-db", type: "DATA_ACCESS", probability: 0.90, confidence: 0.92, is_blocked: false },
      { id: "e5", source: "node-app", target: "node-backup", type: "LATERAL_MOVEMENT", probability: 0.45, confidence: 0.70, is_blocked: true, blocking_reason: "Network ACL Segmented" },
    ];
  }, [data]);

  // Compute 2D node layout positions
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const total = nodes.length;
    if (total === 0) return positions;

    // Structured hierarchical layout by layer/type
    const typeOrder = [
      "INTERNET",
      "ENTRY_POINT",
      "APPLICATION",
      "ASSET",
      "IDENTITY",
      "DATABASE",
      "CLOUD_RESOURCE",
      "SECURITY_CONTROL",
      "USER",
      "BUSINESS_SERVICE",
    ];

    const layers: Record<number, GraphVisualNode[]> = {};
    nodes.forEach((node) => {
      let layerIdx = typeOrder.indexOf(node.type.toUpperCase());
      if (layerIdx === -1) layerIdx = 3;
      if (!layers[layerIdx]) layers[layerIdx] = [];
      layers[layerIdx].push(node);
    });

    const activeLayers = Object.keys(layers).map(Number).sort((a, b) => a - b);
    const width = 840;
    const heightBound = 420;

    activeLayers.forEach((layerIdx, colIdx) => {
      const layerNodes = layers[layerIdx];
      const x = 90 + colIdx * (width / Math.max(1, activeLayers.length - 0.5));
      layerNodes.forEach((node, rowIdx) => {
        const y = 80 + ((rowIdx + 1) * heightBound) / (layerNodes.length + 1);
        positions[node.id] = { x, y };
      });
    });

    return positions;
  }, [nodes]);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, prev + 0.2));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, prev - 0.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectNode?.(null);
  };

  const filteredNodes = useMemo(() => {
    if (filterType === "ALL") return nodes;
    return nodes.filter((n) => n.type.toUpperCase() === filterType);
  }, [nodes, filterType]);

  const getNodeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "INTERNET":
        return Globe;
      case "ENTRY_POINT":
        return ShieldAlert;
      case "DATABASE":
        return Database;
      case "IDENTITY":
        return Key;
      case "VULNERABILITY":
        return Bug;
      case "CREDENTIAL":
        return Lock;
      case "CLOUD_RESOURCE":
        return Cloud;
      case "SECURITY_CONTROL":
        return ShieldCheck;
      case "USER":
        return User;
      case "BUSINESS_SERVICE":
        return Briefcase;
      default:
        return Server;
    }
  };

  return (
    <div className="relative border border-border rounded-xl bg-card/60 backdrop-blur-md overflow-hidden shadow-sm flex flex-col">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive Attack Topology</span>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono h-5">
            {nodes.length} Nodes · {edges.length} Edges
          </Badge>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs bg-background border border-border rounded-md px-2 py-1 h-7 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter graph nodes"
          >
            <option value="ALL">All Types</option>
            <option value="INTERNET">Internet</option>
            <option value="ENTRY_POINT">Entry Points</option>
            <option value="APPLICATION">Applications</option>
            <option value="IDENTITY">Identities</option>
            <option value="DATABASE">Databases</option>
            <option value="SECURITY_CONTROL">Controls</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            className="h-7 w-7 p-0"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            className="h-7 w-7 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="h-7 w-7 p-0"
            title="Reset View"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={showLegend ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowLegend(!showLegend)}
            className="h-7 px-2 text-xs gap-1"
          >
            <Layers className="h-3 w-3" />
            <span>Legend</span>
          </Button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        className="relative w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        >
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="28"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
            <marker
              id="arrow-critical"
              viewBox="0 0 10 10"
              refX="28"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            <marker
              id="arrow-blocked"
              viewBox="0 0 10 10"
              refX="28"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. Render Edges */}
            {edges.map((edge) => {
              const srcPos = nodePositions[edge.source];
              const dstPos = nodePositions[edge.target];
              if (!srcPos || !dstPos) return null;

              const isEdgeFocused =
                focusedPathNodeIds &&
                focusedPathNodeIds.includes(edge.source) &&
                focusedPathNodeIds.includes(edge.target);

              const edgeConfig = EDGE_TYPE_CONFIG[edge.type] || {
                label: edge.type,
                stroke: "#64748b",
                style: "solid",
              };

              const strokeColor = edge.is_blocked
                ? "#10b981"
                : isEdgeFocused
                ? "#f43f5e"
                : edgeConfig.stroke;

              const strokeWidth = isEdgeFocused ? 3 : 1.75;
              const strokeDasharray =
                edgeConfig.style === "dashed"
                  ? "5,4"
                  : edgeConfig.style === "dotted"
                  ? "2,3"
                  : undefined;

              const midX = (srcPos.x + dstPos.x) / 2;
              const midY = (srcPos.y + dstPos.y) / 2;

              return (
                <g key={edge.id} className="transition-all duration-300">
                  <path
                    d={`M ${srcPos.x} ${srcPos.y} Q ${midX} ${midY - 15} ${dstPos.x} ${dstPos.y}`}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    markerEnd={
                      edge.is_blocked
                        ? "url(#arrow-blocked)"
                        : isEdgeFocused
                        ? "url(#arrow-critical)"
                        : "url(#arrow-default)"
                    }
                    opacity={focusedPathNodeIds && !isEdgeFocused ? 0.25 : 0.85}
                  />
                  {/* Edge Type Label */}
                  <text
                    x={midX}
                    y={midY - 8}
                    fill={strokeColor}
                    fontSize={9}
                    textAnchor="middle"
                    className="font-mono select-none"
                    opacity={focusedPathNodeIds && !isEdgeFocused ? 0.3 : 0.8}
                  >
                    {edge.is_blocked ? "⛔ BLOCKED" : edgeConfig.label}
                  </text>
                </g>
              );
            })}

            {/* 2. Render Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id] || { x: 100, y: 100 };
              const isSelected = selectedNodeId === node.id;
              const isFocused =
                !focusedPathNodeIds || focusedPathNodeIds.includes(node.id);

              const config =
                NODE_TYPE_CONFIG[node.type.toUpperCase()] || NODE_TYPE_CONFIG.ASSET;
              const Icon = getNodeIcon(node.type);

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode?.(node);
                  }}
                  className="cursor-pointer group"
                  opacity={isFocused ? 1 : 0.25}
                >
                  {/* Outer Pulsing Aura for Entry or Critical Target */}
                  {node.is_entry_point && (
                    <circle
                      r={24}
                      className="fill-amber-500/10 animate-ping opacity-75"
                    />
                  )}
                  {node.risk_score >= 90 && (
                    <circle
                      r={26}
                      className="fill-rose-500/10 animate-pulse opacity-75"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={20}
                    className={`transition-all duration-200 stroke-2 ${
                      isSelected
                        ? "fill-primary/20 stroke-primary stroke-[3]"
                        : `${config.bg} ${config.border} hover:stroke-primary`
                    }`}
                  />

                  {/* Icon */}
                  <foreignObject x={-10} y={-10} width={20} height={20}>
                    <div className="flex items-center justify-center h-full w-full">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                  </foreignObject>

                  {/* Node Title */}
                  <text
                    y={32}
                    textAnchor="middle"
                    className="text-[11px] font-semibold fill-foreground select-none pointer-events-none drop-shadow"
                  >
                    {node.label.length > 22
                      ? `${node.label.slice(0, 20)}…`
                      : node.label}
                  </text>

                  {/* Risk Score Pill */}
                  <text
                    y={44}
                    textAnchor="middle"
                    className={`text-[9px] font-mono select-none ${
                      node.risk_score >= 80
                        ? "fill-rose-400 font-bold"
                        : "fill-muted-foreground"
                    }`}
                  >
                    Risk: {node.risk_score}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend Box */}
        {showLegend && (
          <div className="absolute bottom-3 left-3 bg-card/90 border border-border rounded-lg p-2.5 backdrop-blur-md text-[10px] space-y-1.5 shadow-md max-w-xs z-10">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span>Node Types &amp; Relationships</span>
              <button
                onClick={() => setShowLegend(false)}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span>Internet Entry</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Entry Point</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span>Asset / Server</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span>Crown Jewel DB</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-purple-400" />
                <span>Identity / AD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span>Defensive Control</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
