"use client";
import { useFCMToken } from "@/hooks/useFCMToken";

export function FCMProvider({ userId }: { userId: string }) {
  useFCMToken(userId);
  return null;
}
