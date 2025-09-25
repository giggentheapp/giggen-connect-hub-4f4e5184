import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BookingsErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface BookingsErrorBoundaryProps {
  children: React.ReactNode;
}

export class BookingsErrorBoundary extends React.Component<
  BookingsErrorBoundaryProps,
  BookingsErrorBoundaryState
> {
  constructor(props: BookingsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): BookingsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('BookingsErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bookings-error-boundary p-8 text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-destructive">Bookings Unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-muted-foreground">
                Something went wrong loading the bookings section.
              </p>
              {this.state.error && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => this.setState({ hasError: false, error: null })}
                  variant="default"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}