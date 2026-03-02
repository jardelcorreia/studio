
"use client";

import React from "react";
import { PlayerScore } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, Trophy, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankingSummaryProps {
  scores: PlayerScore[];
}

export function RankingSummary({ scores }: RankingSummaryProps) {
  // Sorting scores for display
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
            "relative overflow-hidden transition-all duration-300",
            score.isWinner ? "border-accent bg-accent/5 scale-105 z-10 shadow-lg" : "hover:translate-y-[-2px]"
          )}
        >
          {score.betsCompleted && (
            <div className="absolute top-2 right-2 text-secondary">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          <CardContent className="p-4 text-center space-y-2">
            <div className="flex justify-center">
              {index === 0 ? <Trophy className="h-8 w-8 text-accent" /> : 
               index === 1 ? <Medal className="h-8 w-8 text-slate-400" /> :
               index === 2 ? <Medal className="h-8 w-8 text-amber-700" /> :
               <Star className="h-8 w-8 text-muted" />}
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{score.name}</h3>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-primary">{score.points} pts</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {score.exactScores} Placares Exatos
                </span>
              </div>
            </div>
            {score.isWinner && (
              <div className="pt-2">
                <Badge className="bg-accent hover:bg-accent text-[9px] uppercase tracking-tighter">Vencedor</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
