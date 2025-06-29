import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react";

interface GiftCard {
  id: number;
  gan: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: string;
  merchantId?: string;
  recipientEmail?: string;
}

export default function GiftCardManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: giftCards = [], isLoading } = useQuery<GiftCard[]>({
    queryKey: ["/api/admin/gift-cards"],
    meta: {
      headers: {
        'x-admin-token': localStorage.getItem('adminToken') || ''
      }
    }
  });

  const filteredCards = giftCards.filter(card => {
    const matchesSearch = card.gan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.merchantId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'redeemed': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'expired': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gift Card Management</h1>
          <p className="text-gray-300">View and manage all gift cards in the system</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by GAN, email, or merchant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm lg:text-base bg-white/5 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/20 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base text-white"
            >
              <option value="all" className="bg-gray-800">All Status</option>
              <option value="active" className="bg-gray-800">Active</option>
              <option value="redeemed" className="bg-gray-800">Redeemed</option>
              <option value="expired" className="bg-gray-800">Expired</option>
              <option value="pending" className="bg-gray-800">Pending</option>
            </select>
            <Button variant="outline" size="sm" className="lg:size-default border-white/20 text-white hover:bg-white/10">
              <Filter className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">More Filters</span>
              <span className="sm:hidden">Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gift Cards Table */}
      <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Gift Cards ({filteredCards.length})</CardTitle>
          <CardDescription className="text-gray-300">Complete list of all gift cards with management options</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-xs lg:text-sm text-gray-300">GAN</TableHead>
                    <TableHead className="text-xs lg:text-sm text-gray-300">Amount</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden sm:table-cell text-gray-300">Balance</TableHead>
                    <TableHead className="text-xs lg:text-sm text-gray-300">Status</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden md:table-cell text-gray-300">Recipient</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden lg:table-cell text-gray-300">Created</TableHead>
                    <TableHead className="text-xs lg:text-sm text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-mono text-xs lg:text-sm text-white">{card.gan.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs lg:text-sm font-medium text-white">${(card.amount / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-xs lg:text-sm hidden sm:table-cell text-white">${(card.balance / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(card.status)} text-xs`}>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm hidden md:table-cell max-w-32 truncate text-gray-300">{card.recipientEmail || 'N/A'}</TableCell>
                      <TableCell className="text-xs lg:text-sm hidden lg:table-cell text-gray-300">{new Date(card.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10 text-gray-300 hover:text-white">
                            <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:flex hover:bg-white/10 text-gray-300 hover:text-white">
                            <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hidden lg:flex hover:bg-red-500/20 hover:text-red-300">
                            <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No gift cards found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}