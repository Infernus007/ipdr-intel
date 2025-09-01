'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, Settings, Play, Pause } from 'lucide-react';
import { AnomalyRule, TimeRange, DEFAULT_ANOMALY_RULES } from '@/lib/anomaly-detector';
import { useWalkthroughTarget } from '@/components/walkthrough/walkthrough-provider';

interface AnomalySettingsProps {
  onRulesChange: (rules: AnomalyRule[]) => void;
  onRunDetection: () => void;
  isRunning: boolean;
}

export function AnomalySettings({ onRulesChange, onRunDetection, isRunning }: AnomalySettingsProps) {
  const [rules, setRules] = useState<AnomalyRule[]>(DEFAULT_ANOMALY_RULES);
  const [customTimeRange, setCustomTimeRange] = useState<TimeRange>({
    startHour: 0,
    endHour: 5,
    timezone: 'Asia/Kolkata'
  });

  const walkthroughTarget = useWalkthroughTarget('anomaly-detection');

  useEffect(() => {
    onRulesChange(rules);
  }, [rules, onRulesChange]);

  const updateRule = (ruleId: string, updates: Partial<AnomalyRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const updateLateNightConfig = (field: keyof TimeRange, value: string | number) => {
    const newTimeRange = { ...customTimeRange, [field]: value };
    setCustomTimeRange(newTimeRange);
    
    // Update the late night activity rule
    updateRule('late_night_activity', { config: newTimeRange });
  };

  const toggleRule = (ruleId: string) => {
    updateRule(ruleId, { enabled: !rules.find(r => r.id === ruleId)?.enabled });
  };

  const resetToDefaults = () => {
    setRules(DEFAULT_ANOMALY_RULES);
    setCustomTimeRange({
      startHour: 0,
      endHour: 5,
      timezone: 'Asia/Kolkata'
    });
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-6" {...walkthroughTarget}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Anomaly Detection Settings</h2>
          <p className="text-gray-600 mt-1">
            Configure AI-powered anomaly detection rules for telecom data analysis
          </p>
        </div>
        <Button
          onClick={onRunDetection}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run Detection
            </>
          )}
        </Button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Late Night Activity Rule */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Late Night Activity</CardTitle>
              </div>
              <Switch
                checked={rules.find(r => r.id === 'late_night_activity')?.enabled || false}
                onCheckedChange={() => toggleRule('late_night_activity')}
              />
            </div>
            <CardDescription>
              Detects communication activity during unusual hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getSeverityColor('medium')}>
                Medium Severity
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Default: 00:00-05:00 IST
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-hour" className="text-sm font-medium">
                  Start Hour
                </Label>
                <Input
                  id="start-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={customTimeRange.startHour}
                  onChange={(e) => updateLateNightConfig('startHour', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end-hour" className="text-sm font-medium">
                  End Hour
                </Label>
                <Input
                  id="end-hour"
                  type="number"
                  min="0"
                  max="23"
                  value={customTimeRange.endHour}
                  onChange={(e) => updateLateNightConfig('endHour', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="timezone" className="text-sm font-medium">
                Timezone
              </Label>
              <Select
                value={customTimeRange.timezone}
                onValueChange={(value) => updateLateNightConfig('timezone', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Current Setting:</strong> Detects activity between{' '}
                {customTimeRange.startHour.toString().padStart(2, '0')}:00 and{' '}
                {customTimeRange.endHour.toString().padStart(2, '0')}:00 {customTimeRange.timezone.split('/')[1]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* High Volume Rule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg">High Data Volume</CardTitle>
              </div>
              <Switch
                checked={rules.find(r => r.id === 'high_volume')?.enabled || false}
                onCheckedChange={() => toggleRule('high_volume')}
              />
            </div>
            <CardDescription>
              Detects unusually high data transfer patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getSeverityColor('high')}>
                High Severity
              </Badge>
              <Badge variant="outline">
                Threshold: 1MB per hour
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Monitors data transfer volumes and flags suspicious patterns that exceed normal thresholds.
            </p>
          </CardContent>
        </Card>

        {/* Communication Burst Rule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">Communication Burst</CardTitle>
              </div>
              <Switch
                checked={rules.find(r => r.id === 'burst_communication')?.enabled || false}
                onCheckedChange={() => toggleRule('burst_communication')}
              />
            </div>
            <CardDescription>
              Detects high-frequency communication in short time windows
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getSeverityColor('medium')}>
                Medium Severity
              </Badge>
              <Badge variant="outline">
                Threshold: 10+ connections in 5 minutes
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Identifies sudden spikes in communication activity that may indicate automated attacks or unusual behavior.
            </p>
          </CardContent>
        </Card>

        {/* Cross Operator Rule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-lg">Cross-Operator Activity</CardTitle>
              </div>
              <Switch
                checked={rules.find(r => r.id === 'cross_operator')?.enabled || false}
                onCheckedChange={() => toggleRule('cross_operator')}
              />
            </div>
            <CardDescription>
              Detects same entity active across multiple operators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Badge className={getSeverityColor('high')}>
                High Severity
              </Badge>
              <Badge variant="outline">
                Threshold: 2+ operators
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Flags entities that are simultaneously active across multiple telecom operators, which may indicate identity spoofing or coordinated attacks.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="text-gray-600"
        >
          Reset to Defaults
        </Button>
        
        <div className="text-sm text-gray-500">
          {rules.filter(r => r.enabled).length} of {rules.length} rules enabled
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Settings className="w-5 h-5 text-gray-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 mb-1">How It Works</h4>
            <p className="text-sm text-gray-600 mb-2">
              Anomaly detection runs automatically when you upload IPDR files. The system analyzes patterns and flags suspicious activities based on your configured rules.
            </p>
            <p className="text-sm text-gray-600">
              <strong>Late Night Activity:</strong> Perfect for detecting unusual communication patterns during off-hours, which often indicate automated attacks or suspicious behavior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
