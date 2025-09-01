'use client';

import { DemoProvider } from '@/components/common/demo-provider';
import NavMenu from '@/components/nav-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  BarChart3, 
  Network, 
  Shield, 
  Search,
  ArrowRight,
  CheckCircle,
  Play,
  BookOpen,
  Lightbulb,
  Target,
  Download
} from 'lucide-react';
import Link from 'next/link';

function GettingStartedContent() {
  const steps = [
    {
      step: 1,
      title: "Upload IPDR Files",
      description: "Start by uploading IPDR files from telecom operators (Airtel, Jio, Vodafone, BSNL)",
      icon: Upload,
      action: "Upload Files",
      href: "/upload",
      details: [
        "Support for CSV and TSV formats",
        "Handle files up to GB+ in size",
        "Automatic operator detection",
        "Real-time progress tracking"
      ]
    },
    {
      step: 2,
      title: "View Processed Records",
      description: "Examine the extracted A-party to B-party relationships and communication data",
      icon: Search,
      action: "View Records",
      href: "/records",
      details: [
        "Interactive table with search and filters",
        "A-party and B-party mapping",
        "Protocol and timing analysis",
        "Data volume insights"
      ]
    },
    {
      step: 3,
      title: "Analyze Patterns",
      description: "Use AI-powered analytics to detect suspicious activities and communication patterns",
      icon: BarChart3,
      action: "Run Analytics",
      href: "/analytics",
      details: [
        "Late-night activity detection",
        "High volume communication alerts",
        "Cross-operator pattern analysis",
        "Customizable anomaly rules"
      ]
    },
    {
      step: 4,
      title: "Visualize Networks",
      description: "Explore communication networks through interactive graph visualizations",
      icon: Network,
      action: "View Graph",
      href: "/graph",
      details: [
        "Interactive network diagrams",
        "Connection strength analysis",
        "Community detection",
        "Export visualizations"
      ]
    },
    {
      step: 5,
      title: "Generate Reports",
      description: "Create court-ready reports with legal compliance and chain of custody",
      icon: FileText,
      action: "Generate Report",
      href: "/reports",
      details: [
        "BSA 2023 Section 63 compliant",
        "Professional PDF formatting",
        "Chain of custody included",
        "Digital signatures and watermarks"
      ]
    },
    {
      step: 6,
      title: "Maintain Chain of Custody",
      description: "Ensure legal admissibility with comprehensive audit trails",
      icon: Shield,
      action: "View CoC",
      href: "/chain-of-custody",
      details: [
        "Cryptographic integrity verification",
        "Immutable audit logging",
        "BSA certificate generation",
        "Legal compliance tracking"
      ]
    }
  ];

  const tips = [
    {
      icon: Target,
      title: "Focus on B-Party Extraction",
      description: "Our tool excels at identifying recipient numbers and IPs from IPDR logs, which is the core requirement of the hackathon."
    },
    {
      icon: Lightbulb,
      title: "Use Filters Effectively",
      description: "Apply time-based and protocol filters to focus on relevant communication sessions for your investigation."
    },
    {
      icon: BookOpen,
      title: "Understand Legal Requirements",
      description: "All reports and evidence handling comply with BSA 2023, Telecom Act 2023, and DPDP Act 2023 for court admissibility."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavMenu />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Play className="h-4 w-4" />
            Quick Start Guide
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Getting Started with IPDR-Intel+
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Follow this step-by-step guide to extract B-party information from IPDR logs 
            and conduct comprehensive law enforcement investigations.
          </p>

          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/upload">
                <Upload className="h-5 w-5 mr-2" />
                Start Now
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/features">
                <BookOpen className="h-5 w-5 mr-2" />
                View Features
              </Link>
            </Button>
          </div>
        </div>

        {/* Problem Statement Reminder */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">Hackathon Problem Statement</h2>
          <p className="text-blue-800">
            "Develop a smart tool to extract and identify B-party (recipient) Public IP/mobile numbers from IPDR logs, 
            enabling accurate mapping of A-party to B-party interactions for use in law enforcement investigations."
          </p>
        </div>

        {/* Step-by-Step Guide */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Step-by-Step Workflow
          </h2>
          
          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg">
                        {step.step}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        <p className="text-gray-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={step.href}>
                        {step.action}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-center">
                      <div className="p-8 bg-blue-100 rounded-full">
                        <step.icon className="h-16 w-16 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                      <ul className="space-y-2">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sample Data Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Get Started with Sample Data
          </h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Download className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Test the System with Sample IPDR Files</h3>
              <p className="text-blue-800 max-w-2xl mx-auto">
                Download our sample CSV files to understand the expected format and test all features 
                without uploading your own data. Perfect for learning the system and validating your setup.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">1K Records</div>
                <div className="text-sm text-gray-600 mb-3">Small Sample (95KB)</div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href="/test-data/airtel_test_small_1k.csv" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">100K Records</div>
                <div className="text-sm text-gray-600 mb-3">Medium Sample (9.3MB)</div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href="/test-data/airtel_test_medium_100k.csv" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">1M Records</div>
                <div className="text-sm text-gray-600 mb-3">Large Sample (93MB)</div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href="/test-data/airtel_test_large_1m.csv" download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3">Expected CSV Format:</h4>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm text-gray-700">
                SourceIP, DestinationIP, Protocol, StartTime, EndTime, Bytes
              </div>
              <p className="text-sm text-gray-600 mt-2">
                The sample files contain realistic IPDR data that demonstrates all system features including 
                analytics, network visualization, and reporting capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Pro Tips for Effective Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                    <tip.icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{tip.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Legal Compliance Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white mb-12">
          <h2 className="text-3xl font-bold text-center mb-6">Legal Compliance Assured</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-semibold mb-2">BSA 2023 Compliant</h3>
              <p className="opacity-90">Section 63 certificate generation for court admissibility</p>
            </div>
            <div>
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-semibold mb-2">Chain of Custody</h3>
              <p className="opacity-90">Immutable audit trails with cryptographic verification</p>
            </div>
            <div>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-semibold mb-2">Court Ready</h3>
              <p className="opacity-90">Professional reports with digital signatures and watermarks</p>
            </div>
          </div>
        </div>

        {/* Quick Start CTA */}
        <div className="text-center bg-white rounded-lg p-8 border shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Your Investigation?</h2>
          <p className="text-gray-600 mb-6">
            Begin with uploading your first IPDR file and experience the complete workflow
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/upload">
                <Upload className="h-5 w-5 mr-2" />
                Upload IPDR File
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
      </main>
    </div>
  );
}

export default function GettingStartedPage() {
  return (
    <DemoProvider>
      <GettingStartedContent />
    </DemoProvider>
  );
}
