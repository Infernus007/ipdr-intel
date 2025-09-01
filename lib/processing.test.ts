import { describe, it, expect } from 'vitest';
import { detectDelimiter, parseDelimited, normalizeAirtelRows, sha256HexOfString, processAirtelFile } from './processing';

const SAMPLE_TSV = `SubscriberID\tSourceIP\tSourcePort\tDestinationIP\tDestinationPort\tProtocol\tStartTime\tEndTime\tBytes\nSUB001\t10.10.10.2\t5050\t142.250.183.14\t443\tTCP\t2025-08-20 10:00:05\t2025-08-20 10:00:15\t2048`;
const SAMPLE_CSV = `SubscriberID,SourceIP,SourcePort,DestinationIP,DestinationPort,Protocol,StartTime,EndTime,Bytes\nSUB001,10.10.10.2,5050,142.250.183.14,443,TCP,2025-08-20 10:00:05,2025-08-20 10:00:15,2048`;

describe('processing utils', () => {
  it('detects delimiter', () => {
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('a,b,c')).toBe(',');
  });

  it('parses TSV and CSV', () => {
    const tsv = parseDelimited(SAMPLE_TSV);
    const csv = parseDelimited(SAMPLE_CSV);
    expect(tsv.length).toBe(1);
    expect(csv.length).toBe(1);
    expect(tsv[0]['SourceIP']).toBe('10.10.10.2');
    expect(csv[0]['DestinationIP']).toBe('142.250.183.14');
  });

  it('normalizes Airtel rows', async () => {
    const rows = parseDelimited(SAMPLE_CSV);
    const recs = await normalizeAirtelRows(rows, 'case1', 'file1', 'airtel');
    expect(recs.length).toBe(1);
    expect(recs[0].aParty).toBe('10.10.10.2');
    expect(recs[0].bParty).toBe('142.250.183.14');
    expect(recs[0].duration).toBe(10);
    expect(recs[0].bytesTransferred).toBe(2048);
    expect(recs[0].rawRowHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('computes stable sha256', async () => {
    const h1 = await sha256HexOfString('hello');
    const h2 = await sha256HexOfString('hello');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('processAirtelFile', () => {
  it('processes CSV file into evidence and records', async () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const file = new File([blob], 'airtel_example.csv', { type: 'text/csv' });
    const { evidence, records } = await processAirtelFile(file, 'caseZ');
    expect(evidence.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.filename).toBe('airtel_example.csv');
    expect(records.length).toBe(1);
    expect(records[0].operator).toBe('airtel');
  });
});


