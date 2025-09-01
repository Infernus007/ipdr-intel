'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Network, 
  Download, 
  RotateCcw, 
  Search,
  Users,
  Activity,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Info
} from 'lucide-react';
import { IPDRRecord, GraphData } from '@/lib/types';
import { generateGraphData } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface NetworkVisualizationProps {
  records: IPDRRecord[];
  className?: string;
}

type GraphType = 'flowchart' | 'graph' | 'mindmap';
type LayoutDirection = 'TD' | 'LR' | 'BT' | 'RL';

interface GraphSettings {
  type: GraphType;
  layout: LayoutDirection;
  maxNodes: number;
  minConnections: number;
  searchFilter: string;
  showLabels: boolean;
  showWeights: boolean;
}

const INITIAL_SETTINGS: GraphSettings = {
  type: 'flowchart',
  layout: 'TD',
  maxNodes: 20,
  minConnections: 1,
  searchFilter: '',
  showLabels: true,
  showWeights: true
};

export function NetworkVisualization({ records, className }: NetworkVisualizationProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [settings, setSettings] = useState<GraphSettings>(INITIAL_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Mermaid with optimized settings
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff'
      },
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20
      }
    });
  }, []);

  // Generate graph data with memoization for performance
  const processedGraphData = useMemo(() => {
    if (!records.length) return null;
    return generateGraphData(records);
  }, [records]);

  useEffect(() => {
    setGraphData(processedGraphData);
  }, [processedGraphData]);

  // Filter and optimize graph data
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;

    let { nodes, edges } = graphData;

    // Apply search filter
    if (settings.searchFilter) {
      const searchLower = settings.searchFilter.toLowerCase();
      nodes = nodes.filter(node => 
        node.label.toLowerCase().includes(searchLower) ||
        node.id.toLowerCase().includes(searchLower)
      );
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }

    // Filter by minimum connections
    const connectionCounts = new Map<string, number>();
    edges.forEach(edge => {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + edge.weight);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + edge.weight);
    });

    nodes = nodes.filter(node => 
      (connectionCounts.get(node.id) || 0) >= settings.minConnections
    );

    // Sort by connection count and limit
    nodes = nodes
      .sort((a, b) => (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0))
      .slice(0, settings.maxNodes);

    const nodeIds = new Set(nodes.map(n => n.id));
    edges = edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return { nodes, edges, connectionCounts };
  }, [graphData, settings]);

  // Generate optimized Mermaid diagram
  const generateMermaidDiagram = useCallback((data: { nodes: any[]; edges: any[]; connectionCounts: Map<string, number> } | null): string => {
    if (!data || data.nodes.length === 0) return '';

    const { nodes, edges } = data;
    
    if (settings.type === 'mindmap') {
      const centerNode = nodes.reduce((max, node) => 
        (data.connectionCounts.get(node.id) || 0) > (data.connectionCounts.get(max.id) || 0) ? node : max
      );

      let diagram = `mindmap\n  root)${centerNode.label.substring(0, 15)}(\n`;
      
      const connectedNodes = new Set<string>();
      edges.forEach(edge => {
        if (edge.source === centerNode.id) connectedNodes.add(edge.target);
        else if (edge.target === centerNode.id) connectedNodes.add(edge.source);
      });

      Array.from(connectedNodes).slice(0, 8).forEach(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
          diagram += `    ${node.label.substring(0, 15)}\n`;
        }
      });

      return diagram;
    }

    // Create flowchart or graph
    const diagramType = settings.type === 'flowchart' ? `flowchart ${settings.layout}` : 'graph';
    let diagram = `${diagramType}\n`;

    // Add nodes with consistent styling
    nodes.forEach(node => {
      const nodeId = `n${node.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const label = settings.showLabels 
        ? (node.label.length > 12 ? `${node.label.substring(0, 10)}...` : node.label)
        : nodeId;
      
      const shape = node.type === 'phone' ? '([' : '(';
      const endShape = node.type === 'phone' ? '])' : ')';
      diagram += `  ${nodeId}${shape}"${label}"${endShape}\n`;
    });

    // Add edges with optional weights
    edges.forEach(edge => {
      const sourceId = `n${edge.source.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const targetId = `n${edge.target.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const weight = settings.showWeights && edge.weight > 1 ? ` |${edge.weight}|` : '';
      const connector = settings.type === 'flowchart' ? '-->' : '---';
      diagram += `  ${sourceId} ${connector}${weight} ${targetId}\n`;
    });

    // Add optimized styling
    diagram += '\n  classDef default fill:#f8fafc,stroke:#64748b,stroke-width:1.5px,color:#334155\n';
    diagram += '  classDef phone fill:#dbeafe,stroke:#2563eb,stroke-width:2px,color:#1e40af\n';
    
    return diagram;
  }, [settings]);

  // Render graph with error handling
  const renderGraph = useCallback(async () => {
    if (!mermaidRef.current || !filteredGraphData) return;

    setIsLoading(true);
    setError(null);

    try {
      if (filteredGraphData.nodes.length === 0) {
        mermaidRef.current.innerHTML = `
          <div class="flex flex-col items-center justify-center py-12 text-gray-500">
            <Network class="h-12 w-12 mb-4 opacity-50" />
            <p class="text-sm">No nodes match current filters</p>
          </div>
        `;
        return;
      }

      const diagramDefinition = generateMermaidDiagram(filteredGraphData);
      if (!diagramDefinition) return;

      const { svg } = await mermaid.render('network-graph-' + Date.now(), diagramDefinition);
      mermaidRef.current.innerHTML = svg;

      // Add click handlers for interactivity
      const svgElement = mermaidRef.current.querySelector('svg');
      if (svgElement) {
        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';
        svgElement.style.maxHeight = isFullscreen ? '80vh' : '500px';
      }

    } catch (error) {
      console.error('Graph rendering error:', error);
      setError('Failed to render graph. Try adjusting the settings.');
      mermaidRef.current.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-red-500">
          <Network class="h-12 w-12 mb-4 opacity-50" />
          <p class="text-sm">Graph rendering failed</p>
        </div>
      `;
    } finally {
      setIsLoading(false);
    }
  }, [filteredGraphData, generateMermaidDiagram, isFullscreen]);

  // Re-render when settings or data change
  useEffect(() => {
    const timeoutId = setTimeout(renderGraph, 300); // Debounce for performance
    return () => clearTimeout(timeoutId);
  }, [renderGraph]);

  // Update setting helper
  const updateSetting = useCallback(<K extends keyof GraphSettings>(
    key: K, 
    value: GraphSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Export functionality
  const exportGraph = useCallback(() => {
    if (!mermaidRef.current) return;
    
    const svg = mermaidRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `network-graph-${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  if (!records.length) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Network className="h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="text-xl mb-2">No Communication Data</CardTitle>
          <CardDescription className="text-center max-w-md">
            Upload IPDR files to visualize communication networks and relationships between parties.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  const stats = filteredGraphData ? {
    totalNodes: graphData?.nodes.length || 0,
    totalEdges: graphData?.edges.length || 0,
    filteredNodes: filteredGraphData.nodes.length,
    filteredEdges: filteredGraphData.edges.length
  } : null;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Controls Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Visualization
              </CardTitle>
              <CardDescription>
                Interactive communication pattern analysis and mapping
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={exportGraph}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={renderGraph} disabled={isLoading}>
                <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Graph Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Visualization Type</Label>
              <Select value={settings.type} onValueChange={(value: GraphType) => updateSetting('type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flowchart">Flowchart</SelectItem>
                  <SelectItem value="graph">Network Graph</SelectItem>
                  <SelectItem value="mindmap">Mind Map</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Layout Direction */}
            {settings.type !== 'mindmap' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Layout Direction</Label>
                <Select value={settings.layout} onValueChange={(value: LayoutDirection) => updateSetting('layout', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TD">Top → Bottom</SelectItem>
                    <SelectItem value="LR">Left → Right</SelectItem>
                    <SelectItem value="BT">Bottom → Top</SelectItem>
                    <SelectItem value="RL">Right → Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Max Nodes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max Nodes</Label>
              <Select value={settings.maxNodes.toString()} onValueChange={(value) => updateSetting('maxNodes', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 nodes</SelectItem>
                  <SelectItem value="20">20 nodes</SelectItem>
                  <SelectItem value="50">50 nodes</SelectItem>
                  <SelectItem value="100">100 nodes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Connections */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Connections</Label>
              <Select value={settings.minConnections.toString()} onValueChange={(value) => updateSetting('minConnections', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+ connections</SelectItem>
                  <SelectItem value="2">2+ connections</SelectItem>
                  <SelectItem value="5">5+ connections</SelectItem>
                  <SelectItem value="10">10+ connections</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Display Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Display Options</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant={settings.showLabels ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('showLabels', !settings.showLabels)}
                >
                  {settings.showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  Labels
                </Button>
                <Button
                  variant={settings.showWeights ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateSetting('showWeights', !settings.showWeights)}
                >
                  <Activity className="h-4 w-4" />
                  Weights
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Search and Statistics */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-sm font-medium">Search Nodes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by IP address, phone number..."
                  value={settings.searchFilter}
                  onChange={(e) => updateSetting('searchFilter', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Statistics */}
            {stats && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {stats.filteredNodes}/{stats.totalNodes} nodes
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {stats.filteredEdges}/{stats.totalEdges} edges
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
      <Card className={cn(isFullscreen && "fixed inset-4 z-50 overflow-auto")}>
        <CardContent className="p-6">
          <div 
            ref={mermaidRef}
            className={cn(
              "min-h-96 w-full flex items-center justify-center",
              isLoading && "animate-pulse bg-muted/50 rounded-lg"
            )}
          >
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="h-6 w-6 animate-spin" />
                Generating visualization...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
