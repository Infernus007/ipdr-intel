'use client';

import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { NetworkVisualization } from '@/components/graph/network-visualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';
import { 
  Network, 
  Users, 
  Activity, 
  Globe, 
  TrendingUp,
  Eye,
  Download,
  Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';

function GraphContent() {
  const { currentCase, records } = useAppStore();
  const walkthroughTarget = useWalkthroughTarget('network-graph');

  // Calculate network statistics
  const networkStats = useMemo(() => {
    if (!records.length) return null;

    const uniqueNodes = new Set();
    const connections = new Map<string, number>();
    const protocolDistribution = new Map<string, number>();
    const operatorDistribution = new Map<string, number>();

    records.forEach(record => {
      // Track unique nodes
      uniqueNodes.add(record.aParty);
      uniqueNodes.add(record.bParty);

      // Track connections
      const connectionKey = `${record.aParty}-${record.bParty}`;
      connections.set(connectionKey, (connections.get(connectionKey) || 0) + 1);

      // Track protocols
      protocolDistribution.set(record.protocol, (protocolDistribution.get(record.protocol) || 0) + 1);

      // Track operators
      operatorDistribution.set(record.operator, (operatorDistribution.get(record.operator) || 0) + 1);
    });

    // Find most connected nodes
    const nodeConnections = new Map<string, number>();
    connections.forEach((count, connectionKey) => {
      const [source, target] = connectionKey.split('-');
      nodeConnections.set(source, (nodeConnections.get(source) || 0) + count);
      nodeConnections.set(target, (nodeConnections.get(target) || 0) + count);
    });

    const topNodes = Array.from(nodeConnections.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalNodes: uniqueNodes.size,
      totalConnections: connections.size,
      totalCommunications: records.length,
      avgConnectionsPerNode: Math.round((connections.size * 2) / uniqueNodes.size * 100) / 100,
      topProtocols: Array.from(protocolDistribution.entries()).sort(([,a], [,b]) => b - a).slice(0, 3),
      topOperators: Array.from(operatorDistribution.entries()).sort(([,a], [,b]) => b - a),
      mostConnectedNodes: topNodes
    };
  }, [records]);

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavMenu />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Active Case</h2>
            <p className="text-gray-600">Please create a case and upload IPDR files to view network graphs.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavMenu />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication Network</h1>
            <p className="text-gray-600">Case: {currentCase.title}</p>
          </div>
          
          <div className="text-center">
            <Network className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-4">Upload IPDR files to visualize communication networks and relationships.</p>
            <Button asChild>
              <a href="/upload">Upload IPDR Files</a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavMenu />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Communication Network</h1>
              <p className="text-gray-600">Case: {currentCase.title}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/records">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Data
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/analytics">
                  <Eye className="h-4 w-4 mr-2" />
                  View Analytics
                </a>
              </Button>
            </div>
          </div>

          {/* Network Statistics */}
          {networkStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Network Nodes</p>
                      <p className="text-2xl font-bold text-blue-600">{networkStats.totalNodes.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Unique Connections</p>
                      <p className="text-2xl font-bold text-green-600">{networkStats.totalConnections.toLocaleString()}</p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Communications</p>
                      <p className="text-2xl font-bold text-purple-600">{networkStats.totalCommunications.toLocaleString()}</p>
                    </div>
                    <Globe className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Connections/Node</p>
                      <p className="text-2xl font-bold text-orange-600">{networkStats.avgConnectionsPerNode}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Network Visualization */}
        <div {...walkthroughTarget}>
          <NetworkVisualization records={records} />
        </div>

        {/* Additional Insights */}
        {networkStats && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Connected Nodes */}
            <Card>
              <CardHeader>
                <CardTitle>Most Connected Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {networkStats.mostConnectedNodes.map(([node, connections], index) => (
                    <div key={node} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {index + 1}
                        </Badge>
                        <span className="font-mono text-sm">{node}</span>
                      </div>
                      <Badge variant="secondary">{connections} connections</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Protocol Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Network Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Top Protocols</h4>
                  <div className="space-y-2">
                    {networkStats.topProtocols.map(([protocol, count]) => (
                      <div key={protocol} className="flex items-center justify-between">
                        <span className="text-sm">{protocol}</span>
                        <Badge variant="outline">{count.toLocaleString()} records</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Telecom Operators</h4>
                  <div className="space-y-2">
                    {networkStats.topOperators.map(([operator, count]) => (
                      <div key={operator} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{operator}</span>
                        <Badge variant="outline">{count.toLocaleString()} records</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GraphPage() {
  return (
    <DemoProvider>
      <GraphContent />
    </DemoProvider>
  );
}
