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
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Merchants ({filteredMerchants.length})</CardTitle>
          <CardDescription className="text-gray-300">All registered merchant accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No merchants found matching your criteria
            </div>
          ) : (
            <>
              {/* Mobile Cards - xs to md */}
              <div className="grid gap-4 xs:grid-cols-1 sm:grid-cols-2 md:hidden">
                {filteredMerchants.map((merchant) => (
                  <Card key={merchant.id} className="bg-white/5 border-white/10 p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Business Name</p>
                          <p className="text-white font-semibold truncate">{merchant.businessName}</p>
                        </div>
                        <Badge className={merchant.isEmailVerified ? 'bg-green-500/20 text-green-300 border-green-400/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'}>
                          {merchant.isEmailVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                        <p className="text-white text-sm break-all">{merchant.email}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Gift Cards</p>
                          <p className="text-white font-semibold">{merchant.activeGiftCards}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Total Sales</p>
                          <p className="text-white font-semibold">${merchant.totalSales.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Square ID</p>
                        <p className="text-white font-mono text-sm">{merchant.squareId.substring(0, 16)}...</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Created</p>
                          <p className="text-white text-sm">{new Date(merchant.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Last Login</p>
                          <p className="text-white text-sm">{merchant.lastLogin ? new Date(merchant.lastLogin).toLocaleDateString() : 'Never'}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table - md and larger */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/20 hover:bg-white/5">
                      <TableHead className="text-gray-300">Business Name</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Square ID</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Gift Cards</TableHead>
                      <TableHead className="text-gray-300">Total Sales</TableHead>
                      <TableHead className="text-gray-300">Created</TableHead>
                      <TableHead className="text-gray-300">Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMerchants.map((merchant) => (
                      <TableRow key={merchant.id} className="border-white/20 hover:bg-white/5">
                        <TableCell className="font-medium text-white">{merchant.businessName}</TableCell>
                        <TableCell className="text-gray-300">{merchant.email}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-400">{merchant.squareId}</TableCell>
                        <TableCell>
                          <Badge className={merchant.isEmailVerified ? 'bg-green-500/20 text-green-300 border-green-400/30' : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'}>
                            {merchant.isEmailVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">{merchant.activeGiftCards}</TableCell>
                        <TableCell className="text-gray-300">${merchant.totalSales.toFixed(2)}</TableCell>
                        <TableCell className="text-gray-400">{new Date(merchant.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-gray-400">
                          {merchant.lastLogin ? new Date(merchant.lastLogin).toLocaleDateString() : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}