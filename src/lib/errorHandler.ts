import { logger } from "@/utils/logger";
import { toast } from "@/hooks/use-toast";

/**
 * Centralized error handler for the application
 */

/**
 * Handle error and return user-friendly message
 */
export function handleError(error: unknown, context?: string): string {
  const isDevelopment = import.meta.env.DEV;
  
  let message = "En feil oppstod";
  
  if (error instanceof Error) {
    message = error.message;
    logger.error(`Error in ${context || "application"}`, {
      message: error.message,
      stack: error.stack,
      context,
    });
  } else if (typeof error === "string") {
    message = error;
    logger.error(`Error in ${context || "application"}`, { error });
  } else {
    logger.error(`Unknown error in ${context || "application"}`, { error });
  }
  
  // In production, return generic message for security
  // In development, return detailed message for debugging
  if (isDevelopment) {
    return message;
  } else {
    return "En feil oppstod. Vennligst prøv igjen senere.";
  }
}

/**
 * Show error toast notification
 */
export function showErrorToast(error: unknown, title: string = "Feil", context?: string) {
  const message = handleError(error, context);
  
  toast({
    title,
    description: message,
    variant: "destructive",
  });
}

/**
 * Show success toast notification
 */
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
  });
}
