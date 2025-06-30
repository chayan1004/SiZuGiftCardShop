import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Download, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  UserCheck,
  Database,
  Eye,
  Settings,
  Info,
  Lock,
  Calendar
} from "lucide-react";

interface ConsentRecord {
  id: string;
  consentType: string;
  consentGiven: boolean;
  consentDate: string;
  consentMethod: string;
  consentVersion: string;
  isActive: boolean;
  withdrawalDate?: string;
  withdrawalMethod?: string;
}

interface DataExportData {
  personalData: {
    id: number;
    businessName: string;
    email: string;
    createdAt: string;
    gdprConsent: boolean;
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
  };
  giftCards: any[];
  transactions: any[];
  consents: any[];
  processingRecords: any[];
}

export default function GDPRConsentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [exportDialog, setExportDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [dataRequestDialog, setDataRequestDialog] = useState(false);
  const [confirmDeletion, setConfirmDeletion] = useState('');

  // Fetch consent records
  const { data: consentsData, isLoading: consentsLoading } = useQuery({
    queryKey: ["/api/merchant/gdpr/consents"],
    queryFn: () => apiRequest("GET", "/api/merchant/gdpr/consents").then(res => res.json()),
  });

  // Record consent mutation
  const recordConsentMutation = useMutation({
    mutationFn: (consentData: any) =>
      apiRequest("POST", "/api/gdpr/consent", consentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/gdpr/consents"] });
      toast({
        title: "Consent Updated",
        description: "Your consent preferences have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update consent preferences.",
        variant: "destructive",
      });
    },
  });

  // Withdraw consent mutation
  const withdrawConsentMutation = useMutation({
    mutationFn: ({ consentType, withdrawalMethod }: { consentType: string; withdrawalMethod: string }) =>
      apiRequest("POST", "/api/merchant/gdpr/withdraw-consent", { consentType, withdrawalMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/merchant/gdpr/consents"] });
      toast({
        title: "Consent Withdrawn",
        description: "Your consent has been withdrawn successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw consent.",
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: () =>
      apiRequest("GET", "/api/merchant/gdpr/export-data").then(res => res.json()),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gdpr-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportDialog(false);
      toast({
        title: "Data Exported",
        description: "Your personal data has been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export your data.",
        variant: "destructive",
      });
    },
  });

  // Delete data mutation
  const deleteDataMutation = useMutation({
    mutationFn: () =>
      apiRequest("DELETE", "/api/merchant/gdpr/delete-data", { confirmDeletion: true }),
    onSuccess: () => {
      setDeleteDialog(false);
      toast({
        title: "Data Deleted",
        description: "All your personal data has been permanently deleted.",
      });
      // Redirect to home page as account is deleted
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete your data.",
        variant: "destructive",
      });
    },
  });

  // Create data request mutation
  const createDataRequestMutation = useMutation({
    mutationFn: ({ requestType, requestDetails }: { requestType: string; requestDetails: any }) =>
      apiRequest("POST", "/api/merchant/gdpr/request-data", { requestType, requestDetails }),
    onSuccess: () => {
      setDataRequestDialog(false);
      toast({
        title: "Request Submitted",
        description: "Your data subject request has been submitted and will be processed within 30 days.",
      });
    },
    onError: () => {
      toast({
        title: "Request Failed",
        description: "Failed to submit data subject request.",
        variant: "destructive",
      });
    },
  });

  const handleConsentToggle = (consentType: string, consentGiven: boolean) => {
    if (consentGiven) {
      // Record new consent
      recordConsentMutation.mutate({
        consentType,
        consentGiven: true,
        consentMethod: 'website_dashboard',
        consentVersion: '1.0'
      });
    } else {
      // Withdraw existing consent
      withdrawConsentMutation.mutate({
        consentType,
        withdrawalMethod: 'website_dashboard'
      });
    }
  };

  const getActiveConsent = (consentType: string): ConsentRecord | undefined => {
    return consentsData?.consents?.find((consent: ConsentRecord) => 
      consent.consentType === consentType && 
      consent.isActive && 
      consent.consentGiven &&
      !consent.withdrawalDate
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const consentTypes = [
    {
      id: 'data_processing',
      title: 'Data Processing',
      description: 'Allow processing of your personal data for providing our services',
      required: true
    },
    {
      id: 'marketing',
      title: 'Marketing Communications',
      description: 'Receive marketing emails, newsletters, and promotional content',
      required: false
    },
    {
      id: 'analytics',
      title: 'Analytics & Insights',
      description: 'Help us improve our services through usage analytics',
      required: false
    },
    {
      id: 'cookies',
      title: 'Cookies & Tracking',
      description: 'Allow cookies for enhanced user experience and website functionality',
      required: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Privacy & Data Protection
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your consent preferences and exercise your data rights under GDPR
          </p>
        </div>
      </div>

      <Tabs defaultValue="consents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consents">Consent Management</TabsTrigger>
          <TabsTrigger value="rights">Data Rights</TabsTrigger>
          <TabsTrigger value="history">Privacy History</TabsTrigger>
        </TabsList>

        {/* Consent Management */}
        <TabsContent value="consents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Consent Preferences
              </CardTitle>
              <CardDescription>
                Control how your personal data is processed by managing your consent preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {consentTypes.map((consentType) => {
                const activeConsent = getActiveConsent(consentType.id);
                const isActive = !!activeConsent;

                return (
                  <div key={consentType.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={consentType.id} className="text-base font-medium">
                            {consentType.title}
                          </Label>
                          {consentType.required && (
                            <Badge variant="secondary" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {consentType.description}
                        </p>
                        {activeConsent && (
                          <p className="text-xs text-green-600 dark:text-green-400">
                            Consented on {formatDate(activeConsent.consentDate)}
                          </p>
                        )}
                      </div>
                      <Switch
                        id={consentType.id}
                        checked={isActive}
                        onCheckedChange={(checked) => handleConsentToggle(consentType.id, checked)}
                        disabled={consentType.required && isActive}
                      />
                    </div>
                    <Separator />
                  </div>
                );
              })}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Required consents are necessary for our service to function properly and cannot be withdrawn. 
                  You can withdraw optional consents at any time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Rights */}
        <TabsContent value="rights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Data Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Export Your Data
                </CardTitle>
                <CardDescription>
                  Download a copy of all personal data we have about you (Data Portability - Article 20 GDPR)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={exportDialog} onOpenChange={setExportDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Request Data Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Export Your Personal Data</DialogTitle>
                      <DialogDescription>
                        This will create a downloadable file containing all your personal data, including:
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Personal information and account details
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Gift card and transaction history
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Consent records and preferences
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Data processing records
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setExportDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => exportDataMutation.mutate()}
                        disabled={exportDataMutation.isPending}
                      >
                        {exportDataMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                            Exporting...
                          </>
                        ) : (
                          'Export Data'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Data Request */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Data Subject Requests
                </CardTitle>
                <CardDescription>
                  Request data rectification, restriction, or object to processing (Articles 16-21 GDPR)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={dataRequestDialog} onOpenChange={setDataRequestDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Submit Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Data Subject Request</DialogTitle>
                      <DialogDescription>
                        Submit a request to exercise your data protection rights
                      </DialogDescription>
                    </DialogHeader>
                    <DataSubjectRequestForm onSubmit={(data) => createDataRequestMutation.mutate(data)} />
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Data Deletion */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  Delete All Data
                </CardTitle>
                <CardDescription>
                  Permanently delete all your personal data (Right to Erasure - Article 17 GDPR)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This action is irreversible. All your account data, gift cards, 
                    transaction history, and consent records will be permanently deleted.
                  </AlertDescription>
                </Alert>

                <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Request Data Deletion
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete All Personal Data</DialogTitle>
                      <DialogDescription>
                        This will permanently delete your account and all associated data. This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Please type "DELETE MY DATA" to confirm this action.
                        </AlertDescription>
                      </Alert>
                      <input
                        type="text"
                        value={confirmDeletion}
                        onChange={(e) => setConfirmDeletion(e.target.value)}
                        placeholder="Type: DELETE MY DATA"
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setDeleteDialog(false);
                        setConfirmDeletion('');
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => deleteDataMutation.mutate()}
                        disabled={confirmDeletion !== 'DELETE MY DATA' || deleteDataMutation.isPending}
                      >
                        {deleteDataMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Deleting...
                          </>
                        ) : (
                          'Delete All Data'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Consent History
              </CardTitle>
              <CardDescription>
                View your complete consent and data processing history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consentsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : consentsData?.consents?.length > 0 ? (
                <div className="space-y-4">
                  {consentsData.consents.map((consent: ConsentRecord) => (
                    <div key={consent.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{consent.consentType.replace('_', ' ').toUpperCase()}</h4>
                        <div className="flex items-center gap-2">
                          {consent.consentGiven ? (
                            <Badge variant="success">Granted</Badge>
                          ) : (
                            <Badge variant="destructive">Denied</Badge>
                          )}
                          {!consent.isActive && (
                            <Badge variant="secondary">Withdrawn</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Granted: {formatDate(consent.consentDate)} via {consent.consentMethod}
                        </p>
                        {consent.withdrawalDate && (
                          <p>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Withdrawn: {formatDate(consent.withdrawalDate)} via {consent.withdrawalMethod}
                          </p>
                        )}
                        <p>Version: {consent.consentVersion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No consent records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Data Subject Request Form Component
function DataSubjectRequestForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [requestType, setRequestType] = useState('');
  const [requestDetails, setRequestDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      requestType,
      requestDetails: { description: requestDetails }
    });
  };

  const requestTypes = [
    { value: 'access', label: 'Access to Personal Data', description: 'Request confirmation of data processing and access to your data' },
    { value: 'rectification', label: 'Data Rectification', description: 'Request correction of inaccurate or incomplete data' },
    { value: 'restriction', label: 'Restriction of Processing', description: 'Request limitation of data processing' },
    { value: 'objection', label: 'Object to Processing', description: 'Object to processing based on legitimate interests or direct marketing' },
    { value: 'portability', label: 'Data Portability', description: 'Request transfer of your data to another service provider' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="requestType">Request Type</Label>
        <Select value={requestType} onValueChange={setRequestType}>
          <SelectTrigger>
            <SelectValue placeholder="Select request type" />
          </SelectTrigger>
          <SelectContent>
            {requestTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requestType && (
          <p className="text-sm text-muted-foreground mt-1">
            {requestTypes.find(t => t.value === requestType)?.description}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="requestDetails">Request Details</Label>
        <Textarea
          id="requestDetails"
          value={requestDetails}
          onChange={(e) => setRequestDetails(e.target.value)}
          placeholder="Please provide specific details about your request..."
          rows={4}
          required
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!requestType || !requestDetails.trim()}>
          Submit Request
        </Button>
      </DialogFooter>
    </form>
  );
}