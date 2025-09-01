'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  BarChart3, 
  Network, 
  FileText, 
  AlertTriangle, 
  Search,
  Shield,
  CheckCircle,
  ArrowRight,
  Info,
  PlayCircle
} from 'lucide-react';

interface DemoGuideProps {
  hasData: boolean;
  recordCount: number;
  onStartTour: () => void;
}

export function DemoGuide({ hasData, recordCount, onStartTour }: DemoGuideProps) {
  const demoSteps = [
    {
      step: 1,
      title: "Upload IPDR Data",
      description: "Upload your CSV/JSON IPDR files to begin analysis",
      icon: Upload,
      href: "#upload",
      status: hasData ? "completed" : "current",
      color: "bg-blue-500"
    },
    {
      step: 2,
      title: "View Records",
      description: "Explore A-party to B-party communication patterns",
      icon: BarChart3,
      href: "/records",
      status: hasData ? "available" : "pending",
      color: "bg-green-500"
    },
    {
      step: 3,
      title: "Advanced Search",
      description: "Use Wireshark-style queries to filter data",
      icon: Search,
      href: "/records",
      status: hasData ? "available" : "pending",
      color: "bg-purple-500"
    },
    {
      step: 4,
      title: "Network Visualization",
      description: "Interactive graphs showing communication networks",
      icon: Network,
      href: "/graph",
      status: hasData ? "available" : "pending",
      color: "bg-indigo-500"
    },
    {
      step: 5,
      title: "Anomaly Detection",
      description: "AI-powered detection of suspicious patterns",
      icon: AlertTriangle,
      href: "/analytics",
      status: hasData ? "available" : "pending",
      color: "bg-orange-500"
    },
    {
      step: 6,
      title: "Generate Reports",
      description: "Court-ready PDF reports with BSA 2023 compliance",
      icon: FileText,
      href: "/reports",
      status: hasData ? "available" : "pending",
      color: "bg-red-500"
    },
    {
      step: 7,
      title: "Chain of Custody",
      description: "Legal audit trail and evidence integrity",
      icon: Shield,
      href: "/chain-of-custody",
      status: hasData ? "available" : "pending",
      color: "bg-gray-500"
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Demo Walkthrough
            </CardTitle>
            <CardDescription>
              Follow these steps to explore all IPDR-Intel+ features
            </CardDescription>
          </div>
          <Button onClick={onStartTour} variant="outline" size="sm">
            <PlayCircle className="h-4 w-4 mr-2" />
            Start Guided Tour
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!hasData && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Getting Started:</strong> Upload the example.csv file to begin exploring features. 
              The system will automatically process the data and enable all analysis tools.
            </AlertDescription>
          </Alert>
        )}

        {hasData && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Data Loaded!</strong> {recordCount.toLocaleString()} records processed. 
              All features are now available for exploration.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {demoSteps.map((step, index) => (
            <div key={step.step}>
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-white ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">
                      Step {step.step}: {step.title}
                    </h3>
                    <Badge 
                      variant={
                        step.status === "completed" ? "default" : 
                        step.status === "current" ? "secondary" : 
                        step.status === "available" ? "outline" : "secondary"
                      }
                      className={
                        step.status === "completed" ? "bg-green-100 text-green-800 border-green-200" :
                        step.status === "current" ? "bg-blue-100 text-blue-800 border-blue-200" :
                        step.status === "available" ? "bg-purple-100 text-purple-800 border-purple-200" :
                        "bg-gray-100 text-gray-600 border-gray-200"
                      }
                    >
                      {step.status === "completed" ? "✓ Done" :
                       step.status === "current" ? "Current" :
                       step.status === "available" ? "Ready" : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                
                {step.status === "available" && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={step.href}>
                      Explore
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                )}
                
                {step.status === "current" && step.href === "#upload" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Upload file above ↑
                  </Badge>
                )}
              </div>
              
              {index < demoSteps.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-px h-4 bg-gray-200"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />
        
        <div className="text-center space-y-2">
          <h4 className="font-medium text-gray-900">Need Help?</h4>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/features">
                <Info className="h-4 w-4 mr-2" />
                View All Features
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/getting-started">
                <PlayCircle className="h-4 w-4 mr-2" />
                Getting Started Guide
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
