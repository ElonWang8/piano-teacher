"use client";

import { toast as sonner } from "sonner";

export function useToast() {
  return {
    success: (message: string) => sonner.success(message),
    error: (message: string) => sonner.error(message),
    info: (message: string) => sonner.info(message),
  };
}
