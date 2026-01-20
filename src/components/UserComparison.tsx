"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface UserComparisonProps {
  users: { id: string; name: string }[];
}

export function UserComparison({ users }: UserComparisonProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllHistories = async () => {
      const allStats: Record<string, any[]> = {};
      const datesSet = new Set<string>();

      for (const user of users) {
        try {
          const res = await fetch(`/api/users/${user.id}/history`);
          const data = await res.json();
          allStats[user.name] = data;
          data.forEach((d: any) => datesSet.add(d.date));
        } catch (error) {
          console.error(`Error fetching history for ${user.name}:`, error);
        }
      }

      const sortedDates = Array.from(datesSet).sort();
      const formattedData = sortedDates.map((date) => {
        const entry: any = { date };
        users.forEach((user) => {
          const userStat = allStats[user.name]?.find((s) => s.date === date);
          entry[user.name] = userStat ? userStat.total : null;
        });
        return entry;
      });

      setChartData(formattedData);
    };

    if (users.length > 0) {
      fetchAllHistories();
    }
  }, [users]);

  if (users.length === 0) return null;

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe", "#00c49f"];

  return (
    <Card className="w-full bg-white dark:bg-zinc-950">
      <CardHeader>
        <CardTitle>Total Solved Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(str) => str.split('-').slice(1).join('/')}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}
            />
            <Legend verticalAlign="top" height={36}/>
            {users.map((user, index) => (
              <Line
                key={user.id}
                type="monotone"
                dataKey={user.name}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
