"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Github, Linkedin, Flame } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    rank: number;
    isCurrentUser: boolean;
}

export default function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
            }}
            className={`px-4 md:px-6 py-3.5 flex items-center gap-4 md:gap-6 transition-all duration-200 hover:bg-[#F8F9FA] dark:hover:bg-muted/30 relative border-b border-[#E8EAED]/60 dark:border-border last:border-0 ${isCurrentUser ? 'bg-[#D2E3FC]/20 dark:bg-[#4285F4]/5' : ''
                }`}
        >
            {/* Rank */}
            <div className="w-8 flex items-center justify-center shrink-0">
                {rank === 1 ? (
                    <Trophy className="w-5 h-5 text-[#FBBC04]" />
                ) : rank === 2 ? (
                    <Medal className="w-5 h-5 text-[#9AA0A6]" />
                ) : rank === 3 ? (
                    <Medal className="w-5 h-5 text-[#E37400]" />
                ) : (
                    <span className="text-sm font-medium text-[#5F6368] dark:text-muted-foreground tabular-nums">{rank}</span>
                )}
            </div>

            {/* Avatar & User Info */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                        <div className="relative shrink-0 cursor-pointer group/avatar">
                            <div className={`w-10 h-10 rounded-full overflow-hidden bg-[#F1F3F4] dark:bg-muted shrink-0 transition-all duration-200 group-hover/avatar:scale-105 ${isCurrentUser ? 'ring-2 ring-[#4285F4]/30' : ''
                                }`}>
                                {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#5F6368] dark:text-muted-foreground text-sm font-medium">
                                        {entry.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardTrigger>

                    <HoverCardContent className="w-80 p-0 overflow-hidden rounded-2xl border-border z-100" align="start">
                        <div className="p-6 relative bg-card">
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border-2 border-border shrink-0">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-black">{entry.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-black text-foreground text-xl pr-4">{entry.name.split(' ')[0]}</div>
                                    <div className="text-primary font-bold text-sm">@{entry.leetcodeUsername}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                <div className="bg-[#F1F3F4] dark:bg-muted rounded-2xl p-4 border border-[#E8EAED] dark:border-border">
                                    <div className="text-[10px] text-[#5F6368] dark:text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Global Rank</div>
                                    <div className="text-xl font-black text-[#202124] dark:text-foreground">#{entry.ranking?.toLocaleString() || '—'}</div>
                                </div>
                                <div className="bg-[#D2E3FC] dark:bg-primary/10 rounded-2xl p-4 border border-[#4285F4]/20">
                                    <div className="text-[10px] text-[#174EA6] dark:text-primary font-black uppercase tracking-[0.2em] mb-1">Daily Pts</div>
                                    <div className="text-xl font-black text-[#174EA6] dark:text-primary">+{entry.todayPoints}</div>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Problem Density</span>
                                    <span className="text-[10px] font-black text-foreground bg-muted px-3 py-1 rounded-full uppercase tracking-wider">{entry.totalProblems} Solved</span>
                                </div>
                                <div className="space-y-3.5 px-1">
                                    {[
                                        { label: 'Easy', count: entry.easy, color: 'bg-[#34A853]', width: (entry.easy || 0) / (entry.totalProblems || 1) * 100 },
                                        { label: 'Medium', count: entry.medium, color: 'bg-[#FBBC04]', width: (entry.medium || 0) / (entry.totalProblems || 1) * 100 },
                                        { label: 'Hard', count: entry.hard, color: 'bg-[#EA4335]', width: (entry.hard || 0) / (entry.totalProblems || 1) * 100 }
                                    ].map(stat => (
                                        <div key={stat.label} className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                                                <span>{stat.label}</span>
                                                <span>{stat.count || 0}</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div className={`h-full ${stat.color} rounded-full`} style={{ width: `${stat.width}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-2">
                                    {entry.github && entry.github !== 'not-provided' && entry.github !== 'pending' && (
                                        <a href={entry.github} target="_blank" rel="noopener noreferrer" className="text-[#9AA0A6] hover:text-[#202124] dark:hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                                            <Github className="w-4 h-4" />
                                        </a>
                                    )}
                                    {entry.linkedin && entry.linkedin !== 'not-provided' && entry.linkedin !== 'pending' && (
                                        <a href={entry.linkedin} target="_blank" rel="noopener noreferrer" className="text-[#9AA0A6] hover:text-[#0077b5] transition-colors p-1.5 rounded-lg hover:bg-muted">
                                            <Linkedin className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                                {entry.streak && entry.streak > 0 && (
                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20">
                                        <Flame className="w-3.5 h-3.5" />
                                        {entry.streak}D STREAK
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardContent>
                </HoverCard>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#202124] dark:text-foreground truncate">
                            {entry.name.split(' ')[0]}
                        </span>
                        {isCurrentUser && (
                            <span className="text-[9px] font-medium text-[#4285F4] dark:text-[#8AB4F8] bg-[#D2E3FC]/50 dark:bg-[#4285F4]/10 px-1.5 py-px rounded">you</span>
                        )}
                    </div>
                    <span className="text-xs text-[#9AA0A6] dark:text-muted-foreground">@{entry.leetcodeUsername}</span>
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 items-center shrink-0">
                <div className="hidden lg:block w-12 text-center">
                    {entry.streak && entry.streak > 0 ? (
                        <span className="text-sm font-medium text-[#E37400] dark:text-orange-400">🔥 {entry.streak}</span>
                    ) : (
                        <span className="text-sm text-[#9AA0A6]">—</span>
                    )}
                </div>

                <div className="w-14 md:w-16 text-right">
                    <span className="text-sm font-medium text-[#202124] dark:text-foreground tabular-nums">
                        {entry.totalScore.toLocaleString()}
                    </span>
                </div>

                <div className="w-14 md:w-16 text-right">
                    <span className="text-sm font-medium text-[#202124] dark:text-foreground tabular-nums">
                        {entry.gfgScore?.toLocaleString() || '—'}
                    </span>
                </div>

                <div className="w-14 md:w-16 text-right">
                    <span className={`text-sm font-medium tabular-nums ${entry.todayPoints > 0 ? 'text-[#34A853]' : 'text-[#9AA0A6]'
                        }`}>
                        +{entry.todayPoints}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
