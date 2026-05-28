import type { Venue } from "@/lib/supabase";

export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideVenueRadius(
  userLat: number,
  userLng: number,
  venue: Pick<Venue, "lat" | "lng" | "radius_meters">
): boolean {
  return haversineDistance(userLat, userLng, venue.lat, venue.lng) <= venue.radius_meters;
}

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function isVenueOpen(venue: Pick<Venue, "open_days" | "open_time" | "close_time">): boolean {
  if (!venue.open_days || !venue.open_time || !venue.close_time) return true;
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  if (!venue.open_days.includes(todayName)) return false;

  const [openH, openM] = venue.open_time.split(":").map(Number);
  const [closeH, closeM] = venue.close_time.split(":").map(Number);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;

  // Handles venues that close after midnight
  if (closeMinutes < openMinutes) closeMinutes += 24 * 60;
  const adjusted = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;
  return adjusted >= openMinutes && adjusted <= closeMinutes;
}

export function getVenueCloseDateTime(venue: Pick<Venue, "close_time">): Date | null {
  if (!venue.close_time) return null;
  const [h, m] = venue.close_time.split(":").map(Number);
  const closeDate = new Date();
  closeDate.setHours(h, m, 0, 0);
  // If close time is past midnight relative to now, add a day
  if (closeDate < new Date()) closeDate.setDate(closeDate.getDate() + 1);
  return closeDate;
}
