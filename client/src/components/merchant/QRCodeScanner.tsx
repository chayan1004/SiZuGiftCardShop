import { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Camera, CameraOff, ArrowLeft, DollarSign, CreditCard } from 'lucide-react';
import { useLocation } from 'wouter';

interface GiftCard {
  id: number;
  gan: string;
  balance: number;
  status: string;
  redeemed: boolean;
}

interface ValidationResult {
  success: boolean;
  card?: GiftCard;
  error?: string;
  message?: string;
}

interface RedemptionResult {
  success: boolean;
  redemptionAmount?: number;
  remainingBalance?: number;
  fullyRedeemed?: boolean;
  message?: string;
  error?: string;
}

export default function QRCodeScanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [validatedCard, setValidatedCard] = useState<GiftCard | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      
      // Initialize ZXing reader
      readerRef.current = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        setIsScanning(true);
        
        try {
          const result = await readerRef.current.decodeFromVideoDevice(
            undefined, // Use default camera
            videoRef.current,
            (result: Result | null, error: Error | undefined) => {
              if (result) {
                handleQRDetected(result.getText());
              }
            }
          );
        } catch (error) {
          console.error('Scanner initialization error:', error);
          toast({
            title: "Scanner Error",
            description: "Failed to initialize camera scanner",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setCameraPermission('denied');
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access to scan QR codes",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQRDetected = async (qrData: string) => {
    if (isValidating) return; // Prevent multiple simultaneous validations
    
    stopScanning();
    setIsValidating(true);

    try {
      const response = await apiRequest('POST', '/api/merchant/validate-qr', {
        qrData
      });

      const result: ValidationResult = await response.json();

      if (result.success && result.card) {
        setValidatedCard(result.card);
        toast({
          title: "Gift Card Found",
          description: `Valid gift card with $${(result.card.balance / 100).toFixed(2)} balance`,
        });
      } else {
        toast({
          title: "Invalid Gift Card",
          description: result.error || "Unable to validate gift card",
          variant: "destructive",
        });
        // Restart scanning after failed validation
        setTimeout(() => setIsValidating(false), 1000);
      }
    } catch (error) {
      console.error('QR validation error:', error);
      toast({
        title: "Validation Error",
        description: "Failed to validate gift card",
        variant: "destructive",
      });
      setTimeout(() => setIsValidating(false), 1000);
    } finally {
      if (validatedCard) {
        setIsValidating(false);
      }
    }
  };

  const handleRedeem = async () => {
    if (!validatedCard) return;

    const amount = customAmount ? Math.round(parseFloat(customAmount) * 100) : validatedCard.balance;
    
    if (amount <= 0 || amount > validatedCard.balance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid redemption amount",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);

    try {
      const response = await apiRequest('POST', '/api/merchant/redeem-qr', {
        qrData: validatedCard.gan,
        amount
      });

      const result: RedemptionResult = await response.json();

      if (result.success) {
        toast({
          title: "Redemption Successful",
          description: result.message || `Redeemed $${(amount / 100).toFixed(2)}`,
        });
        
        // Reset state and return to dashboard
        setValidatedCard(null);
        setCustomAmount('');
        setTimeout(() => {
          setLocation('/merchant-dashboard');
        }, 2000);
      } else {
        toast({
          title: "Redemption Failed",
          description: result.error || "Unable to redeem gift card",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: "Redemption Error",
        description: "Failed to process redemption",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const resetScanner = () => {
    setValidatedCard(null);
    setCustomAmount('');
    setIsValidating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/merchant-dashboard')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-xl font-bold text-white">QR Code Scanner</h1>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      <div className="p-4 space-y-6">
        {/* Scanner Section */}
        {!validatedCard && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Scan Gift Card QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cameraPermission === 'denied' && (
                <div className="text-center py-8 text-white/80">
                  <CameraOff className="w-12 h-12 mx-auto mb-4 text-red-400" />
                  <p className="mb-4">Camera access is required to scan QR codes</p>
                  <Button onClick={startScanning} className="bg-blue-600 hover:bg-blue-700">
                    Request Camera Access
                  </Button>
                </div>
              )}

              {cameraPermission === 'prompt' && (
                <div className="text-center py-8 text-white/80">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                  <p className="mb-4">Ready to scan gift card QR codes</p>
                  <Button onClick={startScanning} className="bg-blue-600 hover:bg-blue-700">
                    Start Scanning
                  </Button>
                </div>
              )}

              {cameraPermission === 'granted' && !isScanning && !isValidating && (
                <div className="text-center py-8 text-white/80">
                  <Camera className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <p className="mb-4">Camera ready</p>
                  <Button onClick={startScanning} className="bg-green-600 hover:bg-green-700">
                    Start Scanning
                  </Button>
                </div>
              )}

              {isScanning && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-white/50 m-8 rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p>Scanning for QR codes...</p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={stopScanning}
                    variant="destructive"
                    className="w-full"
                  >
                    <CameraOff className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </Button>
                </div>
              )}

              {isValidating && (
                <div className="text-center py-8 text-white/80">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p>Validating gift card...</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Redemption Section */}
        {validatedCard && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Gift Card Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-white">
                <div>
                  <Label className="text-white/80">Gift Card ID</Label>
                  <p className="font-mono text-sm bg-white/10 p-2 rounded truncate">
                    {validatedCard.gan}
                  </p>
                </div>
                <div>
                  <Label className="text-white/80">Current Balance</Label>
                  <p className="text-2xl font-bold text-green-400">
                    ${(validatedCard.balance / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Redemption Amount (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={validatedCard.balance / 100}
                    placeholder={`Max: $${(validatedCard.balance / 100).toFixed(2)}`}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  />
                </div>
                <p className="text-sm text-white/60">
                  Leave empty to redeem full balance
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleRedeem}
                  disabled={isRedeeming}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isRedeeming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Redeem Gift Card
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetScanner}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Scan Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-2">How to Use:</h3>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Point camera at the QR code on the gift card receipt</li>
              <li>• Wait for automatic detection and validation</li>
              <li>• Enter partial amount or redeem full balance</li>
              <li>• Confirm redemption to complete transaction</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}