"use client";

import { useEffect, useState } from "react";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { AddUserForm } from "@/components/AddUserForm";
import { UserComparison } from "@/components/UserComparison";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrophyIcon, PlusIcon, LineChartIcon, Loader2 } from "lucide-react";

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const topSolver = leaderboardData.length > 0 
    ? [...leaderboardData].sort((a, b) => b.total - a.total)[0] 
    : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              DSA Leaderboard
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              Track LeetCode progress with friends. Updated daily.
            </p>
          </div>
          {topSolver && (
            <div className="flex items-center gap-4">
              <Card className="bg-white dark:bg-zinc-900 border shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                    <TrophyIcon className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Top Solver</div>
                    <div className="text-lg font-bold truncate max-w-[150px]">
                      {topSolver.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </header>

        <Tabs defaultValue="leaderboard" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4" /> Leaderboard
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4" /> Comparison
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <PlusIcon className="w-4 h-4" /> Add Friend
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="leaderboard" className="mt-0">
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                <p className="text-zinc-500 text-sm">Loading leaderboard...</p>
              </div>
            ) : leaderboardData.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="h-64 flex flex-col items-center justify-center text-center p-6">
                  <TrophyIcon className="h-12 w-12 text-zinc-300 mb-4" />
                  <h3 className="text-lg font-semibold">No friends added yet</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto mt-2">
                    Start by adding your friends' LeetCode usernames to see the leaderboard.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <LeaderboardTable data={leaderboardData} />
            )}
          </TabsContent>

          <TabsContent value="comparison" className="mt-0">
            {leaderboardData.length > 0 ? (
              <UserComparison users={leaderboardData.map(u => ({ id: u.id, name: u.name }))} />
            ) : (
              <div className="h-64 flex items-center justify-center text-zinc-500">
                Add friends to see comparison charts.
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-0">
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Add a Friend</CardTitle>
                  <CardDescription>
                    Enter their name and LeetCode username to track their daily progress.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AddUserForm onSuccess={() => {
                    fetchLeaderboard();
                  }} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
