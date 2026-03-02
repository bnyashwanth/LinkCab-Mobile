"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, TrendingDown, Users, Calendar, BarChart, BarChart3, Filter, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FunnelStage {
  stage: 'signup' | 'kyc_completion' | 'first_announcement' | 'first_request' | 'match_completed';
  stage_name: string;
  users_at_stage: number;
  conversion_rate: number;
  drop_off_reason?: string;
}

interface DropoffMetrics {
  total_users: number;
  kyc_pending_users: number;
  signup_to_kyc: number;
  kyc_to_first_announcement: number;
  announcement_to_request: number;
  request_to_match: number;
  match_completion_rate: number;
  avg_days_to_match: number;
}

export default function DropoffAnalytics() {
  const [metrics, setMetrics] = useState<DropoffMetrics>({
    total_users: 0,
    kyc_pending_users: 0,
    signup_to_kyc: 0,
    kyc_to_first_announcement: 0,
    announcement_to_request: 0,
    request_to_match: 0,
    match_completion_rate: 0,
    avg_days_to_match: 0
  });
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Calculate funnel stages
        const totalUsers = 0;
        const stages: FunnelStage[] = [
          { stage: 'signup', stage_name: 'Sign Up', users_at_stage: totalUsers, conversion_rate: 0 },
          { stage: 'kyc_completion', stage_name: 'KYC Completion', users_at_stage: 0, conversion_rate: 0 },
          { stage: 'first_announcement', stage_name: 'First Announcement', users_at_stage: 0, conversion_rate: 0 },
          { stage: 'first_request', stage_name: 'First Request', users_at_stage: 0, conversion_rate: 0 },
          { stage: 'match_completed', stage_name: 'Match Completed', users_at_stage: 0, conversion_rate: 0 }
        ];

        // Calculate conversion rates
        const stagesWithRates = stages.map((stage, index) => {
          if (index === 0) return { ...stage, conversion_rate: 100 };
          return { ...stage, conversion_rate: 0 };
        });

        setFunnelStages(stagesWithRates);

        setMetrics({
          total_users: totalUsers,
          kyc_pending_users: 0, // TODO: Calculate from database
          signup_to_kyc: 0, // TODO: Calculate from database
          kyc_to_first_announcement: 0, // TODO: Calculate from database
          announcement_to_request: 0, // TODO: Calculate from database
          request_to_match: 0, // TODO: Calculate from database
          match_completion_rate: 0, // TODO: Calculate from database
          avg_days_to_match: 0 // TODO: Calculate from database
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getConversionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Drop-off Analytics & Funnel Tracking</h1>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Filter className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.total_users.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              KYC Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.kyc_pending_users.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Users stuck at KYC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="h-5 w-5 mr-2" />
              Match Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.match_completion_rate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Users completing matches</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Analysis */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Conversion Funnel Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelStages.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-700">{stage.stage_name}</div>
                    <div className="text-xs text-gray-500">{stage.users_at_stage} users</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getConversionRateColor(stage.conversion_rate)}`}>
                      {stage.conversion_rate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Conversion rate</div>
                  </div>
                </div>
                {index < funnelStages.length - 1 && (
                  <div className="w-8 h-8 flex items-center justify-center mx-auto my-1">
                    <TrendingDown className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>Key Drop-off Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Sign Up → KYC</span>
                <span className="font-medium">{metrics.signup_to_kyc.toLocaleString()} users</span>
              </div>
              <div className="text-right text-green-600">
                {metrics.signup_to_kyc > 0 ? (
                  <span className="text-xs">({((metrics.signup_to_kyc / metrics.total_users) * 100).toFixed(1)}%)</span>
                ) : (
                  <span className="text-xs">No data</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">KYC → First Announcement</span>
                <span className="font-medium">{metrics.kyc_to_first_announcement.toLocaleString()} users</span>
              </div>
              <div className="text-right text-green-600">
                {metrics.kyc_to_first_announcement > 0 ? (
                  <span className="text-xs">({((metrics.kyc_to_first_announcement / metrics.total_users) * 100).toFixed(1)}%)</span>
                ) : (
                  <span className="text-xs">No data</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">First Request → Match</span>
                <span className="font-medium">{metrics.request_to_match.toLocaleString()} users</span>
              </div>
              <div className="text-right text-green-600">
                {metrics.request_to_match > 0 ? (
                  <span className="text-xs">({((metrics.request_to_match / metrics.total_users) * 100).toFixed(1)}%)</span>
                ) : (
                  <span className="text-xs">No data</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Days to Match</span>
                <span className="font-medium">{metrics.avg_days_to_match.toFixed(1)} days</span>
              </div>
              <div className="text-right text-blue-600">
                {metrics.avg_days_to_match > 0 ? (
                  <span className="text-xs">Target: ≤3 days</span>
                ) : (
                  <span className="text-xs">No data</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              <strong>Insights:</strong> Users who complete KYC but never post announcements or send requests may need engagement campaigns. Consider targeted push notifications to re-engage them.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
