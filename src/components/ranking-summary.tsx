
"use client";

import React from "react";
import { PlayerScore } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Trophy, Medal, Star, Crown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface RankingSummaryProps {
  scores: PlayerScore[];
  isScoresHidden: boolean;
  isRoundFinished: boolean;
}

export function RankingSummary({ scores, isScoresHidden, isRoundFinished }: RankingSummaryProps) {
  // Já vem ordenado do pai (page.tsx) com a lógica de winner definida
  const sortedScores = scores;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">
            {isRoundFinished ? "Classificação Final" : "Classificação em Tempo Real"}
          </span>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-primary/60 hover:text-primary transition-colors">
                <Info className="h-3 w-3" />
                Regras de Pontuação
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-popover border-primary/10 p-4 max-w-xs rounded-2xl shadow-2xl">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-primary italic">Pontuação por Jogo</p>
                  <ul className="text-[10px] space-y-1 font-medium">
                    <li className="flex justify-between"><span>Placar Exato:</span> <span className="font-black text-secondary">3 pts</span></li>
                    <li className="flex justify-between"><span>Acertar Vencedor/Empate:</span> <span className="font-black text-accent">1 pt</span></li>
                    <li className="flex justify-between"><span>Erro total:</span> <span className="font-black text-destructive">0 pts</span></li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-dashed border-primary/10">
                  <p className="text-[10px] font-black uppercase text-primary italic">Desempate</p>
                  <p className="text-[10px] font-medium leading-relaxed">Em caso de empate em pontos, vence quem tiver o maior número de **Placares Exatos**.</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-4 gap-4">
        {sortedScores.map((score, index) => {
          const progressPercentage = (score.betsCount / 10) * 100;
          // Agora o estilo de vencedor é controlado pela flag isWinner (definida matematicamente no pai)
          const showWinnerStyles = score.isWinner;
          const showMedals = score.points > 0 && (isRoundFinished || score.isWinner);
          
          return (
            <Card 
              key={score.id} 
              className={cn(
                "relative overflow-hidden transition-all duration-500 rounded-3xl group border-none",
                showWinnerStyles 
                  ? "bg-gradient-to-br from-primary via-primary/90 to-blue-800 shadow-xl shadow-primary/20 scale-105 z-20" 
                  : "glass-card hover:bg-primary/5"
              )}
            >
              {showWinnerStyles && (
                <div className="absolute top-0 right-0 p-2 opacity-10 md:opacity-20">
                   <Crown className="h-16 w-16 text-white animate-pulse" />
                </div>
              )}
              
              <CardContent className="p-4 md:p-6 flex flex-row md:flex-col items-center md:text-center gap-5 relative z-10">
                {/* Squircle Avatar Container */}
                <div className="relative shrink-0 group">
                  <div className={cn(
                    "relative h-14 w-14 md:h-20 md:w-20 flex items-center justify-center rounded-[1.25rem] md:rounded-[1.75rem] shadow-inner transition-transform group-hover:scale-105",
                    showWinnerStyles ? "bg-white/20" : "bg-primary/5"
                  )}>
                    <Avatar className={cn(
                       "h-12 w-12 md:h-[72px] md:w-[72px] rounded-full border-2 border-background shadow-md bg-muted flex items-center justify-center transition-all",
                       showWinnerStyles && "border-white/40"
                    )}>
                      <AvatarImage src={score.photoUrl || undefined} className="object-cover" />
                      <AvatarFallback className={cn(
                        "text-xl md:text-2xl font-black italic w-full h-full flex items-center justify-center",
                        showWinnerStyles ? "bg-primary text-white" : "bg-primary/10 text-primary"
                      )}>
                        {score.name ? score.name.substring(0, 2).toUpperCase() : "AL"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {showMedals && (
                    <div className={cn(
                      "absolute -top-1.5 -right-1.5 h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-20",
                      index === 0 ? "bg-accent" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-muted"
                    )}>
                      {index === 0 ? <Trophy className="h-3 w-3 md:h-4 md:w-4 text-accent-foreground" /> : 
                       index === 1 ? <Medal className="h-3 w-3 md:h-4 md:w-4 text-slate-600" /> :
                       index === 2 ? <Medal className="h-3 w-3 md:h-4 md:w-4 text-white" /> :
                       <Star className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />}
                    </div>
                  )}

                  {!score.isWinner && score.points > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-background shadow-lg">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 w-full min-w-0 space-y-1">
                  <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-center gap-2">
                    <h3 className={cn(
                      "font-black italic uppercase text-[15px] md:text-sm leading-none truncate pr-1",
                      showWinnerStyles ? "text-white" : "text-foreground"
                    )}>{score.name}</h3>
                    
                    <div className="flex items-center md:flex-col gap-2 md:gap-0">
                      <span className={cn(
                         "text-2xl md:text-3xl font-black tabular-nums tracking-tighter",
                         showWinnerStyles ? "text-white" : "text-primary"
                      )}>
                        {score.points} <span className="text-[10px] md:text-[11px] font-bold opacity-50 italic">PTS</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 md:mt-2">
                     <Badge variant="outline" className={cn(
                        "rounded-full text-[10px] md:text-[10px] font-black uppercase tracking-widest border-none px-3 h-5",
                        showWinnerStyles ? "bg-white/10 text-white" : "bg-primary/5 text-muted-foreground"
                     )}>
                       {score.exactScores} Exatos
                     </Badge>

                     {isScoresHidden && (
                       <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "text-[11px] md:text-[11px] font-black uppercase italic tracking-tighter whitespace-nowrap",
                            score.betsCompleted 
                              ? (showWinnerStyles ? "text-white" : "text-secondary") 
                              : (showWinnerStyles ? "text-white/60" : "text-muted-foreground/60")
                          )}>
                            {score.betsCompleted ? "Quilado" : "Não Quilou"}
                            <span className="ml-1 opacity-50 tabular-nums">({score.betsCount}/10)</span>
                          </span>
                       </div>
                     )}
                  </div>

                  {isScoresHidden && (
                    <div className="mt-2">
                      <Progress 
                        value={progressPercentage} 
                        className={cn(
                          "h-1.5 rounded-full",
                          showWinnerStyles ? "bg-white/10 [&>div]:bg-white" : "bg-muted [&>div]:bg-primary"
                        )} 
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
