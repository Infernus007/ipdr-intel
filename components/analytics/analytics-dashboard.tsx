"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Network, 
  Download, 
  Upload,
  Clock,
  Globe,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

import { ChartAreaInteractive } from '@/components/charts/chart-area-interactive';
import { ChartBarLabelCustom } from '@/components/charts/chart-bar-label-custom';
import { ChartPieLabel } from '@/components/charts/chart-pie-label';
import { useAppStore } from '@/lib/store';

export function AnalyticsDashboard() {
  const { records, anomalies, cases, evidenceFiles } = useAppStore();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);

  // Calculate analytics data
  const analytics = {
    totalRecords: records.length,
    totalCases: cases.length,
    totalAnomalies: anomalies.length,
    totalFiles: evidenceFiles.length,
    
    // Protocol distribution
    protocols: records.reduce((acc, record) => {
      acc[record.protocol] = (acc[record.protocol] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Operator distribution
    operators: records.reduce((acc, record) => {
      acc[record.operator] = (acc[record.operator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Data transfer stats
    totalBytes: records.reduce((sum, record) => sum + record.bytesTransferred, 0),
    avgDuration: records.reduce((sum, record) => sum + record.duration, 0) / records.length || 0,
    
    // Anomaly severity breakdown
    anomalySeverity: anomalies.reduce((acc, anomaly) => {
      acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Generate chart data for protocols
  const protocolChartData = Object.entries(analytics.protocols).map(([protocol, count]) => ({
    month: protocol,
    desktop: count,
    mobile: Math.floor(count * 0.7) // Simulate mobile vs desktop split
  }));

  // Generate chart data for operators
  const operatorChartData = Object.entries(analytics.operators).map(([operator, count]) => ({
    month: operator.charAt(0).toUpperCase() + operator.slice(1),
    desktop: count,
    mobile: Math.floor(count * 0.6)
  }));

  // Generate time series data for traffic analysis
  const generateTimeSeriesData = () => {
    const days = 30;
    const data = [];
    const baseDate = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      // Simulate realistic traffic patterns
      const baseTraffic = 200 + Math.random() * 300;
      const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.7 : 1;
      const anomalyMultiplier = Math.random() > 0.95 ? 2 : 1; // 5% chance of anomaly
      
      data.push({
        date: date.toISOString().split('T')[0],
        desktop: Math.floor(baseTraffic * weekendMultiplier * anomalyMultiplier),
        mobile: Math.floor(baseTraffic * 0.6 * weekendMultiplier * anomalyMultiplier)
      });
    }
    
    return data;
  };

  const timeSeriesData = generateTimeSeriesData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of IPDR data and network activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Real-time Mode
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +2 new cases this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAnomalies}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500 mr-1" />
              -8% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Processed</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500 mr-1" />
              +15.3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Analysis</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Network Activity Overview</CardTitle>
                <CardDescription>
                  Real-time network traffic and connection patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartAreaInteractive />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Protocol Distribution</CardTitle>
                <CardDescription>Traffic breakdown by protocol type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartPieLabel />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Patterns Analysis</CardTitle>
              <CardDescription>
                Detailed view of network traffic over time with anomaly detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartAreaInteractive />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Protocol Usage Statistics</CardTitle>
              <CardDescription>
                Distribution of network protocols and their usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartBarLabelCustom />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Severity Distribution</CardTitle>
                <CardDescription>Breakdown of detected anomalies by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.anomalySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={severity === 'critical' ? 'destructive' : 
                                  severity === 'high' ? 'default' : 
                                  severity === 'medium' ? 'secondary' : 'outline'}
                        >
                          {severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {severity === 'critical' ? 'Critical security threats' :
                           severity === 'high' ? 'High-risk activities' :
                           severity === 'medium' ? 'Suspicious patterns' : 'Low-priority alerts'}
                        </span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Anomalies</CardTitle>
                <CardDescription>Latest security alerts and suspicious activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {anomalies.slice(0, 5).map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className={`w-2 h-2 rounded-full ${
                        anomaly.severity === 'critical' ? 'bg-red-500' :
                        anomaly.severity === 'high' ? 'bg-orange-500' :
                        anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{anomaly.entity}</p>
                        <p className="text-xs text-muted-foreground truncate">{anomaly.reason}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {anomaly.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Avg Response Time</span>
              <span className="font-medium">{(analytics.avgDuration / 1000).toFixed(2)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Throughput</span>
              <span className="font-medium">
                {((analytics.totalBytes / 1024 / 1024) / (analytics.totalRecords / 1000)).toFixed(2)} MB/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="font-medium text-green-600">99.8%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Geographic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Domestic Traffic</span>
                <span className="font-medium">78.5%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>International</span>
                <span className="font-medium">21.5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78.5%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Valid Records</span>
                <span className="font-medium text-green-600">98.2%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Corrupted Data</span>
                <span className="font-medium text-red-600">1.8%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '98.2%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
