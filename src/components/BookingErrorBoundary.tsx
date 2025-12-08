import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface BookingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface BookingErrorBoundaryProps {
  children: React.ReactNode;
}

// Wrapper component to use navigate hook for refresh
const RefreshButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <Button 
      variant="outline"
      onClick={() => navigate(location.pathname + location.search, { replace: true })}
      className="flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Last siden på nytt
    </Button>
  );
};

export class BookingErrorBoundary extends React.Component<
  BookingErrorBoundaryProps,
  BookingErrorBoundaryState
> {
  constructor(props: BookingErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): BookingErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Booking Error Boundary caught an error:', error, errorInfo);
    
    // Detect if it's Safari/mobile and log specifically
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isSafari || isMobile) {
      console.error('Safari/Mobile specific error in booking system:', {
        userAgent: navigator.userAgent,
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
    
    this.setState({
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Booking system midlertidig utilgjengelig
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Det oppstod en feil i booking-systemet. Dette kan skyldes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Nettverksproblemer</li>
                <li>Midlertidig serverfeil</li>
                <li>Kompatibilitetsproblemer med nettleseren</li>
              </ul>
            </div>
            
            <div className="bg-muted/50 p-3 rounded text-xs text-muted-foreground">
              <p><strong>Feilmelding:</strong> {this.state.error?.message || 'Ukjent feil'}</p>
              {/safari/i.test(navigator.userAgent) && (
                <p className="mt-1"><strong>Safari-bruker:</strong> Prøv å bruke Chrome eller Edge for best opplevelse</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Prøv igjen
              </Button>
              
              <RefreshButton />
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}