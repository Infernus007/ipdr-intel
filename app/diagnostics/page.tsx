'use client';

import { useEffect, useMemo, useState } from 'react';
import { processAirtelFile } from '@/lib/processing';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';

const SAMPLE = `SubscriberID\tSourceIP\tSourcePort\tDestinationIP\tDestinationPort\tProtocol\tStartTime\tEndTime\tBytes
SUB001\t10.10.10.2\t5050\t142.250.183.14\t443\tTCP\t2025-08-20 10:00:05\t2025-08-20 10:00:15\t2048
SUB001\t10.10.10.2\t5051\t8.8.8.8\t53\tUDP\t2025-08-20 10:01:00\t2025-08-20 10:01:02\t128
SUB002\t10.10.20.5\t5060\t13.107.21.200\t443\tTCP\t2025-08-20 10:05:30\t2025-08-20 10:05:40\t1024
SUB003\t10.10.30.7\t5070\t185.60.216.35\t5222\tTCP\t2025-08-20 10:06:00\t2025-08-20 10:06:20\t512
SUB001\t10.10.10.2\t5052\t172.217.14.206\t443\tTCP\t2025-08-20 10:10:00\t2025-08-20 10:10:25\t4096`;

export default function DiagnosticsPage() {
  const { currentCase, addCase, setCurrentCase, addRecords } = useAppStore();
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!currentCase) {
      const c = {
        id: 'diag_case',
        title: 'Diagnostics Case',
        status: 'active' as const,
        createdBy: 'diagnostics',
        createdAt: new Date(),
        updatedAt: new Date(),
        evidenceFiles: [],
        recordCount: 0,
        anomalyCount: 0
      };
      addCase(c);
      setCurrentCase(c);
    }
  }, [currentCase, addCase, setCurrentCase]);

  const run = async () => {
    if (!currentCase) return;
    setRunning(true);
    setLog([]);
    setLog(prev => [...prev, 'Starting diagnostics...']);

    const blob = new Blob([SAMPLE], { type: 'text/plain' });
    const file = new File([blob], 'airtel_sample.csv', { type: 'text/csv' });
    const { evidence, records } = await processAirtelFile(file, currentCase.id);

    setLog(prev => [...prev, `SHA256: ${evidence.sha256.slice(0,16)}...`]);
    setLog(prev => [...prev, `Records parsed: ${records.length}`]);

    // Basic assertions
    const first = records[0];
    if (first.aParty !== '10.10.10.2') setLog(prev => [...prev, 'FAIL: Source IP mismatch']);
    if (first.bParty !== '142.250.183.14') setLog(prev => [...prev, 'FAIL: Destination IP mismatch']);
    if (first.duration !== 10) setLog(prev => [...prev, `WARN: duration=${first.duration} expected 10`]);
    if (first.bytesTransferred !== 2048) setLog(prev => [...prev, 'FAIL: Bytes mismatch']);

    const udp = records.find(r => r.protocol === 'UDP');
    if (!udp) setLog(prev => [...prev, 'FAIL: UDP row missing']);

    addRecords(records);
    setLog(prev => [...prev, 'Diagnostics complete.']);
    setRunning(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Diagnostics</h1>
      <p className="text-sm text-muted-foreground">Runs processing on the provided Airtel sample with SHA-256 and normalization.</p>
      <Button onClick={run} disabled={running}>{running ? 'Running...' : 'Run Diagnostics'}</Button>
      <div className="bg-muted/30 border rounded p-3 text-sm whitespace-pre-wrap min-h-32">
        {log.map((l, i) => (<div key={i}>{l}</div>))}
      </div>
      <details className="bg-muted/10 rounded border p-3">
        <summary className="cursor-pointer">Sample Input</summary>
        <pre className="mt-3 text-xs overflow-auto">{SAMPLE}</pre>
      </details>
    </div>
  );
}


