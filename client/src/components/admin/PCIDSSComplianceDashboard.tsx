import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity,
  Network,
  Search,
  Download,
  Plus,
  Calendar,
  BarChart3,
  Monitor,
  Users,
  Database,
  Lock
} from 'lucide-react';

interface PCIStats {
  assessmentsCount: number;
  scansCount: number;
  controlsCount: number;
  incidentsCount: number;
  lastAssessmentDate?: string;
  nextScanDue?: string;
  complianceScore?: number;
  implementedControlsCount: number;
  pendingControlsCount: number;
  overdueScanCount: number;
}

interface Assessment {
  id: string;
  assessmentType: string;
  assessmentDate: string;
  assessmentVersion: string;
  complianceLevel: string;
  assessorName?: string;
  assessorCompany?: string;
  assessmentStatus: string;
  complianceScore?: number;
  nextAssessmentDue?: string;
  certificateNumber?: string;
  certificateExpiry?: string;
}

interface SecurityScan {
  id: string;
  scanType: string;
  scanDate: string;
  scanProvider: string;
  scanStatus: string;
  vulnerabilitiesFound: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  mediumVulnerabilities: number;
  lowVulnerabilities: number;
  nextScanDue?: string;
}

interface SecurityControl {
  id: string;
  requirementNumber: string;
  requirementTitle: string;
  controlCategory: string;
  implementationStatus: string;
  complianceStatus: string;
  riskLevel: string;
  responsiblePerson?: string;
  targetCompletionDate?: string;
  actualCompletionDate?: string;
}

interface Incident {
  id: string;
  incidentId: string;
  incidentType: string;
  discoveryDate: string;
  severity: string;
  cardDataInvolved: boolean;
  estimatedRecordsAffected: number;
  investigationStatus: string;
  forensicsRequired: boolean;
  brandNotificationRequired: boolean;
  acquirerNotificationRequired: boolean;
  lawEnforcementNotified: boolean;
}

export default function PCIDSSComplianceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch PCI DSS statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/pci/stats'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch assessments
  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/admin/pci/assessments']
  });

  // Fetch security scans
  const { data: scansData, isLoading: scansLoading } = useQuery({
    queryKey: ['/api/admin/pci/scans']
  });

  // Fetch security controls
  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['/api/admin/pci/controls']
  });

  // Fetch incidents
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/admin/pci/incidents']
  });

  const pciStats: PCIStats = stats?.stats || {};
  const assessments: Assessment[] = assessmentsData?.assessments || [];
  const scans: SecurityScan[] = scansData?.scans || [];
  const controls: SecurityControl[] = controlsData?.controls || [];
  const incidents: Incident[] = incidentsData?.incidents || [];

  // Generate compliance report mutation
  const generateReportMutation = useMutation({
    mutationFn: (reportType: string) => 
      apiRequest('POST', '/api/admin/pci/generate-report', { reportType }),
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "PCI DSS compliance report has been generated successfully.",
      });
      
      // Download the report
      const reportBlob = new Blob([JSON.stringify(data.report, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pci-dss-compliance-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({
        title: "Report Generation Failed",
        description: "Failed to generate PCI DSS compliance report.",
        variant: "destructive",
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'completed': { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'in_progress': { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'failed': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      'scheduled': { variant: 'outline' as const, color: 'bg-blue-100 text-blue-800' },
      'implemented': { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'not_implemented': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      'partially_implemented': { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'open': { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
      'investigating': { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'contained': { variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' },
      'resolved': { variant: 'default' as const, color: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityColors = {
      'critical': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    
    return (
      <Badge className={severityColors[severity as keyof typeof severityColors] || 'bg-gray-500 text-white'}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PCI DSS Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Payment Card Industry Data Security Standard compliance management
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => generateReportMutation.mutate('comprehensive')}
            disabled={generateReportMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {generateReportMutation.isPending ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {pciStats.complianceScore ? `${pciStats.complianceScore}%` : 'N/A'}
            </div>
            <p className="text-xs text-blue-600">
              {pciStats.lastAssessmentDate ? `Last assessed: ${formatDate(pciStats.lastAssessmentDate)}` : 'No recent assessment'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implemented Controls</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {pciStats.implementedControlsCount} / {pciStats.controlsCount}
            </div>
            <p className="text-xs text-green-600">
              {pciStats.controlsCount > 0 ? 
                `${Math.round((pciStats.implementedControlsCount / pciStats.controlsCount) * 100)}% complete` : 
                'No controls defined'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Scans</CardTitle>
            <Monitor className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {pciStats.scansCount}
            </div>
            <p className="text-xs text-orange-600">
              {pciStats.overdueScanCount > 0 ? 
                `${pciStats.overdueScanCount} overdue` : 
                'All scans current'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {pciStats.incidentsCount}
            </div>
            <p className="text-xs text-red-600">
              {pciStats.incidentsCount === 0 ? 'No incidents recorded' : 'Incidents tracked'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="scans">Security Scans</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Assessments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Recent Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessments.slice(0, 3).map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{assessment.assessmentType}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(assessment.assessmentDate)} - {assessment.assessorCompany}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {assessment.complianceScore && (
                          <Badge variant="outline">{assessment.complianceScore}%</Badge>
                        )}
                        {getStatusBadge(assessment.assessmentStatus)}
                      </div>
                    </div>
                  ))}
                  {assessments.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No assessments recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Security Scans */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-orange-600" />
                  Recent Security Scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scans.slice(0, 3).map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{scan.scanType}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(scan.scanDate)} - {scan.scanProvider}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {scan.criticalVulnerabilities > 0 && (
                          <Badge variant="destructive">{scan.criticalVulnerabilities} Critical</Badge>
                        )}
                        {getStatusBadge(scan.scanStatus)}
                      </div>
                    </div>
                  ))}
                  {scans.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No scans recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Compliance Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Security Controls Implementation</span>
                  <span className="text-sm text-muted-foreground">
                    {pciStats.implementedControlsCount} / {pciStats.controlsCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: pciStats.controlsCount > 0 ? 
                        `${(pciStats.implementedControlsCount / pciStats.controlsCount) * 100}%` : 
                        '0%' 
                    }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{pciStats.implementedControlsCount}</div>
                    <div className="text-xs text-muted-foreground">Implemented</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{pciStats.pendingControlsCount}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{pciStats.assessmentsCount}</div>
                    <div className="text-xs text-muted-foreground">Assessments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{pciStats.scansCount}</div>
                    <div className="text-xs text-muted-foreground">Scans</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Compliance Assessments</CardTitle>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  New Assessment
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{assessment.assessmentType}</h3>
                        <p className="text-sm text-muted-foreground">
                          Version {assessment.assessmentVersion} - Level {assessment.complianceLevel.replace('level_', '')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {assessment.complianceScore && (
                          <Badge variant="outline">{assessment.complianceScore}% Compliance</Badge>
                        )}
                        {getStatusBadge(assessment.assessmentStatus)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Assessment Date:</span>
                        <p>{formatDate(assessment.assessmentDate)}</p>
                      </div>
                      <div>
                        <span className="font-medium">Assessor:</span>
                        <p>{assessment.assessorName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Company:</span>
                        <p>{assessment.assessorCompany || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Certificate:</span>
                        <p>{assessment.certificateNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {assessments.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No assessments recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Security Scans</CardTitle>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Scan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scans.map((scan) => (
                  <div key={scan.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{scan.scanType}</h3>
                        <p className="text-sm text-muted-foreground">
                          {scan.scanProvider} - {formatDate(scan.scanDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {scan.criticalVulnerabilities > 0 && (
                          <Badge variant="destructive">{scan.criticalVulnerabilities} Critical</Badge>
                        )}
                        {getStatusBadge(scan.scanStatus)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total Vulnerabilities:</span>
                        <p>{scan.vulnerabilitiesFound}</p>
                      </div>
                      <div>
                        <span className="font-medium">Critical:</span>
                        <p className="text-red-600">{scan.criticalVulnerabilities}</p>
                      </div>
                      <div>
                        <span className="font-medium">High:</span>
                        <p className="text-orange-600">{scan.highVulnerabilities}</p>
                      </div>
                      <div>
                        <span className="font-medium">Medium:</span>
                        <p className="text-yellow-600">{scan.mediumVulnerabilities}</p>
                      </div>
                      <div>
                        <span className="font-medium">Low:</span>
                        <p className="text-green-600">{scan.lowVulnerabilities}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {scans.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No security scans recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Security Controls</CardTitle>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Control
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {controls.map((control) => (
                  <div key={control.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{control.requirementNumber}: {control.requirementTitle}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {control.controlCategory.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(control.riskLevel)}
                        {getStatusBadge(control.implementationStatus)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Responsible Person:</span>
                        <p>{control.responsiblePerson || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Target Date:</span>
                        <p>{control.targetCompletionDate ? formatDate(control.targetCompletionDate) : 'Not set'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Compliance Status:</span>
                        <p className="capitalize">{control.complianceStatus.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {controls.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No security controls defined</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Security Incidents</CardTitle>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Report Incident
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{incident.incidentId}: {incident.incidentType}</h3>
                        <p className="text-sm text-muted-foreground">
                          Discovered: {formatDate(incident.discoveryDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.investigationStatus)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Card Data Involved:</span>
                        <p className={incident.cardDataInvolved ? 'text-red-600' : 'text-green-600'}>
                          {incident.cardDataInvolved ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Records Affected:</span>
                        <p>{incident.estimatedRecordsAffected}</p>
                      </div>
                      <div>
                        <span className="font-medium">Forensics Required:</span>
                        <p>{incident.forensicsRequired ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Law Enforcement:</span>
                        <p>{incident.lawEnforcementNotified ? 'Notified' : 'Not notified'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {incidents.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No security incidents recorded</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}