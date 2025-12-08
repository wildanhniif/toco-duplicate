import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Ticket, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default function VoucherStats() {
  const [stats, setStats] = useState({
    total_vouchers: 0,
    upcoming_count: 0,
    active_count: 0,
    ended_count: 0,
    total_usage: 0,
    total_estimated_cost: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(
          "http://localhost:5000/api/vouchers/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setStats(data.data || stats);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      icon: Ticket,
      label: "Total Voucher",
      value: stats.total_vouchers,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Clock,
      label: "Mendatang",
      value: stats.upcoming_count,
      color: "bg-purple-100 text-purple-600",
    },
    {
      icon: TrendingUp,
      label: "Berlangsung",
      value: stats.active_count,
      color: "bg-green-100 text-green-600",
    },
    {
      icon: CheckCircle,
      label: "Berakhir",
      value: stats.ended_count,
      color: "bg-gray-100 text-gray-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
