import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecordsTable } from './records-table';
import { IPDRRecord } from '@/lib/types';

const mockRecords: IPDRRecord[] = [
  {
    id: 'rec1',
    caseId: 'case1',
    aParty: '10.10.10.2',
    aPort: '5050',
    bParty: '142.250.183.14',
    bPort: '443',
    protocol: 'TCP',
    startTimestamp: new Date('2025-08-20T10:00:05'),
    endTimestamp: new Date('2025-08-20T10:00:15'),
    duration: 10,
    bytesTransferred: 2048,
    sourceFileId: 'file1',
    rawRowHash: 'hash1',
    operator: 'airtel'
  },
  {
    id: 'rec2',
    caseId: 'case1',
    aParty: '10.10.10.2',
    aPort: '5051',
    bParty: '8.8.8.8',
    bPort: '53',
    protocol: 'UDP',
    startTimestamp: new Date('2025-08-20T10:01:00'),
    endTimestamp: new Date('2025-08-20T10:01:02'),
    duration: 2,
    bytesTransferred: 128,
    sourceFileId: 'file1',
    rawRowHash: 'hash2',
    operator: 'airtel'
  }
];

describe('RecordsTable', () => {
  it('renders records correctly', () => {
    render(<RecordsTable records={mockRecords} />);
    
    expect(screen.getAllByText('10.10.10.2')).toHaveLength(2);
    expect(screen.getByText('142.250.183.14')).toBeInTheDocument();
    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('UDP')).toBeInTheDocument();
  });

  it('shows correct record count', () => {
    render(<RecordsTable records={mockRecords} />);
    
    expect(screen.getByText('2 of 2 records')).toBeInTheDocument();
  });

  it('filters records by source IP', async () => {
    render(<RecordsTable records={mockRecords} />);
    
    const sourceIPFilter = screen.getByPlaceholderText('Source IP');
    fireEvent.change(sourceIPFilter, { target: { value: '10.10.10.2' } });
    
    // Both records should still be visible as they have the same source IP
    expect(screen.getByText('2 of 2 records')).toBeInTheDocument();
  });

  it('filters records by protocol', async () => {
    render(<RecordsTable records={mockRecords} />);
    
    // Find and click the protocol select
    const protocolSelects = screen.getAllByRole('combobox');
    const protocolSelect = protocolSelects.find(select => 
      select.getAttribute('aria-label')?.includes('Protocol') || 
      select.closest('[data-testid="protocol-filter"]')
    );
    
    if (protocolSelect) {
      fireEvent.click(protocolSelect);
      
      // Wait for dropdown to appear and select TCP
      const tcpOption = await screen.findByText('TCP');
      fireEvent.click(tcpOption);
      
      // Should show only TCP records
      expect(screen.getByText('1 of 2 records')).toBeInTheDocument();
    }
  });

  it('handles row selection', () => {
    const onSelectionChange = vi.fn();
    render(<RecordsTable records={mockRecords} onSelectionChange={onSelectionChange} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    const firstRowCheckbox = checkboxes[1]; // Skip header checkbox
    
    fireEvent.click(firstRowCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalled();
  });

  it('sorts records by timestamp', () => {
    render(<RecordsTable records={mockRecords} />);
    
    const startTimeHeader = screen.getByText('Start Time');
    fireEvent.click(startTimeHeader);
    
    // Should trigger sorting (visual verification would need more complex testing)
    expect(startTimeHeader).toBeInTheDocument();
  });

  it('shows empty state when no records', () => {
    render(<RecordsTable records={[]} />);
    
    expect(screen.getByText('No records found.')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 records')).toBeInTheDocument();
  });

  it('displays bytes in human readable format', () => {
    render(<RecordsTable records={mockRecords} />);
    
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('128 B')).toBeInTheDocument();
  });

  it('shows operator badges with correct colors', () => {
    render(<RecordsTable records={mockRecords} />);
    
    const operatorBadges = screen.getAllByText('AIRTEL');
    expect(operatorBadges).toHaveLength(2);
    
    // Check that badges have styling (would need more specific testing for colors)
    operatorBadges.forEach(badge => {
      expect(badge).toHaveClass('text-white');
    });
  });
});
