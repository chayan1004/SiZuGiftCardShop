import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Camera, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function MerchantQRScanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    // Initialize the code reader
    codeReaderRef.current = new BrowserMultiFormatReader();

    // Check camera permissions
    checkCameraPermission();

    return () => {
      // Cleanup on unmount
      stopScanning();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Camera permission denied:', error);
      setHasPermission(false);
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access to scan QR codes.",
        variant: "destructive",
      });
    }
  };

  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    setIsScanning(true);
    try {
      // Start decoding from the video element
      await codeReaderRef.current.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current,
        (result, error) => {
          if (result) {
            // Successfully scanned a QR code
            const code = result.getText();
            setScannedCode(code);
            redeemGiftCard(code);
            stopScanning();
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('QR scanning error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start scanning:', error);
      setIsScanning(false);
      toast({
        title: "Scanner Error",
        description: "Failed to start QR scanner. Please try again.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      try {
        // Stop all video streams
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        // Clear video source
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      } catch (error) {
        console.error('Error stopping video stream:', error);
      }
    }
    setIsScanning(false);
  };

  const redeemGiftCard = async (code: string) => {
    setIsRedeeming(true);
    try {
      const response = await apiRequest("POST", "/api/gift-cards/redeem", {
        code: code,
        redeemedBy: "merchant-pos"
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Gift Card Redeemed!",
          description: `Successfully redeemed $${(result.amount / 100).toFixed(2)} gift card.`,
        });
        
        // Auto-navigate back after 3 seconds
        setTimeout(() => {
          setLocation('/merchant-dashboard');
        }, 3000);
      } else {
        const error = await response.json();
        toast({
          title: "Redemption Failed",
          description: error.error || "Failed to redeem gift card.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const resetScanner = () => {
    setScannedCode(null);
    if (hasPermission) {
      startScanning();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-black/20 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/merchant-dashboard')}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-bold text-white">QR Scanner</h1>
        <div className="w-16" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-6">
        {/* Camera View */}
        <Card className="w-full max-w-md bg-black/40 backdrop-blur-sm border-white/10">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              Scan Gift Card QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasPermission === null && (
              <div className="text-center text-white">
                <p>Checking camera permissions...</p>
              </div>
            )}

            {hasPermission === false && (
              <div className="text-center text-white space-y-4">
                <p>Camera access is required to scan QR codes.</p>
                <Button onClick={checkCameraPermission} className="w-full">
                  Grant Camera Access
                </Button>
              </div>
            )}

            {hasPermission === true && (
              <div className="space-y-4">
                {/* Video Element */}
                <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                        
                        {/* Scanning line animation */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-white/70 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Control Buttons */}
                <div className="space-y-2">
                  {!isScanning && !scannedCode && (
                    <Button
                      onClick={startScanning}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isRedeeming}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Start Scanner
                    </Button>
                  )}

                  {isScanning && (
                    <Button
                      onClick={stopScanning}
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      Stop Scanner
                    </Button>
                  )}

                  {scannedCode && (
                    <div className="space-y-2">
                      <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-200">Scanned Code:</p>
                        <p className="font-mono text-white text-sm break-all">{scannedCode}</p>
                      </div>
                      
                      {isRedeeming ? (
                        <Button disabled className="w-full">
                          <Zap className="w-4 h-4 mr-2 animate-spin" />
                          Redeeming...
                        </Button>
                      ) : (
                        <Button
                          onClick={resetScanner}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Scan Another Code
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="w-full max-w-md bg-black/20 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <div className="text-center text-white space-y-2">
              <h3 className="font-semibold">How to Use</h3>
              <div className="text-sm text-white/80 space-y-1">
                <p>1. Tap "Start Scanner" to activate camera</p>
                <p>2. Point camera at QR code on receipt</p>
                <p>3. Gift card will be automatically redeemed</p>
                <p>4. Analytics will update in real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}