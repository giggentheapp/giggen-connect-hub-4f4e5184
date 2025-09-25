import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppTranslation } from '@/hooks/useAppTranslation';

interface SafariErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface SafariErrorBoundaryProps {
  children: React.ReactNode;
}

export class SafariErrorBoundary extends React.Component<
  SafariErrorBoundaryProps,
  SafariErrorBoundaryState
> {
  constructor(props: SafariErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): SafariErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Safari Error Boundary caught an error:', error, errorInfo);
    
    // Log Safari-specific error details
    this.setState({
      error,
      errorInfo
    });

    // Detect if this is Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      console.warn('Error occurred in Safari - this might be a browser compatibility issue');
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafariErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReload={this.handleReload}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Separate component for translated error UI
const SafariErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReload: () => void;
  onReset: () => void;
}> = ({ error, errorInfo, onReload, onReset }) => {
  const { t } = useAppTranslation();
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {t('bookingSomethingWentWrong')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {t('errorLoadingBookings')}
          </p>
          
          {/* Safari-specific message */}
          {/Safari/.test(navigator.userAgent) && (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Safari:</strong> {t('safariUserMessage')}
              </p>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button onClick={onReload} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {t('reloadPage')}
            </Button>
            <Button variant="outline" onClick={onReset}>
              {t('tryAgain2')}
            </Button>
          </div>
          
          {/* Error details for debugging (only show in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 text-xs">
              <summary className="cursor-pointer text-muted-foreground">
                {t('technicalInfo')}
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}