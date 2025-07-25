export interface TrafficStat {
  id: number;
  name: string;
  origin: string | null;
  conversion_ratio: number;
  successful_leads: number;
  total_ftds: number;
  total_leads: number;
  late_total_ftds: number;
  revenue: number;
}

export interface CreateTrafficStatRequest {
  name: string;
  origin?: string | null;
  successful_leads: number;
  total_ftds: number;
  total_leads: number;
  late_total_ftds: number;
  revenue: number;
}
