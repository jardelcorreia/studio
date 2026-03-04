"use client";

import React from "react";
import { PlayerScore } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Trophy, Medal, Star, Crown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingSummaryProps {
  scores: PlayerScore[];
  isScoresHidden: boolean;
}

export function RankingSummary({ scores, isScoresHidden }: RankingSummaryProps) {
  const sortedScores = [...scores].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.exactScores - a.exactScores;
  });

  return (
    <div className="flex flex-col md:grid md:grid-cols-4 gap-3">
      {sortedScores.map((score, index) => {
        const progressPercentage = (score.betsCount / 10) * 100;
        
        return (
          <Card 
            key={score.id} 
            className={cn(
              "relative overflow-hidden transition-all duration-500 rounded-2xl group border-none",
              score.isWinner 
                ? "bg-gradient-to-br from-primary via-primary/90 to-blue-800 shadow-lg shadow-primary/20" 
                : "glass-card hover:bg-primary/5"
            )}
          >
            {score.isWinner && (
              <div className="absolute top-0 right-0 p-2 opacity-10 md:opacity-20">
                 <Crown className="h-12 w-12 text-white animate-pulse" />
              </div>
            )}
            
            <CardContent className="p-3 md:p-5 flex flex-row md:flex-col items-center md:text-center gap-4 relative z-10">
              {/* Avatar Section */}
              <div className="relative shrink-0">
                <Avatar className={cn(
                   "h-12 w-12 md:h-16 md:w-16 rounded-xl shadow-md bg-muted flex items-center justify-center",
                   score.isWinner ? "ring-2 ring-white/30" : "ring-1 ring-muted"
                )}>
                  <AvatarImage src={score.photoUrl || ""} className="object-cover" />
                  <AvatarFallback className={cn(
                    "text-lg md:text-2xl font-black italic w-full h-full flex items-center justify-center",
                    score.isWinner ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {score.name ? score.name.substring(0, 2).toUpperCase() : "AL"}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "absolute -top-1.5 -right-1.5 h-5 w-5 md:h-7 md:w-7 rounded-full flex items-center justify-center shadow-lg border-2 border-background",
                  index === 0 ? "bg-accent" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-muted"
                )}>
                  {index === 0 ? <Trophy className="h-2.5 w-2.5 md:h-4 md:w-4 text-accent-foreground" /> : 
                   index === 1 ? <Medal className="h-2.5 w-2.5 md:h-4 md:w-4 text-slate-600" /> :
                   index === 2 ? <Medal className="h-2.5 w-2.5 md:h-4 md:w-4 text-white" /> :
                   <Star className="h-2 w-2 md:h-3 md:w-3 text-muted-foreground" />}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 w-full min-w-0 space-y-0.5">
                <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-center">
                  <h3 className={cn(
                    "font-black italic uppercase text-[13px] md:text-sm leading-none truncate pr-2",
                    score.isWinner ? "text-white" : "text-foreground"
                  )}>{score.name}</h3>
                  
                  <div className="flex items-center md:flex-col gap-2 md:gap-0">
                    <span className={cn(
                       "text-xl md:text-2xl font-black tabular-nums",
                       score.isWinner ? "text-white" : "text-primary"
                    )}>
                      {score.points} <span className="text-[9px] md:text-[10px] font-bold opacity-50">PTS</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                   <Badge variant="outline" className={cn(
                      "rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border-none px-2 h-4",
                      score.isWinner ? "bg-white/10 text-white" : "bg-primary/5 text-muted-foreground"
                   )}>
                     {score.exactScores} Exatos
                   </Badge>

                   {isScoresHidden && (
                     <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-[11px] md:text-[10px] font-black uppercase italic tracking-tighter whitespace-nowrap",
                          score.betsCompleted 
                            ? (score.isWinner ? "text-white" : "text-secondary") 
                            : (score.isWinner ? "text-white/60" : "text-muted-foreground/60")
                        )}>
                          {score.betsCompleted ? "Quilado" : "Não Quilou"}
                          <span className="ml-1 opacity-50 tabular-nums">({score.betsCount}/10)</span>
                        </span>
                     </div>
                   )}
                </div>

                {isScoresHidden && (
                  <Progress 
                    value={progressPercentage} 
                    className={cn(
                      "h-1 rounded-full mt-1.5",
                      score.isWinner ? "bg-white/10 [&>div]:bg-white" : "bg-muted [&>div]:bg-primary"
                    )} 
                  />
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
