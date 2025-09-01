'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  Save, 
  History, 
  Code,
  Database,
  Clock,
  Globe,
  Zap
} from 'lucide-react';
import { IPDRRecord, TelecomOperator } from '@/lib/types';
import { format, addDays } from 'date-fns';

export interface AdvancedSearchFilters {
  globalSearch: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sourceIP: string;
  destinationIP: string;
  subscriberID: string;
  protocol: string[];
  operator: TelecomOperator[];
  portRange: {
    min: number | null;
    max: number | null;
  };
  bytesRange: {
    min: number | null;
    max: number | null;
  };
  durationRange: {
    min: number | null;
    max: number | null;
  };
  wiresharkQuery: string;
  savedQueries: string[];
}

interface AdvancedSearchProps {
  onSearch: (filters: AdvancedSearchFilters) => void;
  onClear: () => void;
  totalRecords: number;
  filteredCount: number;
  isLoading?: boolean;
}

const WIRESHARK_EXAMPLES = [
  'ip.src == 192.168.1.1',
  'ip.dst == 8.8.8.8',
  'tcp.port == 443',
  'udp.port == 53',
  'ip.addr == 10.0.0.0/8',
  'tcp.flags.syn == 1',
  'frame.time >= "2025-01-01 00:00:00"',
  'ip.src == 192.168.1.1 and tcp.port == 80',
  'not arp and not icmp',
  'tcp.stream eq 0'
];

const PROTOCOL_OPTIONS = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'FTP', 'SSH', 'ICMP'];
const OPERATOR_OPTIONS: TelecomOperator[] = ['airtel', 'jio', 'vodafone', 'bsnl'];

export function AdvancedSearch({ onSearch, onClear, totalRecords, filteredCount, isLoading }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    globalSearch: '',
    dateRange: { start: null, end: null },
    sourceIP: '',
    destinationIP: '',
    subscriberID: '',
    protocol: [],
    operator: [],
    portRange: { min: null, max: null },
    bytesRange: { min: null, max: null },
    durationRange: { min: null, max: null },
    wiresharkQuery: '',
    savedQueries: []
  });

  const [activeTab, setActiveTab] = useState('simple');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load saved searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ipdr-saved-searches');
    if (saved) {
      const queries = JSON.parse(saved);
      setFilters(prev => ({ ...prev, savedQueries: queries }));
    }
    
    const history = localStorage.getItem('ipdr-search-history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const handleFilterChange = useCallback((key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearch = useCallback(() => {
    // Add to search history
    const query = filters.globalSearch || filters.wiresharkQuery;
    if (query && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory.slice(0, 9)]; // Keep last 10
      setSearchHistory(newHistory);
      localStorage.setItem('ipdr-search-history', JSON.stringify(newHistory));
    }
    
    onSearch(filters);
  }, [filters, onSearch, searchHistory]);

  const handleClear = useCallback(() => {
    setFilters({
      globalSearch: '',
      dateRange: { start: null, end: null },
      sourceIP: '',
      destinationIP: '',
      subscriberID: '',
      protocol: [],
      operator: [],
      portRange: { min: null, max: null },
      bytesRange: { min: null, max: null },
      durationRange: { min: null, max: null },
      wiresharkQuery: '',
      savedQueries: filters.savedQueries
    });
    onClear();
  }, [filters.savedQueries, onClear]);

  const saveCurrentQuery = useCallback(() => {
    const query = filters.wiresharkQuery || filters.globalSearch;
    if (query && !filters.savedQueries.includes(query)) {
      const newQueries = [...filters.savedQueries, query];
      setFilters(prev => ({ ...prev, savedQueries: newQueries }));
      localStorage.setItem('ipdr-saved-searches', JSON.stringify(newQueries));
    }
  }, [filters]);

  const loadSavedQuery = useCallback((query: string) => {
    if (query.includes('==') || query.includes('and') || query.includes('or')) {
      handleFilterChange('wiresharkQuery', query);
      setActiveTab('advanced');
    } else {
      handleFilterChange('globalSearch', query);
      setActiveTab('simple');
    }
  }, [handleFilterChange]);

  const parseWiresharkQuery = useCallback((query: string) => {
    // Basic Wireshark query parser for common patterns
    const newFilters = { ...filters };
    
    // Parse IP addresses
    const srcMatch = query.match(/ip\.src\s*==\s*([^\s]+)/);
    if (srcMatch) newFilters.sourceIP = srcMatch[1].replace(/"/g, '');
    
    const dstMatch = query.match(/ip\.dst\s*==\s*([^\s]+)/);
    if (dstMatch) newFilters.destinationIP = dstMatch[1].replace(/"/g, '');
    
    // Parse protocols
    const tcpMatch = query.match(/tcp\.port\s*==\s*(\d+)/);
    const udpMatch = query.match(/udp\.port\s*==\s*(\d+)/);
    
    if (tcpMatch) {
      newFilters.protocol = ['TCP'];
      newFilters.portRange.min = parseInt(tcpMatch[1]);
      newFilters.portRange.max = parseInt(tcpMatch[1]);
    }
    
    if (udpMatch) {
      newFilters.protocol = ['UDP'];
      newFilters.portRange.min = parseInt(udpMatch[1]);
      newFilters.portRange.max = parseInt(udpMatch[1]);
    }
    
    setFilters(newFilters);
  }, [filters]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced IPDR Search & Query
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            {filteredCount.toLocaleString()} of {totalRecords.toLocaleString()} records
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simple" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Simple Search
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Wireshark Query
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Field Filters
            </TabsTrigger>
          </TabsList>

          {/* Simple Search Tab */}
          <TabsContent value="simple" className="space-y-4">
            <div className="space-y-2">
              <Label>Global Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across all fields (IPs, protocols, subscriber IDs...)"
                  value={filters.globalSearch}
                  onChange={(e) => handleFilterChange('globalSearch', e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.start ? (
                      filters.dateRange.end ? (
                        `${format(filters.dateRange.start, 'MMM dd, yyyy')} - ${format(filters.dateRange.end, 'MMM dd, yyyy')}`
                      ) : (
                        format(filters.dateRange.start, 'MMM dd, yyyy')
                      )
                    ) : (
                      'Select date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    <div className="p-3">
                      <Label className="text-sm font-medium">Start Date</Label>
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.start || undefined}
                        onSelect={(date) => handleFilterChange('dateRange', { ...filters.dateRange, start: date || null })}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="p-3">
                      <Label className="text-sm font-medium">End Date</Label>
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.end || undefined}
                        onSelect={(date) => handleFilterChange('dateRange', { ...filters.dateRange, end: date || null })}
                        className="rounded-md border"
                        disabled={(date) => filters.dateRange.start ? date < filters.dateRange.start : false}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 p-3 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        handleFilterChange('dateRange', { start: addDays(now, -7), end: now });
                      }}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const now = new Date();
                        handleFilterChange('dateRange', { start: addDays(now, -30), end: now });
                      }}
                    >
                      Last 30 days
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>

          {/* Wireshark Query Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-2">
              <Label>Wireshark-style Query</Label>
              <Textarea
                placeholder="Enter Wireshark-style query (e.g., ip.src == 192.168.1.1 and tcp.port == 443)"
                value={filters.wiresharkQuery}
                onChange={(e) => handleFilterChange('wiresharkQuery', e.target.value)}
                className="font-mono text-sm"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => parseWiresharkQuery(filters.wiresharkQuery)}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Parse Query
                </Button>
                <Button variant="outline" size="sm" onClick={saveCurrentQuery}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Query
                </Button>
              </div>
            </div>

            {/* Query Examples */}
            <div className="space-y-2">
              <Label className="text-sm">Examples:</Label>
              <div className="flex flex-wrap gap-1">
                {WIRESHARK_EXAMPLES.map((example, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer text-xs"
                    onClick={() => handleFilterChange('wiresharkQuery', example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Field Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Source IP */}
              <div className="space-y-2">
                <Label>Source IP</Label>
                <Input
                  placeholder="192.168.1.1"
                  value={filters.sourceIP}
                  onChange={(e) => handleFilterChange('sourceIP', e.target.value)}
                />
              </div>

              {/* Destination IP */}
              <div className="space-y-2">
                <Label>Destination IP</Label>
                <Input
                  placeholder="8.8.8.8"
                  value={filters.destinationIP}
                  onChange={(e) => handleFilterChange('destinationIP', e.target.value)}
                />
              </div>

              {/* Subscriber ID */}
              <div className="space-y-2">
                <Label>Subscriber ID</Label>
                <Input
                  placeholder="SUB001, +919876543210"
                  value={filters.subscriberID}
                  onChange={(e) => handleFilterChange('subscriberID', e.target.value)}
                />
              </div>

              {/* Protocol */}
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Select
                  value={filters.protocol[0] || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('protocol', value === 'all' ? [] : [value])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All protocols" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Protocols</SelectItem>
                    {PROTOCOL_OPTIONS.map(protocol => (
                      <SelectItem key={protocol} value={protocol}>{protocol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operator */}
              <div className="space-y-2">
                <Label>Telecom Operator</Label>
                <Select
                  value={filters.operator[0] || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('operator', value === 'all' ? [] : [value as TelecomOperator])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All operators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operators</SelectItem>
                    {OPERATOR_OPTIONS.map(operator => (
                      <SelectItem key={operator} value={operator}>
                        {operator.charAt(0).toUpperCase() + operator.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Port Range */}
              <div className="space-y-2">
                <Label>Port Range</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.portRange.min || ''}
                    onChange={(e) => handleFilterChange('portRange', {
                      ...filters.portRange,
                      min: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={filters.portRange.max || ''}
                    onChange={(e) => handleFilterChange('portRange', {
                      ...filters.portRange,
                      max: e.target.value ? parseInt(e.target.value) : null
                    })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Search History & Saved Queries */}
        {(searchHistory.length > 0 || filters.savedQueries.length > 0) && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent & Saved Searches
            </Label>
            <div className="flex flex-wrap gap-1">
              {searchHistory.slice(0, 5).map((query, index) => (
                <Badge
                  key={`history-${index}`}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() => loadSavedQuery(query)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {query.length > 30 ? `${query.substring(0, 30)}...` : query}
                </Badge>
              ))}
              {filters.savedQueries.map((query, index) => (
                <Badge
                  key={`saved-${index}`}
                  variant="secondary"
                  className="cursor-pointer text-xs"
                  onClick={() => loadSavedQuery(query)}
                >
                  <Save className="h-3 w-3 mr-1" />
                  {query.length > 30 ? `${query.substring(0, 30)}...` : query}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search Records
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Press Enter in search fields to execute
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
