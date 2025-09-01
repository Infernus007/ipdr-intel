'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Network,
  Search,
  Users,
  Activity,
  Eye,
  EyeOff,
  Maximize2,
  Download,
  RotateCcw,
  Info,
  EyeOff as EyeOffIcon,
  Shield,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IPDRRecord, GraphNode, GraphEdge, GraphData } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  NodeTypes,
  Panel,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface NetworkVisualizationProps {
  className?: string;
}

interface GraphSettings {
  type: 'flowchart' | 'graph' | 'mindmap';
  layout: 'TD' | 'LR' | 'BT' | 'RL';
  maxNodes: number;
  minConnections: number;
  showLabels: boolean;
  showWeights: boolean;
  searchFilter: string;
  nodeSpacing: number;
  edgeSpacing: number;
}

const INITIAL_SETTINGS: GraphSettings = {
  type: 'graph',
  layout: 'TD',
  maxNodes: 50,
  minConnections: 1,
  showLabels: true,
  showWeights: true,
  searchFilter: '',
  nodeSpacing: 100,
  edgeSpacing: 50
};

// Improved Custom Node Component
const CustomNode = ({ data }: { data: any }) => {
  const nodeSize = Math.max(30, Math.min(60, (data.size || 1) * 8));
  
  return (
    <div
      className="relative group"
      style={{ width: nodeSize, height: nodeSize }}
    >
      {/* Main node circle */}
      <div
        className="w-full h-full rounded-full border-2 bg-white shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl cursor-pointer"
        style={{
          borderWidth: Math.max(2, Math.min(4, (data.size || 1) / 2)),
          backgroundColor: data.color || '#ffffff',
          borderColor: data.borderColor || '#3b82f6'
        }}
      >
        <div className="text-xs font-medium text-center leading-tight p-1">
          {data.label?.length > 10 ? `${data.label.substring(0, 8)}...` : data.label}
        </div>
      </div>
      
      {/* Connection count badge */}
      {data.size > 0 && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {data.size}
        </div>
      )}
      
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
        <div className="font-medium">{data.label}</div>
        {data.type && <div className="text-gray-300">Type: {data.type}</div>}
        <div className="text-gray-300">
          {data.size > 0 ? `Connections: ${data.size}` : 'No connections'}
        </div>
        {data.metadata?.operator && <div className="text-gray-300">Operator: {data.metadata.operator}</div>}
      </div>
      
      {/* React Flow Handles */}
      <Handle type="source" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} className="opacity-0" />
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Right} className="opacity-0" />
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode
};

// Force-directed layout algorithm
const calculateLayout = (nodes: GraphNode[], edges: GraphEdge[], settings: GraphSettings) => {
  if (nodes.length === 0) return [];

  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize positions randomly
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200
    });
  });

  // Simple force-directed positioning
  for (let iteration = 0; iteration < 100; iteration++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    
    // Initialize forces
    nodes.forEach(node => {
      forces.set(node.id, { fx: 0, fy: 0 });
    });

    // Repulsion between all nodes
    nodes.forEach(nodeA => {
      nodes.forEach(nodeB => {
        if (nodeA.id === nodeB.id) return;
        
        const posA = positions.get(nodeA.id)!;
        const posB = positions.get(nodeB.id)!;
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const repulsion = settings.nodeSpacing * settings.nodeSpacing / distance;
        const forceA = forces.get(nodeA.id)!;
        forceA.fx += (dx / distance) * repulsion;
        forceA.fy += (dy / distance) * repulsion;
      });
    });

    // Attraction for connected nodes
    edges.forEach(edge => {
      const posSource = positions.get(edge.source);
      const posTarget = positions.get(edge.target);
      if (!posSource || !posTarget) return;

      const dx = posTarget.x - posSource.x;
      const dy = posTarget.y - posSource.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const attraction = distance / (settings.nodeSpacing * 2);
      
      const forceSource = forces.get(edge.source)!;
      const forceTarget = forces.get(edge.target)!;
      
      forceSource.fx += (dx / distance) * attraction;
      forceSource.fy += (dy / distance) * attraction;
      forceTarget.fx -= (dx / distance) * attraction;
      forceTarget.fy -= (dy / distance) * attraction;
    });

    // Apply forces with damping
    const damping = 0.1;
    nodes.forEach(node => {
      const pos = positions.get(node.id)!;
      const force = forces.get(node.id)!;
      
      pos.x += force.fx * damping;
      pos.y += force.fy * damping;
      
      // Keep nodes within bounds
      pos.x = Math.max(50, Math.min(width - 50, pos.x));
      pos.y = Math.max(50, Math.min(height - 50, pos.y));
    });
  }

  // Convert to React Flow format
  return nodes.map(node => {
    const pos = positions.get(node.id)!;
    return {
      id: node.id,
      type: 'custom',
      position: pos,
      data: {
        label: node.label || node.id,
        type: node.type,
        size: node.size,
        color: node.color,
        borderColor: node.color,
        metadata: node.metadata
      }
    };
  });
};

function NetworkVisualizationComponent({ className }: NetworkVisualizationProps) {
  const { records } = useAppStore();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [settings, setSettings] = useState<GraphSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);

  // Generate graph data from records
  const generateGraphData = useCallback(async () => {
    if (!records || records.length === 0) {
      console.log('No records available for graph generation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Generating graph data from records:', records.length);

      const nodeMap = new Map<string, GraphNode>();
      const edgeMap = new Map<string, GraphEdge>();

      // Process records to create nodes and edges
      records.forEach((record, index) => {
        const aParty = record.aParty || 'Unknown';
        const bParty = record.bParty || 'Unknown';

        // Create nodes
        if (!nodeMap.has(aParty)) {
          nodeMap.set(aParty, {
            id: aParty,
            label: aParty,
            type: 'ip',
            metadata: { operator: record.operator },
            size: 0,
            color: '#3b82f6'
          });
        }

        if (!nodeMap.has(bParty)) {
          nodeMap.set(bParty, {
            id: bParty,
            label: bParty,
            type: 'ip',
            metadata: { operator: record.operator },
            size: 0,
            color: '#3b82f6'
          });
        }

        // Create edges
        const edgeKey = aParty < bParty ? `${aParty}-${bParty}` : `${bParty}-${aParty}`;
        
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            id: edgeKey,
            source: aParty,
            target: bParty,
            weight: 1,
            type: 'data',
            timestamp: record.startTimestamp,
            duration: record.duration,
            bytes: record.bytesTransferred
          });
        } else {
          const edge = edgeMap.get(edgeKey)!;
          edge.weight = (edge.weight || 0) + 1;
          edge.bytes = (edge.bytes || 0) + record.bytesTransferred;
        }
      });

      // Calculate node sizes and colors
      const connectionCounts = new Map<string, number>();
      
      edgeMap.forEach(edge => {
        connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
        connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
      });

      // Update node sizes and color code based on actual connections
      nodeMap.forEach((node, nodeId) => {
        const connections = connectionCounts.get(nodeId) || 0;
        node.size = connections;
        
        // Color code nodes based on actual connection count with better colors
        if (connections > 5) {
          node.color = '#dc2626'; // Red for high-activity nodes (hubs)
        } else if (connections > 2) {
          node.color = '#ea580c'; // Orange for medium-activity nodes
        } else if (connections > 0) {
          node.color = '#2563eb'; // Blue for connected nodes
        } else {
          node.color = '#6b7280'; // Gray for isolated nodes
        }
      });

      const newGraphData: GraphData = {
        nodes: Array.from(nodeMap.values()),
        edges: Array.from(edgeMap.values())
      };

      console.log('Generated graph data:', newGraphData);
      setGraphData(newGraphData);

    } catch (err) {
      console.error('Error generating graph data:', err);
      setError('Failed to generate network visualization');
    } finally {
      setIsLoading(false);
    }
  }, [records]);

  // Filter graph data based on settings
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;

    let filtered = { ...graphData };

    // Apply search filter
    if (settings.searchFilter) {
      const filter = settings.searchFilter.toLowerCase();
      filtered.nodes = filtered.nodes.filter(node =>
        node.id.toLowerCase().includes(filter) ||
        node.type?.toLowerCase().includes(filter)
      );

      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.edges = filtered.edges.filter(edge =>
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }

    // Apply connection filter
    if (settings.minConnections > 1) {
      filtered.nodes = filtered.nodes.filter(node => (node.size || 0) >= settings.minConnections);
      
      const nodeIds = new Set(filtered.nodes.map(n => n.id));
      filtered.edges = filtered.edges.filter(edge =>
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }

    // Limit nodes
    if (filtered.nodes.length > settings.maxNodes) {
      const topNodes = filtered.nodes
        .sort((a, b) => (b.size || 0) - (a.size || 0))
        .slice(0, settings.maxNodes);
      
      const nodeIds = new Set(topNodes.map(n => n.id));
      filtered.nodes = topNodes;
      filtered.edges = filtered.edges.filter(edge =>
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }

    return filtered;
  }, [graphData, settings]);

  // Convert to React Flow format
  const reactFlowData = useMemo(() => {
    if (!filteredGraphData) return { nodes: [], edges: [] };

    const flowNodes = calculateLayout(filteredGraphData.nodes, filteredGraphData.edges, settings);
    
    const flowEdges: Edge[] = filteredGraphData.edges.map((edge, index) => {
      // Calculate edge strength based on weight and bytes
      const strength = Math.min(edge.weight || 1, 10); // Cap at 10 for visual clarity
      const strokeWidth = Math.max(1, Math.min(4, strength)); // Simpler width range
      
      // Color coding based on connection frequency with better colors
      let strokeColor = '#2563eb'; // Default blue
      if (strength > 5) {
        strokeColor = '#dc2626'; // Red for high frequency
      } else if (strength > 2) {
        strokeColor = '#ea580c'; // Orange for medium frequency
      }
      
      console.log(`Creating edge ${index}: ${edge.source} -> ${edge.target} (weight: ${edge.weight})`);
      
      return {
        id: `edge-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'straight', // Simple straight lines
        style: { 
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          strokeDasharray: 'none', // Solid line, no dashes
          cursor: 'pointer'
        },
        data: {
          label: settings.showWeights ? `${edge.weight || 1} connections` : '',
          weight: edge.weight,
          bytes: edge.bytes,
          duration: edge.duration
        }
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [filteredGraphData, settings]);

  // Update React Flow when data changes
  useEffect(() => {
    setNodes(reactFlowData.nodes);
    setEdges(reactFlowData.edges);
  }, [reactFlowData, setNodes, setEdges]);

  // Generate initial data
  useEffect(() => {
    if (records && records.length > 0) {
      generateGraphData();
    }
  }, [records, generateGraphData]);

  // Settings update helper
  const updateSetting = useCallback((key: keyof GraphSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Connection handler
  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge(params, eds)),
    [setEdges]
  );

  // Export functionality
  const exportGraph = useCallback(() => {
    try {
      const canvas = document.querySelector('.react-flow__renderer canvas') as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement('a');
        link.download = 'network-graph.png';
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export graph');
    }
  }, []);

  // Statistics
  const stats = useMemo(() => {
    if (!filteredGraphData) return null;
    
    return {
      totalNodes: graphData?.nodes.length || 0,
      filteredNodes: filteredGraphData.nodes.length,
      totalEdges: graphData?.edges.length || 0,
      filteredEdges: filteredGraphData.edges.length,
      hubs: filteredGraphData.nodes.filter(n => (n.size || 0) > 5).length
    };
  }, [filteredGraphData, graphData]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Network Visualization</h3>
          <p className="text-sm text-muted-foreground">
            Interactive communication network graph
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <EyeOffIcon className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportGraph}
            disabled={!filteredGraphData || filteredGraphData.nodes.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PNG
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateGraphData}
            disabled={isLoading}
          >
            <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Visualization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Max Nodes */}
            <div className="space-y-2">
              <Label>Max Nodes</Label>
              <Select value={settings.maxNodes.toString()} onValueChange={(value) => updateSetting('maxNodes', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 nodes</SelectItem>
                  <SelectItem value="50">50 nodes</SelectItem>
                  <SelectItem value="100">100 nodes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Connections */}
            <div className="space-y-2">
              <Label>Min Connections</Label>
              <Select value={settings.minConnections.toString()} onValueChange={(value) => updateSetting('minConnections', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ connections</SelectItem>
                  <SelectItem value="2">2+ connections</SelectItem>
                  <SelectItem value="5">5+ connections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Options */}
            <div className="space-y-2">
              <Label>Display Options</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.showLabels}
                    onCheckedChange={(checked) => updateSetting('showLabels', checked)}
                  />
                  <Label className="text-sm">Labels</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.showWeights}
                    onCheckedChange={(checked) => updateSetting('showWeights', checked)}
                  />
                  <Label className="text-sm">Weights</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Search Nodes</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by IP address..."
                  value={settings.searchFilter}
                  onChange={(e) => updateSetting('searchFilter', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {stats && (
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />
                  {stats.filteredNodes}/{stats.totalNodes} nodes
                </Badge>
                <Badge variant="secondary">
                  <Activity className="h-3 w-3 mr-1" />
                  {stats.filteredEdges}/{stats.totalEdges} edges
                </Badge>
                <Badge variant="secondary">
                  <Network className="h-3 w-3 mr-1" />
                  {stats.hubs} hubs
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Graph Visualization */}
      <Card className={cn(isFullscreen && "fixed inset-4 z-50")}>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="h-6 w-6 animate-spin" />
                  Generating visualization...
                </div>
              </div>
            ) : filteredGraphData && filteredGraphData.nodes.length > 0 ? (
              <ReactFlowProvider>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.1 }}
                  className="bg-gray-50"
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                  
                  {/* Legend */}
                  <Panel position="bottom-left" className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                    <div className="text-xs font-medium text-gray-700 mb-2">Network Relationship Legend</div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-red-600"></div>
                        <span>Hub IP (5+ connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-600 border-2 border-orange-600"></div>
                        <span>Medium Activity (3-5 connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-blue-600"></div>
                        <span>Connected IP (1-2 connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500 border-2 border-gray-500"></div>
                        <span>Isolated IP (0 connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-600 rounded-full"></div>
                        <span>High Frequency (5+ connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                        <span>Medium Frequency (3-5 connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                        <span>Low Frequency (1-2 connections)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">2</div>
                        <span>Connection Count</span>
                      </div>
                    </div>
                  </Panel>

                  {filteredGraphData && (
                    <Panel position="bottom-right" className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                      <div className="text-xs font-medium text-gray-700 mb-2">Network Stats</div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>Total IPs: {filteredGraphData.nodes.length}</div>
                        <div>Connected: {filteredGraphData.nodes.filter(n => (n.size || 0) > 0).length}</div>
                        <div>Hub IPs: {filteredGraphData.nodes.filter(n => (n.size || 0) > 5).length}</div>
                        <div>Connections: {filteredGraphData.edges.length}</div>
                      </div>
                    </Panel>
                  )}
                </ReactFlow>
              </ReactFlowProvider>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No network data available</p>
                  <p className="text-xs">Upload IPDR records to generate visualization</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NetworkVisualization(props: NetworkVisualizationProps) {
  return <NetworkVisualizationComponent {...props} />;
}