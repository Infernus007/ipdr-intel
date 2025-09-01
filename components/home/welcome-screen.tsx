'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroSection } from './hero-section';
import { 
  FileText, 
  Search, 
  Network, 
  Shield, 
  BarChart3, 
  Eye,
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  Scale,
  Upload,
  BookOpenIcon
} from 'lucide-react';
import Link from 'next/link';
import { useWalkthrough } from '@/components/walkthrough/walkthrough-provider';

export function WelcomeScreen() {
  const { startWalkthrough, hasSeenWalkthrough } = useWalkthrough();

  const demoFeatures = [
    {
      icon: FileText,
      title: "Smart IPDR Processing",
      description: "Upload and process GB+ IPDR files from multiple telecom operators",
      demo: "/upload",
      highlight: "Core Feature"
    },
    {
      icon: Users,
      title: "A-Party to B-Party Mapping",
      description: "Accurate extraction and mapping of communication relationships",
      demo: "/records",
      highlight: "Key Requirement"
    },
    {
      icon: Eye,
      title: "Suspicious Activity Detection",
      description: "AI-powered anomaly detection for law enforcement investigations",
      demo: "/analytics",
      highlight: "Smart Analysis"
    },
    {
      icon: Network,
      title: "Communication Mapping",
      description: "Visual network graphs showing connection patterns",
      demo: "/graph",
      highlight: "Visual Insights"
    },
    {
      icon: Search,
      title: "Advanced Search & Filtering",
      description: "Query specific numbers, IPs, date ranges, and communication types",
      demo: "/records",
      highlight: "Investigation Tool"
    },
    {
      icon: Shield,
      title: "Legal Compliance",
      description: "BSA 2023 compliant with court-ready reports and chain of custody",
      demo: "/chain-of-custody",
      highlight: "Court Ready"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Content Sections */}
      <div className="bg-gray-50">
        <main className="container mx-auto px-4 py-16">

        {/* Problem Statement */}
        <div className="bg-white rounded-xl p-8 mb-12 border shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hackathon Problem Statement</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <p className="text-blue-900 font-medium">
              "Develop a smart tool to extract and identify B-party (recipient) Public IP/mobile numbers from IPDR logs, 
              enabling accurate mapping of A-party to B-party interactions for use in law enforcement investigations."
            </p>
          </div>
        </div>

        {/* Demo Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Experience the Complete Solution
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <feature.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary">{feature.highlight}</Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <Button variant="outline" size="sm" asChild className="w-full group-hover:bg-blue-50">
                    <Link href={feature.demo}>
                      Try Demo
                      <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Capabilities */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Key Capabilities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-semibold mb-2">High Performance</h3>
              <p className="opacity-90">Process gigabytes of IPDR data with streaming technology and real-time progress tracking</p>
            </div>
            <div className="text-center">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-semibold mb-2">Legal Compliance</h3>
              <p className="opacity-90">BSA 2023, Telecom Act 2023, and DPDP Act 2023 compliant with court-ready reports</p>
            </div>
            <div className="text-center">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-90" />
              <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
              <p className="opacity-90">AI-powered anomaly detection and visual communication pattern mapping</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-xl p-8 border shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Explore?</h2>
          <p className="text-gray-600 mb-6">
            Experience the complete IPDR analysis workflow from upload to court-ready reports
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/upload">
                <FileText className="h-5 w-5 mr-2" />
                Upload IPDR Files
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/features">
                <Eye className="h-5 w-5 mr-2" />
                View All Features
              </Link>
            </Button>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
