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
      case 'active': return 'bg-green-100 text-green-800';
      case 'redeemed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gift Card Management</h1>
          <p className="text-gray-600">View and manage all gift cards in the system</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by GAN, email, or merchant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm lg:text-base"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm lg:text-base"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
            <Button variant="outline" size="sm" className="lg:size-default">
              <Filter className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              <span className="hidden sm:inline">More Filters</span>
              <span className="sm:hidden">Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gift Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gift Cards ({filteredCards.length})</CardTitle>
          <CardDescription>Complete list of all gift cards with management options</CardDescription>
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
                    <TableHead className="text-xs lg:text-sm">GAN</TableHead>
                    <TableHead className="text-xs lg:text-sm">Amount</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden sm:table-cell">Balance</TableHead>
                    <TableHead className="text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden md:table-cell">Recipient</TableHead>
                    <TableHead className="text-xs lg:text-sm hidden lg:table-cell">Created</TableHead>
                    <TableHead className="text-xs lg:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="font-mono text-xs lg:text-sm">{card.gan.slice(0, 8)}...</TableCell>
                      <TableCell className="text-xs lg:text-sm font-medium">${(card.amount / 100).toFixed(2)}</TableCell>
                      <TableCell className="text-xs lg:text-sm hidden sm:table-cell">${(card.balance / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(card.status)} text-xs`}>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs lg:text-sm hidden md:table-cell max-w-32 truncate">{card.recipientEmail || 'N/A'}</TableCell>
                      <TableCell className="text-xs lg:text-sm hidden lg:table-cell">{new Date(card.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hidden sm:flex">
                            <Edit className="w-3 h-3 lg:w-4 lg:h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hidden lg:flex">
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