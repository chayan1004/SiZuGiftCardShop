import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Calendar, Clock, Eye, FileText, Shield, Users, Database } from "lucide-react";

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

// Badge variant helper
function getStatusBadge(status: string) {
  const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
    pending: "outline",
    processing: "secondary",
    completed: "default",
    rejected: "destructive",
    draft: "outline",
    approved: "default",
    high: "destructive",
    medium: "secondary",
    low: "outline"
  };
  
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

// Date formatting helper
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString();
}

// Check if request is overdue
function isOverdue(deadlineDate: string, status: string): boolean {
  if (status === 'completed') return false;
  return new Date(deadlineDate) < new Date();
}

export default function GDPRComplianceDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch GDPR overview data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/admin/gdpr/overview'],
  });

  // Fetch data subject requests
  const { data: dataSubjectRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/admin/gdpr/data-subject-requests'],
  });

  // Fetch data breaches
  const { data: dataBreaches, isLoading: breachesLoading } = useQuery({
    queryKey: ['/api/admin/gdpr/data-breaches'],
  });

  // Fetch privacy assessments
  const { data: privacyAssessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['/api/admin/gdpr/privacy-assessments'],
  });

  // Update request status mutation
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return apiRequest('PUT', `/api/admin/gdpr/data-subject-requests/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gdpr/data-subject-requests'] });
      toast({ title: "Request updated successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error updating request", 
        variant: "destructive" 
      });
    },
  });

  // Create breach incident mutation
  const createBreachMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/gdpr/data-breaches', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gdpr/data-breaches'] });
      toast({ title: "Breach incident created successfully" });
    },
    onError: () => {
      toast({ 
        title: "Error creating breach incident", 
        variant: "destructive" 
      });
    },
  });

  const overviewData: GDPROverview = overview?.overview || {
    dataProcessing: { total: 0, byLegalBasis: {} },
    dataSubjectRequests: { total: 0, pending: 0, processing: 0, completed: 0, rejected: 0, overdue: 0 },
    dataBreaches: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, resolved: 0 },
    privacyAssessments: { total: 0, draft: 0, approved: 0, highRisk: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            GDPR Compliance Center
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Complete data protection compliance monitoring and management
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 lg:gap-6">
          <Card className="glass-card border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="p-2 xs:p-3 sm:p-4 md:p-6 pb-1 xs:pb-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-100 truncate">
                    Data Requests
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden xs:block">
                    Total subject requests
                  </CardDescription>
                </div>
                <Users className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewData.dataSubjectRequests.total}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {overviewData.dataSubjectRequests.overdue} overdue
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="p-2 xs:p-3 sm:p-4 md:p-6 pb-1 xs:pb-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-100 truncate">
                    Data Breaches
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden xs:block">
                    Security incidents
                  </CardDescription>
                </div>
                <AlertCircle className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewData.dataBreaches.total}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {overviewData.dataBreaches.highRisk} high risk
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="p-2 xs:p-3 sm:p-4 md:p-6 pb-1 xs:pb-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-100 truncate">
                    Data Processing
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden xs:block">
                    Total records
                  </CardDescription>
                </div>
                <Database className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewData.dataProcessing.total}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Active records
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="p-2 xs:p-3 sm:p-4 md:p-6 pb-1 xs:pb-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm xs:text-base sm:text-lg md:text-xl text-gray-900 dark:text-gray-100 truncate">
                    Assessments
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden xs:block">
                    Privacy impact
                  </CardDescription>
                </div>
                <Shield className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="p-2 xs:p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {overviewData.privacyAssessments.total}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {overviewData.privacyAssessments.approved} approved
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="glass-card border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardContent className="p-2 xs:p-3 sm:p-4 md:p-6">
            <Tabs defaultValue="requests" className="w-full">
              <div className="overflow-x-auto mb-3 sm:mb-4">
                <TabsList className="grid w-full grid-cols-2 xs:grid-cols-4 min-w-max xs:min-w-0 gap-1 xs:gap-0">
                  <TabsTrigger value="requests" className="text-xs xs:text-sm whitespace-nowrap px-2 xs:px-3">
                    <span className="hidden xs:inline">Data Requests</span>
                    <span className="xs:hidden">Requests</span>
                  </TabsTrigger>
                  <TabsTrigger value="breaches" className="text-xs xs:text-sm whitespace-nowrap px-2 xs:px-3">
                    <span className="hidden xs:inline">Data Breaches</span>
                    <span className="xs:hidden">Breaches</span>
                  </TabsTrigger>
                  <TabsTrigger value="assessments" className="text-xs xs:text-sm whitespace-nowrap px-2 xs:px-3">
                    <span className="hidden sm:inline">Privacy Assessments</span>
                    <span className="sm:hidden">Assessments</span>
                  </TabsTrigger>
                  <TabsTrigger value="processing" className="text-xs xs:text-sm whitespace-nowrap px-2 xs:px-3">
                    <span className="hidden xs:inline">Data Processing</span>
                    <span className="xs:hidden">Processing</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Data Subject Requests */}
              <TabsContent value="requests" className="space-y-2 xs:space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-3">
                  <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    <span className="hidden sm:inline">Data Subject Rights Requests</span>
                    <span className="sm:hidden">Data Requests</span>
                  </h3>
                  <Button size="sm" className="w-full xs:w-auto text-xs xs:text-sm">
                    <FileText className="w-3 h-3 xs:w-4 xs:h-4 mr-1 xs:mr-2" />
                    <span className="hidden xs:inline">Export Report</span>
                    <span className="xs:hidden">Export</span>
                  </Button>
                </div>

                {requestsLoading ? (
                  <div className="flex justify-center py-6 xs:py-8">
                    <div className="animate-spin w-5 h-5 xs:w-6 xs:h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View (xs and below) */}
                    <div className="block xs:hidden space-y-3">
                      {dataSubjectRequests?.requests?.map((request: DataSubjectRequest) => (
                        <Card key={request.id} className="p-3 bg-white/50 dark:bg-gray-800/50">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {request.requestType.replace('_', ' ').toUpperCase()}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  ID: {request.requesterId}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {getStatusBadge(request.requestStatus)}
                                {isOverdue(request.deadlineDate, request.requestStatus) && (
                                  <AlertCircle className="w-3 h-3 text-destructive" />
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                              <span>Deadline: {formatDate(request.deadlineDate)}</span>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="text-xs px-2 py-1 h-6">
                                  <Eye className="w-3 h-3" />
                                </Button>
                                {request.requestStatus === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs px-2 py-1 h-6"
                                    onClick={() => updateRequestMutation.mutate({
                                      id: request.id,
                                      updates: { requestStatus: 'processing' }
                                    })}
                                  >
                                    Process
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Desktop Table View (xs and above) */}
                    <div className="hidden xs:block overflow-x-auto">
                      <div className="min-w-full rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs sm:text-sm">Type</TableHead>
                              <TableHead className="text-xs sm:text-sm">Requester</TableHead>
                              <TableHead className="text-xs sm:text-sm">Status</TableHead>
                              <TableHead className="text-xs sm:text-sm hidden md:table-cell">Submitted</TableHead>
                              <TableHead className="text-xs sm:text-sm">Deadline</TableHead>
                              <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {dataSubjectRequests?.requests?.map((request: DataSubjectRequest) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium text-xs sm:text-sm">
                                  <span className="hidden sm:inline">
                                    {request.requestType.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className="sm:hidden">
                                    {request.requestType.replace('_', ' ').substring(0, 8)}...
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm">
                                  ID: {request.requesterId}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {getStatusBadge(request.requestStatus)}
                                    {isOverdue(request.deadlineDate, request.requestStatus) && (
                                      <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                                  {formatDate(request.requestDate)}
                                </TableCell>
                                <TableCell className={`text-xs sm:text-sm ${isOverdue(request.deadlineDate, request.requestStatus) ? "text-destructive font-medium" : ""}`}>
                                  {formatDate(request.deadlineDate)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    <Button variant="outline" size="sm" className="text-xs px-1 xs:px-2 py-1 h-6 xs:h-8">
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    {request.requestStatus === 'pending' && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs px-1 xs:px-2 py-1 h-6 xs:h-8 hidden sm:block"
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
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Other tabs would follow similar mobile-first responsive patterns */}
              <TabsContent value="breaches" className="space-y-3 sm:space-y-4 mt-4">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Data breaches section coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-3 sm:space-y-4 mt-4">
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Privacy assessments section coming soon</p>
                </div>
              </TabsContent>

              <TabsContent value="processing" className="space-y-3 sm:space-y-4 mt-4">
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Data processing records coming soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}