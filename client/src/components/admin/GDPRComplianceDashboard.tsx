import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  FileText, 
  Users, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download,
  Trash2,
  Eye,
  Calendar,
  BarChart3,
  Database,
  Lock,
  AlertCircle,
  UserCheck,
  FileWarning
} from "lucide-react";

interface GDPROverview {
  dataProcessing: {
    total: number;
    byLegalBasis: Record<string, number>;
  };
  dataSubjectRequests: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    rejected: number;
    overdue: number;
  };
  dataBreaches: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    resolved: number;
  };
  privacyAssessments: {
    total: number;
    draft: number;
    approved: number;
    highRisk: number;
  };
}

interface DataSubjectRequest {
  id: string;
  requesterId: number;
  requestType: string;
  requestStatus: string;
  requestDate: string;
  completionDate?: string;
  requestDetails: string;
  verificationStatus: string;
  deadlineDate: string;
}

interface DataBreachIncident {
  id: string;
  incidentReference: string;
  discoveryDate: string;
  incidentDate: string;
  breachType: string;
  riskLevel: string;
  affectedRecords: number;
  affectedIndividuals: number;
  incidentStatus: string;
  supervisoryAuthorityNotified: boolean;
  individualNotificationRequired: boolean;
}

interface PrivacyImpactAssessment {
  id: string;
  assessmentTitle: string;
  processingDescription: string;
  residualRisk: string;
  assessmentStatus: string;
  assessorName: string;
  createdAt: string;
}

export default function GDPRComplianceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<DataSubjectRequest | null>(null);
  const [newBreachDialog, setNewBreachDialog] = useState(false);

  // Fetch GDPR compliance overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/admin/gdpr/compliance-overview"],
    queryFn: () => apiRequest("GET", "/api/admin/gdpr/compliance-overview").then(res => res.json()),
  });

  // Fetch data subject requests
  const { data: dataSubjectRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/admin/gdpr/data-subject-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/gdpr/data-subject-requests").then(res => res.json()),
  });

  // Fetch data breaches
  const { data: dataBreaches, isLoading: breachesLoading } = useQuery({
    queryKey: ["/api/admin/gdpr/data-breaches"],
    queryFn: () => apiRequest("GET", "/api/admin/gdpr/data-breaches").then(res => res.json()),
  });

  // Fetch privacy assessments
  const { data: privacyAssessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/admin/gdpr/privacy-impact-assessments"],
    queryFn: () => apiRequest("GET", "/api/admin/gdpr/privacy-impact-assessments").then(res => res.json()),
  });

  // Update data subject request mutation
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiRequest("PUT", `/api/admin/gdpr/data-subject-requests/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gdpr/data-subject-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gdpr/compliance-overview"] });
      toast({
        title: "Request Updated",
        description: "Data subject request has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update data subject request.",
        variant: "destructive",
      });
    },
  });

  // Create data breach mutation
  const createBreachMutation = useMutation({
    mutationFn: (incidentData: any) =>
      apiRequest("POST", "/api/admin/gdpr/data-breach", incidentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gdpr/data-breaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/gdpr/compliance-overview"] });
      setNewBreachDialog(false);
      toast({
        title: "Breach Reported",
        description: "Data breach incident has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Report Failed",
        description: "Failed to create data breach incident.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      processing: "default",
      completed: "success",
      rejected: "destructive",
      verified: "success",
      draft: "secondary",
      approved: "success",
      investigating: "default",
      contained: "default",
      resolved: "success"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRiskBadge = (risk: string) => {
    const variants = {
      low: "success",
      medium: "default",
      high: "destructive"
    } as const;

    return (
      <Badge variant={variants[risk as keyof typeof variants] || "secondary"}>
        {risk.toUpperCase()} RISK
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (deadlineDate: string, status: string) => {
    return new Date(deadlineDate) < new Date() && status !== 'completed';
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const overviewData: GDPROverview = overview?.overview || {
    dataProcessing: { total: 0, byLegalBasis: {} },
    dataSubjectRequests: { total: 0, pending: 0, processing: 0, completed: 0, rejected: 0, overdue: 0 },
    dataBreaches: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, resolved: 0 },
    privacyAssessments: { total: 0, draft: 0, approved: 0, highRisk: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            GDPR Compliance Center
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive data protection and privacy compliance management
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Processing</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.dataProcessing.total}</div>
            <p className="text-xs text-muted-foreground">
              Active processing activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subject Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.dataSubjectRequests.total}</div>
            <p className="text-xs text-muted-foreground">
              {overviewData.dataSubjectRequests.pending} pending • {overviewData.dataSubjectRequests.overdue} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.dataBreaches.total}</div>
            <p className="text-xs text-muted-foreground">
              {overviewData.dataBreaches.highRisk} high risk • {overviewData.dataBreaches.resolved} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Privacy Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewData.privacyAssessments.total}</div>
            <p className="text-xs text-muted-foreground">
              {overviewData.privacyAssessments.approved} approved • {overviewData.privacyAssessments.highRisk} high risk
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Data Subject Requests</TabsTrigger>
          <TabsTrigger value="breaches">Data Breaches</TabsTrigger>
          <TabsTrigger value="assessments">Privacy Assessments</TabsTrigger>
          <TabsTrigger value="processing">Data Processing</TabsTrigger>
        </TabsList>

        {/* Data Subject Requests */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Subject Rights Requests</CardTitle>
              <CardDescription>
                Manage access, portability, rectification, erasure, and other GDPR requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request Type</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataSubjectRequests?.requests?.map((request: DataSubjectRequest) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.requestType.replace('_', ' ').toUpperCase()}
                        </TableCell>
                        <TableCell>ID: {request.requesterId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(request.requestStatus)}
                            {isOverdue(request.deadlineDate, request.requestStatus) && (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(request.requestDate)}</TableCell>
                        <TableCell className={isOverdue(request.deadlineDate, request.requestStatus) ? "text-destructive font-medium" : ""}>
                          {formatDate(request.deadlineDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {request.requestStatus === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateRequestMutation.mutate({
                                  id: request.id,
                                  updates: { requestStatus: 'processing' }
                                })}
                              >
                                Process
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Breaches */}
        <TabsContent value="breaches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Data Breach Incidents</CardTitle>
                <CardDescription>
                  Track and manage data breach incidents per Articles 33-34 GDPR
                </CardDescription>
              </div>
              <Dialog open={newBreachDialog} onOpenChange={setNewBreachDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Breach
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Report Data Breach Incident</DialogTitle>
                    <DialogDescription>
                      Create a new data breach incident record per GDPR Article 33
                    </DialogDescription>
                  </DialogHeader>
                  <DataBreachForm onSubmit={(data) => createBreachMutation.mutate(data)} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {breachesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident Reference</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Affected Records</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Discovery Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataBreaches?.incidents?.map((incident: DataBreachIncident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">
                          {incident.incidentReference}
                        </TableCell>
                        <TableCell>{incident.breachType}</TableCell>
                        <TableCell>{getRiskBadge(incident.riskLevel)}</TableCell>
                        <TableCell>
                          {incident.affectedRecords.toLocaleString()} records / {incident.affectedIndividuals.toLocaleString()} individuals
                        </TableCell>
                        <TableCell>{getStatusBadge(incident.incidentStatus)}</TableCell>
                        <TableCell>{formatDate(incident.discoveryDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Assessments */}
        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Impact Assessments</CardTitle>
              <CardDescription>
                Manage Data Protection Impact Assessments (DPIA) per Article 35 GDPR
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment Title</TableHead>
                      <TableHead>Assessor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {privacyAssessments?.assessments?.map((assessment: PrivacyImpactAssessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="font-medium">
                          {assessment.assessmentTitle}
                        </TableCell>
                        <TableCell>{assessment.assessorName}</TableCell>
                        <TableCell>{getStatusBadge(assessment.assessmentStatus)}</TableCell>
                        <TableCell>{getRiskBadge(assessment.residualRisk)}</TableCell>
                        <TableCell>{formatDate(assessment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Processing */}
        <TabsContent value="processing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Processing Activities</CardTitle>
              <CardDescription>
                Records of Processing Activities (ROPA) per Article 30 GDPR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Data processing records management interface will be displayed here.</p>
                <p className="text-sm mt-2">
                  Total: {overviewData.dataProcessing.total} processing activities
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      {selectedRequest && (
        <RequestDetailsDialog
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={(updates) => {
            updateRequestMutation.mutate({
              id: selectedRequest.id,
              updates
            });
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}

// Data Breach Form Component
function DataBreachForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    discoveryDate: '',
    incidentDate: '',
    breachType: '',
    affectedDataTypes: '',
    affectedRecords: 0,
    affectedIndividuals: 0,
    riskLevel: '',
    containmentMeasures: '',
    supervisoryAuthorityNotified: false,
    individualNotificationRequired: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      affectedDataTypes: JSON.stringify([formData.affectedDataTypes])
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discoveryDate">Discovery Date</Label>
          <Input
            id="discoveryDate"
            type="datetime-local"
            value={formData.discoveryDate}
            onChange={(e) => setFormData({ ...formData, discoveryDate: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="incidentDate">Incident Date</Label>
          <Input
            id="incidentDate"
            type="datetime-local"
            value={formData.incidentDate}
            onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="breachType">Breach Type</Label>
        <Select value={formData.breachType} onValueChange={(value) => setFormData({ ...formData, breachType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select breach type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confidentiality">Confidentiality Breach</SelectItem>
            <SelectItem value="integrity">Integrity Breach</SelectItem>
            <SelectItem value="availability">Availability Breach</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="affectedRecords">Affected Records</Label>
          <Input
            id="affectedRecords"
            type="number"
            value={formData.affectedRecords}
            onChange={(e) => setFormData({ ...formData, affectedRecords: Number(e.target.value) })}
            required
          />
        </div>
        <div>
          <Label htmlFor="affectedIndividuals">Affected Individuals</Label>
          <Input
            id="affectedIndividuals"
            type="number"
            value={formData.affectedIndividuals}
            onChange={(e) => setFormData({ ...formData, affectedIndividuals: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="riskLevel">Risk Level</Label>
        <Select value={formData.riskLevel} onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select risk level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Risk</SelectItem>
            <SelectItem value="medium">Medium Risk</SelectItem>
            <SelectItem value="high">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="containmentMeasures">Containment Measures</Label>
        <Textarea
          id="containmentMeasures"
          value={formData.containmentMeasures}
          onChange={(e) => setFormData({ ...formData, containmentMeasures: e.target.value })}
          placeholder="Describe the immediate actions taken to contain the breach..."
        />
      </div>

      <DialogFooter>
        <Button type="submit">Report Breach</Button>
      </DialogFooter>
    </form>
  );
}

// Request Details Dialog Component
function RequestDetailsDialog({ 
  request, 
  onClose, 
  onUpdate 
}: { 
  request: DataSubjectRequest;
  onClose: () => void;
  onUpdate: (updates: any) => void;
}) {
  const [status, setStatus] = useState(request.requestStatus);
  const [response, setResponse] = useState('');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Data Subject Request Details</DialogTitle>
          <DialogDescription>
            Review and process data subject rights request
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Request Type</Label>
              <p className="text-sm font-medium">{request.requestType.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div>
              <Label>Current Status</Label>
              <p className="text-sm">{request.requestStatus}</p>
            </div>
          </div>

          <div>
            <Label>Request Details</Label>
            <p className="text-sm bg-muted p-3 rounded-md">{request.requestDetails}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Submitted</Label>
              <p className="text-sm">{new Date(request.requestDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label>Deadline</Label>
              <p className="text-sm">{new Date(request.deadlineDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Update Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="response">Response/Notes</Label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Add response or notes about this request..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onUpdate({ 
            requestStatus: status, 
            responseData: response ? JSON.stringify({ response }) : undefined 
          })}>
            Update Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}