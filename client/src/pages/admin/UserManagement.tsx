import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, UserPlus, Mail, Phone, MapPin, Calendar } from "lucide-react";

interface Merchant {
  id: number;
  businessName: string;
  email: string;
  squareId: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  totalSales: number;
  activeGiftCards: number;
}

export default function MerchantManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: merchants = [], isLoading } = useQuery<Merchant[]>({
    queryKey: ["/api/admin/merchants"],
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = merchant.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         merchant.squareId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "verified" && merchant.isEmailVerified) ||
                         (statusFilter === "unverified" && !merchant.isEmailVerified);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Merchant Management</h1>
          <p className="text-gray-300">Manage merchant accounts and business access</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Merchant
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <UserPlus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Total Merchants</p>
                <p className="text-2xl font-bold text-white">{merchants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                <Mail className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Verified</p>
                <p className="text-2xl font-bold text-white">{merchants.filter(m => m.isEmailVerified).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                <Calendar className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Active Today</p>
                <p className="text-2xl font-bold text-white">{merchants.filter(m => {
                  const today = new Date().toDateString();
                  return m.lastLogin && new Date(m.lastLogin).toDateString() === today;
                }).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${merchants.reduce((sum, m) => sum + m.totalSales, 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search merchants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="all" className="bg-gray-800 text-white">All Status</option>
              <option value="verified" className="bg-gray-800 text-white">Verified</option>
              <option value="unverified" className="bg-gray-800 text-white">Unverified</option>
            </select>
            <Button variant="outline" className="border-white/30 text-gray-300 hover:bg-white/10 hover:text-white">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Merchants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Merchants ({filteredMerchants.length})</CardTitle>
          <CardDescription>All registered merchant accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Square ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gift Cards</TableHead>
                    <TableHead>Total Sales</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => (
                    <TableRow key={merchant.id}>
                      <TableCell className="font-medium">{merchant.businessName}</TableCell>
                      <TableCell>{merchant.email}</TableCell>
                      <TableCell className="font-mono text-sm">{merchant.squareId}</TableCell>
                      <TableCell>
                        <Badge className={merchant.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {merchant.isEmailVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>{merchant.activeGiftCards}</TableCell>
                      <TableCell>${merchant.totalSales.toFixed(2)}</TableCell>
                      <TableCell>{new Date(merchant.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {merchant.lastLogin ? new Date(merchant.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredMerchants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No merchants found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}