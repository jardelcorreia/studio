
"use client";

import React from "react";
import { PlayerScore } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Trophy, Medal, Star, Crown, CheckCircle2, Circle } from "lucide-react";
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
      {sortedScores.map((score, index) => {
        const progressPercentage = (score.betsCount / 10) * 100;
        
        return (
          <Card 
            key={score.id} 
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
              <div className="relative">
                <Avatar className={cn(
                   "h-16 w-16 rounded-2xl shadow-lg transform transition-transform group-hover:scale-110 bg-muted flex items-center justify-center",
                   score.isWinner ? "ring-4 ring-white/30" : "ring-2 ring-muted"
                )}>
                  <AvatarImage src={score.photoUrl || ""} className="object-cover" />
                  <AvatarFallback className={cn(
                    "text-2xl font-black italic w-full h-full flex items-center justify-center",
                    score.isWinner ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {score.name ? score.name.substring(0, 2).toUpperCase() : "AL"}
                  </AvatarFallback>
                </Avatar>
                
                <div className={cn(
                  "absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center shadow-lg border-2 border-background",
                  index === 0 ? "bg-accent" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-muted"
                )}>
                  {index === 0 ? <Trophy className="h-4 w-4 text-accent-foreground" /> : 
                   index === 1 ? <Medal className="h-4 w-4 text-slate-600" /> :
                   index === 2 ? <Medal className="h-4 w-4 text-white" /> :
                   <Star className="h-3 w-3 text-muted-foreground" />}
                </div>
              </div>

              <div className="w-full">
                <h3 className={cn(
                  "font-black italic uppercase text-sm leading-none mb-1 truncate",
                  score.isWinner ? "text-white" : "text-foreground"
                )}>{score.name}</h3>
                
                <div className="flex flex-col mb-4">
                  <span className={cn(
                     "text-2xl font-black",
                     score.isWinner ? "text-white" : "text-primary"
                  )}>{score.points} <span className="text-[10px] font-bold opacity-50">PTS</span></span>
                  <Badge variant="outline" className={cn(
                     "mx-auto mt-2 rounded-full text-[8px] font-black uppercase tracking-widest border-none px-2",
                     score.isWinner ? "bg-white/10 text-white" : "bg-primary/5 text-muted-foreground"
                  )}>
                    {score.exactScores} Exatos
                  </Badge>
                </div>

                {/* Status de Participação */}
                <div className="w-full space-y-1.5 pt-2 border-t border-dashed border-white/20">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         {score.betsCompleted ? (
                           <CheckCircle2 className={cn("h-3 w-3", score.isWinner ? "text-white" : "text-secondary")} />
                         ) : (
                           <Circle className={cn("h-3 w-3", score.isWinner ? "text-white/40" : "text-muted-foreground/30")} />
                         )}
                         <span className={cn("text-[9px] font-black uppercase tracking-wider", score.isWinner ? "text-white/80" : "text-muted-foreground")}>
                           {score.betsCompleted ? "Quilado" : "Não quilou ainda"}
                         </span>
                      </div>
                      <span className={cn("text-[9px] font-black", score.isWinner ? "text-white" : "text-primary")}>
                         {score.betsCount}/10
                      </span>
                   </div>
                   <Progress 
                      value={progressPercentage} 
                      className={cn(
                        "h-1 rounded-full",
                        score.isWinner ? "bg-white/10 [&>div]:bg-white" : "bg-muted [&>div]:bg-primary"
                      )} 
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
