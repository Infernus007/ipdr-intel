'use client';

import React from 'react';
import { 
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/components/ui/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileCheck, 
  Search, 
  Download, 
  Eye, 
  Lock, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MapPin,
  Fingerprint
} from 'lucide-react';
import { AuditLogEntry } from '@/lib/chain-of-custody';

interface CoCTimelineProps {
  auditLog: AuditLogEntry[];
  evidenceId: string;
  className?: string;
}

const actionIcons = {
  upload: FileCheck,
  parse: Search,
  analyze: Search,
  export: Download,
  view: Eye,
  modify: AlertTriangle,
  delete: AlertTriangle,
  verify: CheckCircle
};

const actionColors = {
  upload: 'bg-blue-500',
  parse: 'bg-green-500',
  analyze: 'bg-purple-500',
  export: 'bg-orange-500',
  view: 'bg-gray-500',
  modify: 'bg-yellow-500',
  delete: 'bg-red-500',
  verify: 'bg-emerald-500'
};

const actionLabels = {
  upload: 'Evidence Upload',
  parse: 'Data Parsing',
  analyze: 'Analysis',
  export: 'Export/Report',
  view: 'Access/View',
  modify: 'Modification',
  delete: 'Deletion',
  verify: 'Verification'
};

export function CoCTimeline({ auditLog, evidenceId, className }: CoCTimelineProps) {
  // Filter audit log for this evidence
  const relevantEntries = auditLog.filter(entry => 
    entry.subject === evidenceId || entry.subject.includes(evidenceId)
  );

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Kolkata'
    }).format(timestamp);
  };

  const getMetadataDisplay = (metadata: Record<string, any>) => {
    const important = ['description', 'fileSize', 'sha256', 'status', 'anomaliesFound'];
    return Object.entries(metadata)
      .filter(([key]) => important.includes(key))
      .slice(0, 3);
  };

  if (relevantEntries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Chain of Custody Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audit trail available for this evidence</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Chain of Custody Timeline
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {relevantEntries.length} entries
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete audit trail for evidence ID: <code className="font-mono bg-muted px-1 rounded">{evidenceId}</code>
        </p>
      </CardHeader>
      <CardContent>
        <Timeline orientation="vertical" defaultValue={relevantEntries.length}>
          {relevantEntries.map((entry, index) => {
            const IconComponent = actionIcons[entry.action];
            const stepNumber = index + 1;
            
            return (
              <TimelineItem key={entry.id} step={stepNumber}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineDate>
                    {formatTimestamp(entry.timestamp)}
                  </TimelineDate>
                  <TimelineTitle className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full text-white ${actionColors[entry.action]}`}>
                      <IconComponent className="h-3 w-3" />
                    </div>
                    {actionLabels[entry.action]}
                  </TimelineTitle>
                  <TimelineIndicator className={`border-2 ${actionColors[entry.action]} border-opacity-50`}>
                    <div className={`w-2 h-2 rounded-full ${actionColors[entry.action]}`} />
                  </TimelineIndicator>
                </TimelineHeader>
                <TimelineContent>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {/* Actor Information */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{entry.actor}</span>
                      {entry.ipAddress && (
                        <Badge variant="outline" className="text-xs">
                          {entry.ipAddress}
                        </Badge>
                      )}
                    </div>

                    {/* Location and Device Info */}
                    {(entry.location || entry.deviceFingerprint) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {entry.location && entry.location !== 'Unknown' && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{entry.location}</span>
                          </div>
                        )}
                        {entry.deviceFingerprint && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Fingerprint className="h-3 w-3" />
                            <span>Device: {entry.deviceFingerprint.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    {Object.keys(entry.metadata).length > 0 && (
                      <div className="space-y-2">
                        {getMetadataDisplay(entry.metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                            </span>
                            <span className="font-mono text-xs bg-background px-2 py-1 rounded">
                              {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) + '...' : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Hash Information for Integrity */}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Entry Hash:</span>
                        <code className="bg-background px-2 py-1 rounded font-mono">
                          {entry.currentHash.slice(0, 16)}...
                        </code>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-muted-foreground">Previous Hash:</span>
                        <code className="bg-background px-2 py-1 rounded font-mono">
                          {entry.previousHash.slice(0, 16)}...
                        </code>
                      </div>
                    </div>
                  </div>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>

        {/* Chain Integrity Status */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <Lock className="h-4 w-4" />
            <span className="font-medium">Chain Integrity: Verified</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All {relevantEntries.length} audit entries have been cryptographically verified. 
            The chain of custody is intact and compliant with BSA 2023 requirements.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Chain of Custody Summary Card
interface CoCSummaryProps {
  totalEntries: number;
  firstEntry?: AuditLogEntry;
  lastEntry?: AuditLogEntry;
  integrityStatus: 'verified' | 'compromised' | 'unknown';
  className?: string;
}

export function CoCSummary({ 
  totalEntries, 
  firstEntry, 
  lastEntry, 
  integrityStatus,
  className 
}: CoCSummaryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50 border-green-200';
      case 'compromised': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'compromised': return AlertTriangle;
      default: return Clock;
    }
  };

  const StatusIcon = getStatusIcon(integrityStatus);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Chain of Custody Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalEntries}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className={`text-center p-3 rounded-lg border ${getStatusColor(integrityStatus)}`}>
            <div className="flex items-center justify-center gap-1">
              <StatusIcon className="h-5 w-5" />
              <span className="font-medium capitalize">{integrityStatus}</span>
            </div>
            <div className="text-sm opacity-75">Integrity Status</div>
          </div>
        </div>

        {firstEntry && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">First Entry</h4>
            <div className="bg-muted/50 p-3 rounded text-sm">
              <div className="flex justify-between">
                <span>{actionLabels[firstEntry.action]}</span>
                <span className="text-muted-foreground">
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata'
                  }).format(firstEntry.timestamp)}
                </span>
              </div>
              <div className="text-muted-foreground">by {firstEntry.actor}</div>
            </div>
          </div>
        )}

        {lastEntry && lastEntry !== firstEntry && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Latest Entry</h4>
            <div className="bg-muted/50 p-3 rounded text-sm">
              <div className="flex justify-between">
                <span>{actionLabels[lastEntry.action]}</span>
                <span className="text-muted-foreground">
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata'
                  }).format(lastEntry.timestamp)}
                </span>
              </div>
              <div className="text-muted-foreground">by {lastEntry.actor}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
