"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpIcon, MinusIcon } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  leetcodeUsername: string;
  easy: number;
  medium: number;
  hard: number;
  total: number;
  ranking: number;
  weightedScore: number;
  dailyIncrease: number;
  date: string;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  const [sortKey, setSortKey] = useState<keyof LeaderboardEntry>("total");

  const sortedData = [...data].sort((a, b) => {
    if (typeof a[sortKey] === "number" && typeof b[sortKey] === "number") {
      return (b[sortKey] as number) - (a[sortKey] as number);
    }
    return 0;
  });

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-950">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>User</TableHead>
            <TableHead 
              className="cursor-pointer hover:text-black dark:hover:text-white"
              onClick={() => setSortKey("total")}
            >
              Total {sortKey === "total" && "↓"}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-black dark:hover:text-white"
              onClick={() => setSortKey("weightedScore")}
            >
              Score {sortKey === "weightedScore" && "↓"}
            </TableHead>
            <TableHead 
              className="cursor-pointer hover:text-black dark:hover:text-white text-right"
              onClick={() => setSortKey("dailyIncrease")}
            >
              Daily {sortKey === "dailyIncrease" && "↓"}
            </TableHead>
            <TableHead className="text-right">E/M/H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((entry, index) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold">{entry.name}</span>
                  <span className="text-xs text-zinc-500">@{entry.leetcodeUsername}</span>
                </div>
              </TableCell>
              <TableCell className="font-semibold">{entry.total}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800">
                  {entry.weightedScore}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {entry.dailyIncrease > 0 ? (
                  <div className="flex items-center justify-end text-green-600 font-bold">
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                    {entry.dailyIncrease}
                  </div>
                ) : (
                  <div className="flex items-center justify-end text-zinc-400">
                    <MinusIcon className="w-4 h-4 mr-1" />
                    0
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right text-xs">
                <span className="text-green-500">{entry.easy}</span> / 
                <span className="text-yellow-500 mx-1">{entry.medium}</span> / 
                <span className="text-red-500">{entry.hard}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
