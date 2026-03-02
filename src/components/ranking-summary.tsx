"use client";

import React from "react";
import { PlayerScore } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Trophy, Medal, Star, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingSummaryProps {
  scores: PlayerScore[];
}

export function RankingSummary({ scores }: RankingSummaryProps) {
  const sortedScores = [...scores].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.exactScores - a.exactScores;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {sortedScores.map((score, index) => (
        <Card 
          key={score.name} 
          className={cn(
            "relative overflow-hidden transition-all duration-500 rounded-3xl group border-none",
            score.isWinner 
              ? "bg-gradient-to-br from-primary via-primary/90 to-blue-800 scale-105 z-10 shadow-2xl shadow-primary/30" 
              : "glass-card hover:translate-y-[-5px]"
          )}
        >
          {score.isWinner && (
            <div className="absolute top-0 right-0 p-4 opacity-20">
               <Crown className="h-20 w-20 text-white animate-pulse" />
            </div>
          )}
          
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3 relative z-10">
            <div className={cn(
               "h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110",
               score.isWinner ? "bg-white/20" : "bg-muted/50"
            )}>
              {index === 0 ? <Trophy className={cn("h-8 w-8", score.isWinner ? "text-accent" : "text-accent")} /> : 
               index === 1 ? <Medal className="h-8 w-8 text-slate-400" /> :
               index === 2 ? <Medal className="h-8 w-8 text-amber-700" /> :
               <Star className="h-8 w-8 text-muted-foreground" />}
            </div>

            <div>
              <h3 className={cn(
                "font-black italic uppercase text-lg leading-none mb-1",
                score.isWinner ? "text-white" : "text-foreground"
              )}>{score.name}</h3>
              <div className="flex flex-col">
                <span className={cn(
                   "text-3xl font-black",
                   score.isWinner ? "text-white" : "text-primary"
                )}>{score.points} <span className="text-sm font-bold opacity-50">PTS</span></span>
                <Badge variant="outline" className={cn(
                   "mt-2 rounded-full text-[9px] font-black uppercase tracking-widest",
                   score.isWinner ? "border-white/20 text-white bg-white/10" : "border-primary/10 text-muted-foreground"
                )}>
                  {score.exactScores} PLACARES EXATOS
                </Badge>
              </div>
            </div>

            {score.betsCompleted && !score.isWinner && (
              <div className="absolute top-3 right-3 text-secondary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}