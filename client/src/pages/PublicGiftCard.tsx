import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { 
  Gift, 
  QrCode, 
  Download, 
  Mail, 
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface PublicGiftCardProps {
  gan: string;
}

export default function PublicGiftCard({ gan }: PublicGiftCardProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: giftCardData, isLoading, error } = useQuery({
    queryKey: ['giftcard', gan, 'public'],
    queryFn: async () => {
      const response = await fetch(`/api/giftcards/${gan}/public`);
      if (!response.ok) {
        throw new Error('Gift card not found');
      }
      return response.json();
    },
    enabled: !!gan
  });

  const giftCard = giftCardData?.giftCard;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: `${label} copied!`,
        description: "The information has been copied to your clipboard."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy the information manually.",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = () => {
    if (giftCard?.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = giftCard.qrCodeUrl;
      link.download = `giftcard-${gan}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "QR Code downloaded",
        description: "The QR code has been saved to your device."
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading Gift Card...</h2>
        </div>
      </div>
    );
  }

  if (error || !giftCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Card className="glass-premium border-white/10 max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Gift Card Not Found</h2>
            <p className="text-gray-300 mb-6">
              The gift card you're looking for could not be found or may have expired.
            </p>
            <Button onClick={() => window.location.href = '/store'} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
              Browse Gift Cards
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-indigo-500/5" />
          <div className="absolute top-20 right-20 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="w-16 h-16 gradient-premium rounded-2xl flex items-center justify-center shadow-2xl">
                  <Gift className="text-white" size={24} />
                </div>
                <div>
                  <span className="font-display text-4xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    SiZu
                  </span>
                  <div className="font-mono text-xs text-cyan-300 tracking-[0.3em] font-semibold">
                    GIFT CARD
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Gift Card Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Gift Card Visual */}
              <Card className="glass-premium border-white/10 overflow-hidden">
                <CardContent className="p-8">
                  <div className="relative">
                    {/* Gift Card Design */}
                    <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                          <Gift className="w-8 h-8" />
                          <span className="font-bold text-xl">SiZu</span>
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {giftCard.status}
                        </Badge>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-sm opacity-80 mb-1">Gift Card Value</div>
                        <div className="text-4xl font-bold">
                          ${(giftCard.amount / 100).toFixed(2)}
                        </div>
                      </div>
                      
                      {giftCard.personalMessage && (
                        <div className="mb-6">
                          <div className="text-sm opacity-80 mb-1">Personal Message</div>
                          <div className="text-lg italic">"{giftCard.personalMessage}"</div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-end">
                        <div>
                          {giftCard.senderName && (
                            <div className="text-sm opacity-80">From: {giftCard.senderName}</div>
                          )}
                          {giftCard.recipientName && (
                            <div className="text-sm opacity-80">To: {giftCard.recipientName}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs opacity-60 font-mono">GAN</div>
                          <div className="text-sm font-mono">{gan.slice(-8)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced QR Code Section */}
                    {giftCard.qrCodeUrl && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-center"
                      >
                        <div className="relative inline-block">
                          {/* Enhanced QR Code Display */}
                          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-2xl border-4 border-white/20 backdrop-blur-sm">
                            <img 
                              src={giftCard.qrCodeUrl} 
                              alt="Gift Card QR Code"
                              className="w-40 h-40 mx-auto rounded-lg"
                              id="qr-code-image"
                            />
                          </div>
                          
                          {/* QR Code Label */}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-semibold shadow-lg">
                              SCAN TO REDEEM
                            </div>
                          </div>
                        </div>

                        {/* QR Code Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                          <motion.button
                            onClick={downloadQRCode}
                            className="group relative bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-2">
                              <Download className="w-4 h-4" />
                              <span>Download QR Code</span>
                            </div>
                            <div className="absolute inset-0 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                          </motion.button>

                          <motion.button
                            onClick={() => copyToClipboard(giftCard.qrCodeUrl, "QR Code URL")}
                            className="group relative bg-transparent border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-300 font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-2">
                              <Copy className="w-4 h-4" />
                              <span>Copy QR URL</span>
                            </div>
                          </motion.button>
                        </div>

                        <p className="text-gray-300 text-sm mt-4 max-w-sm mx-auto">
                          Present this QR code at checkout, scan with your mobile device, or download for offline use
                        </p>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Gift Card Details & Actions */}
              <div className="space-y-6">
                {/* Status & Balance */}
                <Card className="glass-premium border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Gift Card Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Current Balance</span>
                      <span className="text-2xl font-bold text-cyan-300">
                        ${(giftCard.balance / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Original Value</span>
                      <span className="text-white font-semibold">
                        ${(giftCard.amount / 100).toFixed(2)}
                      </span>
                    </div>
                    
                    <Separator className="bg-white/10" />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Status</span>
                      <Badge className={`${
                        giftCard.status === 'ACTIVE' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {giftCard.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Gift Details */}
                <Card className="glass-premium border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Gift Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {giftCard.recipientName && (
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Recipient</div>
                          <div className="text-white">{giftCard.recipientName}</div>
                        </div>
                      </div>
                    )}
                    
                    {giftCard.senderName && (
                      <div className="flex items-center gap-3">
                        <Gift className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">From</div>
                          <div className="text-white">{giftCard.senderName}</div>
                        </div>
                      </div>
                    )}
                    
                    {giftCard.createdAt && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-400">Created</div>
                          <div className="text-white">
                            {new Date(giftCard.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {giftCard.personalMessage && (
                      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-sm text-gray-400 mb-2">Personal Message</div>
                        <div className="text-white italic">"{giftCard.personalMessage}"</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card className="glass-premium border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {giftCard.qrCodeUrl && (
                      <Button
                        onClick={downloadQRCode}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold border-0 shadow-lg"
                      >
                        <Download className="w-4 h-4 mr-2 text-white" />
                        <span className="text-white">Download QR Code</span>
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => copyToClipboard(gan, "Gift Card Number")}
                      variant="outline"
                      className="w-full border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent font-semibold"
                    >
                      <Copy className="w-4 h-4 mr-2 text-white" />
                      <span className="text-white">{copied ? "Copied!" : "Copy Gift Card Number"}</span>
                    </Button>
                    
                    <Button
                      onClick={() => copyToClipboard(window.location.href, "Share Link")}
                      variant="outline"
                      className="w-full border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 bg-transparent font-semibold"
                    >
                      <ExternalLink className="w-4 h-4 mr-2 text-white" />
                      <span className="text-white">Share Gift Card</span>
                    </Button>

                    <Separator className="bg-white/10" />
                    
                    <Button
                      onClick={() => window.location.href = '/store'}
                      variant="ghost"
                      className="w-full text-cyan-300 hover:text-white hover:bg-cyan-500/10 bg-transparent font-semibold border border-cyan-400/20 hover:border-cyan-300/40"
                    >
                      <Gift className="w-4 h-4 mr-2 text-cyan-300" />
                      <span className="text-cyan-300 group-hover:text-white">Get Another Gift Card</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            {/* Instructions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <Card className="glass-premium border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    How to Use Your Gift Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <QrCode className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">1. Show QR Code</h4>
                    <p className="text-gray-300 text-sm">
                      Present the QR code at checkout or scan it with your mobile device
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">2. Enter Number</h4>
                    <p className="text-gray-300 text-sm">
                      Alternatively, provide the gift card number manually at checkout
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-2">3. Enjoy</h4>
                    <p className="text-gray-300 text-sm">
                      Your balance will be applied to your purchase automatically
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}