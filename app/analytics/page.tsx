'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { AnomalySettings } from '@/components/anomaly/anomaly-settings';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { AnomalyRule, runAllAnomalyDetection } from '@/lib/anomaly-detector';
import { toast } from 'sonner';
import { 
  BarChart3, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Activity,
  Shield,
  Eye,
  Zap
} from 'lucide-react';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';

function AnalyticsContent() {
  const { currentCase, records, anomalies, addAnomaly } = useAppStore();
  const [isRunning, setIsRunning] = useState(false);
  const [currentRules, setCurrentRules] = useState<AnomalyRule[]>([]);
  const [detectionResults, setDetectionResults] = useState<any>(null);

  const walkthroughTarget = useWalkthroughTarget('anomaly-detection');

  useEffect(() => {
    if (currentRules.length > 0) {
      setCurrentRules(currentRules);
    }
  }, [currentRules]);

  const handleRunDetection = async () => {
    if (!currentCase) {
      toast.error('No active case selected');
      return;
    }

    if (records.length === 0) {
      toast.error('No records available for analysis');
      return;
    }

    setIsRunning(true);
    toast.info('Running anomaly detection...');

    try {
      // Run anomaly detection with current rules
      const detectedAnomalies = await runAllAnomalyDetection(records, currentRules);
      
      // Add new anomalies to store
      detectedAnomalies.forEach(anomaly => addAnomaly(anomaly));
      
      // Prepare results for display
      const results = {
        totalAnomalies: detectedAnomalies.length,
        byRule: detectedAnomalies.reduce((acc, anomaly) => {
          acc[anomaly.rule] = (acc[anomaly.rule] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: detectedAnomalies.reduce((acc, anomaly) => {
          acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        topEntities: Object.entries(detectedAnomalies
          .reduce((acc, anomaly) => {
            acc[anomaly.entity] = (acc[anomaly.entity] || 0) + 1;
            return acc;
          }, {} as Record<string, number>))
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
      };

      setDetectionResults(results);

      toast.success(`Detection complete! Found ${detectedAnomalies.length} anomalies`, {
        description: 'Review the results below'
      });
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      toast.error('Anomaly detection failed', {
        description: 'Please try again or check your configuration'
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!currentCase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavMenu />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Active Case</h2>
            <p className="text-gray-600">Please create a case first to run analytics.</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Anomaly Detection</h1>
          <p className="text-gray-600">
            AI-powered analysis of IPDR data to identify suspicious patterns and security threats
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{records.length.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Records Analyzed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{anomalies.length}</p>
                <p className="text-sm text-gray-600">Anomalies Found</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(records.map(r => r.aParty)).size}
                </p>
                <p className="text-sm text-gray-600">Unique Entities</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {records.reduce((sum, r) => sum + r.bytesTransferred, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Data Volume</p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="mb-8">
          <AnalyticsDashboard />
        </div>

        {/* Anomaly Detection Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <AnomalySettings
            onRulesChange={setCurrentRules}
            onRunDetection={handleRunDetection}
            isRunning={isRunning}
          />
        </div>

        {/* Detection Results */}
        {detectionResults && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Detection Results</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Anomalies by Rule */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">By Detection Rule</h4>
                <div className="space-y-2">
                  {Object.entries(detectionResults.byRule).map(([rule, count]) => (
                    <div key={rule} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">
                        {rule.replace(/_/g, ' ')}
                      </span>
                      <span className="font-medium text-gray-900">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anomalies by Severity */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">By Severity</h4>
                <div className="space-y-2">
                  {Object.entries(detectionResults.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 capitalize">{severity}</span>
                      <span className="font-medium text-gray-900">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Entities */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Top Entities</h4>
                <div className="space-y-2">
                  {detectionResults.topEntities.map(([entity, count]: [string, number]) => (
                    <div key={entity} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-mono">{entity}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Anomalies */}
        {anomalies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900">Recent Anomalies</h3>
            </div>

            <div className="space-y-4">
              {anomalies.slice(0, 10).map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <div>
                      <p className="font-medium text-gray-900">{anomaly.entity}</p>
                      <p className="text-sm text-gray-600">{anomaly.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      anomaly.severity === 'high' ? 'bg-red-100 text-red-800' :
                      anomaly.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {anomaly.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">About Anomaly Detection</h4>
              <p className="text-sm text-blue-800 mb-3">
                Our AI-powered system analyzes IPDR data patterns to identify potential security threats, 
                unusual behavior, and compliance violations. The late-night activity detection is particularly 
                useful for identifying automated attacks that often occur during off-hours.
              </p>
              <p className="text-sm text-blue-800">
                <strong>Late Night Detection:</strong> Configure custom time ranges to detect activity during 
                unusual hours. Default setting (00:00-05:00 IST) catches most automated attacks and suspicious 
                behavior patterns.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <DemoProvider>
      <AnalyticsContent />
    </DemoProvider>
  );
}
