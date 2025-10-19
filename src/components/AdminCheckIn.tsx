import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import jsQR from "jsqr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, CheckCircle, XCircle, Ticket, Shield } from "lucide-react";
import { useCheckInTicket } from "@/hooks/useTickets";
import { useIsAdmin, useIsOrganizer } from "@/hooks/useUserRole";

export function AdminCheckIn() {
  const isAdmin = useIsAdmin();
  const isOrganizer = useIsOrganizer();
  const hasAccess = isAdmin || isOrganizer;

  const [manualCode, setManualCode] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    message: string;
    ticket?: any;
  } | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const scanIntervalRef = useRef<number>();
  
  const { mutate: checkInTicket, isPending } = useCheckInTicket();

  // Show access denied if user doesn't have proper role
  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-semibold">Ingen tilgang</p>
              <p>
                Du har ikke tilgang til innsjekk-funksjonen. Kun administratorer og arrangører kan sjekke inn billetter.
              </p>
              <Button
                onClick={() => window.location.href = '/admin-setup'}
                variant="outline"
                size="sm"
              >
                <Shield className="mr-2 h-4 w-4" />
                Gå til Admin Setup
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleCheckIn = useCallback((ticketCode: string) => {
    if (!ticketCode) return;
    
    checkInTicket(ticketCode, {
      onSuccess: (data) => {
        setLastScanResult(data);
        setManualCode("");
        
        // Clear result after 5 seconds
        setTimeout(() => {
          setLastScanResult(null);
        }, 5000);
      },
      onError: (error: any) => {
        setLastScanResult({
          success: false,
          message: error.message || "Innsjekk feilet",
        });
        
        setTimeout(() => {
          setLastScanResult(null);
        }, 5000);
      },
    });
  }, [checkInTicket]);

  const scanQRCode = useCallback(() => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleCheckIn(code.data);
        stopScanning();
      }
    };
  }, [handleCheckIn]);

  const startScanning = useCallback(() => {
    setCameraEnabled(true);
    setLastScanResult(null);
    
    // Scan every 500ms
    scanIntervalRef.current = window.setInterval(() => {
      scanQRCode();
    }, 500);
  }, [scanQRCode]);

  const stopScanning = useCallback(() => {
    setCameraEnabled(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  }, []);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold mb-2">Innsjekk</h2>
        <p className="text-muted-foreground">
          Skann QR-koder eller skriv inn billettkode manuelt
        </p>
      </div>

      {lastScanResult && (
        <Alert variant={lastScanResult.success ? "default" : "destructive"}>
          <div className="flex items-start gap-3">
            {lastScanResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <div className="flex-1">
              <AlertDescription className="font-medium">
                {lastScanResult.message}
              </AlertDescription>
              {lastScanResult.ticket && (
                <div className="mt-2 text-sm space-y-1">
                  <p><strong>Arrangement:</strong> {lastScanResult.ticket.events?.name}</p>
                  <p><strong>Gjest:</strong> {lastScanResult.ticket.profiles?.display_name}</p>
                </div>
              )}
            </div>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>QR-Scanning</CardTitle>
          <CardDescription>
            Skann billett med kamera
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {cameraEnabled ? (
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="rounded-lg border"
                  videoConstraints={{
                    facingMode: "environment",
                  }}
                />
                <div className="absolute inset-0 border-4 border-primary rounded-lg pointer-events-none" />
              </div>
            ) : (
              <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          <Button
            onClick={cameraEnabled ? stopScanning : startScanning}
            variant={cameraEnabled ? "destructive" : "default"}
            className="w-full"
            disabled={isPending}
          >
            {cameraEnabled ? (
              <>
                <CameraOff className="mr-2 h-4 w-4" />
                Stopp scanning
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Start scanning
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manuell innsjekk</CardTitle>
          <CardDescription>
            Skriv inn billettkode manuelt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Skriv inn billettkode..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualCode) {
                  handleCheckIn(manualCode);
                }
              }}
              disabled={isPending}
            />
            <Button
              onClick={() => handleCheckIn(manualCode)}
              disabled={!manualCode || isPending}
            >
              <Ticket className="mr-2 h-4 w-4" />
              Sjekk inn
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Trykk Enter eller klikk Sjekk inn for å validere billetten
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
