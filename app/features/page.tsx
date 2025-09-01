'use client';

import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Search, 
  Network, 
  Filter, 
  RefreshCw, 
  BarChart3, 
  Shield, 
  Eye, 
  Users, 
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  Database,
  Lock,
  Scale
} from 'lucide-react';
import Link from 'next/link';

function FeaturesContent() {
  const keyTasks = [
    {
      icon: FileText,
      title: "IPDR Structure & Formats Understanding",
      description: "Study different types of IPDR logs from various telecom operators",
      implementation: "✅ Multi-operator support (Airtel, Jio, Vodafone, BSNL) with format detection",
      status: "completed",
      demo: "/upload"
    },
    {
      icon: Database,
      title: "Log Parsing Engine",
      description: "Build a system that can read, parse, and clean large and complex IPDR files",
      implementation: "✅ Streaming CSV parser handles GB+ files with real-time progress",
      status: "completed",
      demo: "/upload"
    },
    {
      icon: Users,
      title: "A-Party to B-Party Relationship Mapping",
      description: "Extract and map initiator (A-party) and recipient (B-party) numbers/IPs accurately",
      implementation: "✅ Automatic extraction with E.164 normalization and IP validation",
      status: "completed",
      demo: "/records"
    },
    {
      icon: Filter,
      title: "Relevant Communication Data Filtering",
      description: "Design filters to exclude irrelevant records and focus on useful communication sessions",
      implementation: "✅ Advanced filtering by time, protocol, parties, and data volume",
      status: "completed",
      demo: "/records"
    },
    {
      icon: RefreshCw,
      title: "Diverse Data Format Normalization",
      description: "Handle different file types and formats (CSV, TXT, JSON) across various telecom providers",
      implementation: "✅ Auto-detection of delimiters (CSV/TSV) with robust parsing",
      status: "completed",
      demo: "/upload"
    },
    {
      icon: Network,
      title: "Communication Mapping Tools",
      description: "Create visual graphs or tables showing how different numbers are connected",
      implementation: "✅ Interactive network graphs with relationship visualization",
      status: "completed",
      demo: "/graph"
    },
    {
      icon: Eye,
      title: "Automated Suspicious Activity Detection",
      description: "Pattern analysis to highlight unusual communication behaviors",
      implementation: "✅ AI-powered anomaly detection (late-night calls, burst patterns, cross-operator)",
      status: "completed",
      demo: "/analytics"
    },
    {
      icon: Search,
      title: "Search and Query System",
      description: "Allow investigators to search for specific numbers, IPs, date ranges, and communication types",
      implementation: "✅ Advanced search with filters, date ranges, and real-time results",
      status: "completed",
      demo: "/records"
    },
    {
      icon: BarChart3,
      title: "User-Friendly Dashboard",
      description: "Simple interface to display extracted numbers, call relationships, and red flags",
      implementation: "✅ Modern dashboard with charts, analytics, and investigation tools",
      status: "completed",
      demo: "/"
    },
    {
      icon: Shield,
      title: "Data Security and Compliance",
      description: "Strong security measures to protect sensitive data and comply with privacy laws",
      implementation: "✅ Chain of Custody, BSA 2023 compliance, SHA-256 integrity, court-ready reports",
      status: "completed",
      demo: "/chain-of-custody"
    }
  ];

  const coreFeatures = [
    {
      icon: Zap,
      title: "Real-Time Processing",
      description: "Process GB+ IPDR files with streaming technology and progress tracking",
      highlight: "Enterprise Performance"
    },
    {
      icon: Scale,
      title: "Legal Compliance",
      description: "BSA 2023, Telecom Act 2023, DPDP Act 2023 compliant with court-ready reports",
      highlight: "Court Admissible"
    },
    {
      icon: Lock,
      title: "Chain of Custody",
      description: "Cryptographic integrity with SHA-256 hashing and immutable audit trails",
      highlight: "Forensic Grade"
    },
    {
      icon: Network,
      title: "Intelligent Analytics",
      description: "AI-powered anomaly detection with customizable rules and scoring",
      highlight: "Smart Detection"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavMenu />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <CheckCircle className="h-4 w-4" />
            Hackathon Solution: Smart IPDR Analysis Tool
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IPDR-Intel+ Features
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A comprehensive solution for extracting and identifying B-party recipients from IPDR logs, 
            enabling accurate A-party to B-party mapping for law enforcement investigations.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/#try-demo">
                <FileText className="h-5 w-5 mr-2" />
                Try Demo
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Problem Statement Alignment */}
        <div className="bg-white rounded-lg p-8 mb-12 border">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Problem Statement Solution</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Hackathon Challenge</h3>
            <p className="text-blue-800">
              "Develop a smart tool to extract and identify B-party (recipient) Public IP/mobile numbers from IPDR logs, 
              enabling accurate mapping of A-party to B-party interactions for use in law enforcement investigations."
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">✅ What We Deliver</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Smart B-party extraction</strong> from IPDR logs</li>
                <li>• <strong>Accurate A-party to B-party mapping</strong></li>
                <li>• <strong>Large file processing</strong> (GB+ datasets)</li>
                <li>• <strong>Multi-format support</strong> (CSV, TSV, various operators)</li>
                <li>• <strong>Intelligent filtering</strong> and pattern detection</li>
                <li>• <strong>Visual communication mapping</strong></li>
                <li>• <strong>Automated suspicious activity detection</strong></li>
                <li>• <strong>Court-ready reports</strong> with legal compliance</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🎯 Impact for Law Enforcement</h4>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>Faster investigations</strong> with automated processing</li>
                <li>• <strong>Clear communication insights</strong> and patterns</li>
                <li>• <strong>Suspect identification</strong> through network analysis</li>
                <li>• <strong>Legal admissibility</strong> with BSA 2023 compliance</li>
                <li>• <strong>Chain of custody</strong> maintenance</li>
                <li>• <strong>Streamlined workflows</strong> for investigators</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    {feature.highlight}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Tasks Implementation */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Key Tasks Implementation
          </h2>
          <p className="text-center text-gray-600 mb-8">
            How our solution addresses each requirement from the hackathon problem statement
          </p>
          
          <div className="grid gap-6">
            {keyTasks.map((task, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <task.icon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={task.demo}>
                              Try Demo
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-3">{task.description}</p>
                      <div className="bg-green-50 border-l-4 border-green-500 p-3">
                        <p className="text-green-800 text-sm font-medium">
                          {task.implementation}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Demo Navigation */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-xl mb-6 opacity-90">
            Experience the complete IPDR analysis workflow from upload to court-ready reports
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Button variant="secondary" size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-50">
              <Link href="/upload">
                <FileText className="h-5 w-5 mr-2" />
                Start with Upload
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-50">
              <Link href="/analytics">
                <Eye className="h-5 w-5 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-50">
              <Link href="/chain-of-custody">
                <Shield className="h-5 w-5 mr-2" />
                Legal Compliance
              </Link>
            </Button>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-12 bg-white rounded-lg p-8 border">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>File Size:</strong> Handles GB+ IPDR files</li>
                <li>• <strong>Processing:</strong> Streaming with real-time progress</li>
                <li>• <strong>Records:</strong> Millions of records supported</li>
                <li>• <strong>Memory:</strong> Optimized with LRU caching</li>
                <li>• <strong>Speed:</strong> Web Workers for parallel processing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Compliance & Security</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>BSA 2023:</strong> Section 63 compliant</li>
                <li>• <strong>Telecom Act 2023:</strong> Lawful interception ready</li>
                <li>• <strong>DPDP Act 2023:</strong> Data protection compliant</li>
                <li>• <strong>Integrity:</strong> SHA-256 cryptographic hashing</li>
                <li>• <strong>Audit:</strong> Immutable chain of custody</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <DemoProvider>
      <FeaturesContent />
    </DemoProvider>
  );
}
