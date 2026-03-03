
"use client";

import React from "react";
import { PLAYERS } from "@/lib/constants";
import { Prediction, PlayerPredictions } from "@/lib/types";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Trophy, UserCircle2, Swords } from "lucide-react";

interface BettingTableProps {
  roundName: string;
  matchDescriptions: string[];
  predictions: PlayerPredictions;
  setPrediction: (player: string, matchIndex: number, type: 'home' | 'away', value: string) => void;
  results: Prediction[];
  setResult: (matchIndex: number, type: 'home' | 'away', value: string) => void;
  placaresOcultos: boolean;
  currentPlayer: string;
  isAdmin?: boolean;
}

export function BettingTable({
  matchDescriptions,
  predictions,
  results,
  setResult,
  placaresOcultos,
  currentPlayer,
  isAdmin
}: BettingTableProps) {
  
  const getPoints = (player: string, idx: number) => {
    const res = results[idx];
    const pred = predictions[player][idx];
    if (!res?.homeScore || !res?.awayScore || !pred?.homeScore || !pred?.awayScore) return null;
    const rh = parseInt(res.homeScore), ra = parseInt(res.awayScore);
    const ph = parseInt(pred.homeScore), pa = parseInt(pred.awayScore);
    if (ph === rh && pa === ra) return 3;
    if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) return 1;
    return 0;
  };

  return (
    <div className="w-full space-y-2">
      {/* Header Compacto - Desktop Only Labeling */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 bg-muted/20 rounded-2xl border border-transparent">
        <div className="col-span-3 text-[10px] font-black uppercase text-muted-foreground">Confronto</div>
        <div className="col-span-6 flex justify-around text-[10px] font-black uppercase text-muted-foreground">Palpites da Liga</div>
        <div className="col-span-3 text-center text-[10px] font-black uppercase text-muted-foreground">Resultado</div>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {matchDescriptions.map((desc, idx) => (
          <div key={idx} className="glass-card border-none rounded-2xl overflow-hidden group hover:bg-primary/5 transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[60px]">
              
              {/* Match Info - Ultra Minimalist */}
              <div className="md:col-span-3 px-4 py-2 flex items-center gap-3 border-b md:border-b-0 md:border-r border-dashed border-primary/10">
                <span className="text-[9px] font-black text-primary/40 italic">#{idx + 1}</span>
                <div className="text-[11px] md:text-xs font-black italic uppercase text-primary leading-tight truncate">
                  {desc || "---"}
                </div>
              </div>

              {/* Players Predictions - Condensed Row */}
              <div className="md:col-span-6 px-2 py-3 flex items-center justify-around gap-1 md:gap-4 overflow-x-auto no-scrollbar">
                {PLAYERS.map(player => {
                  const isHidden = placaresOcultos && currentPlayer !== player;
                  const points = getPoints(player, idx);
                  const isCurrent = currentPlayer === player;

                  return (
                    <div key={player} className={cn(
                      "flex flex-col items-center min-w-[55px] md:min-w-[70px] relative transition-all",
                      isCurrent && "scale-105"
                    )}>
                      <div className="flex items-center gap-0.5 mb-1">
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-tighter",
                          isCurrent ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {/* Abreviar no mobile */}
                          <span className="md:hidden">{player.substring(0, 3)}</span>
                          <span className="hidden md:inline">{player}</span>
                        </span>
                        {isCurrent && <UserCircle2 className="h-2 w-2 text-primary" />}
                      </div>

                      <div className={cn(
                        "flex items-center justify-center gap-1 px-2 py-1 rounded-xl border transition-colors",
                        points === 3 ? "bg-secondary text-white border-secondary shadow-md" : 
                        points === 1 ? "bg-accent text-accent-foreground border-accent shadow-sm" : 
                        points === 0 ? "bg-destructive/10 border-destructive/20 text-destructive" :
                        "bg-background border-muted shadow-sm"
                      )}>
                        <span className="text-[11px] font-black">
                          {isHidden ? "?" : predictions[player][idx].homeScore || "-"}
                        </span>
                        <span className="text-[8px] font-black opacity-30">x</span>
                        <span className="text-[11px] font-black">
                          {isHidden ? "?" : predictions[player][idx].awayScore || "-"}
                        </span>
                        
                        {points !== null && points > 0 && !isHidden && (
                          <div className="absolute -top-1 -right-1">
                            {points === 3 ? (
                              <div className="h-4 w-4 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-secondary animate-float">
                                <Trophy className="h-2 w-2 text-secondary" />
                              </div>
                            ) : (
                              <div className="h-3.5 w-3.5 bg-white rounded-full flex items-center justify-center shadow-sm border border-accent text-[7px] font-black text-accent-foreground">
                                1
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Real Result - Small & Precise */}
              <div className="md:col-span-3 px-4 py-2 bg-primary/5 flex items-center justify-center md:border-l border-dashed border-primary/10 gap-3">
                <div className="hidden lg:flex flex-col items-end">
                   <span className="text-[8px] font-black uppercase text-primary/40">Oficial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={results[idx].homeScore}
                    onChange={(e) => setResult(idx, 'home', e.target.value)}
                    className="w-8 h-8 text-center rounded-lg p-0 font-black text-xs border-primary/10 bg-white dark:bg-card shadow-inner"
                    disabled={!isAdmin}
                    placeholder="-"
                  />
                  <Swords className="h-3 w-3 text-primary/30" />
                  <Input
                    type="number"
                    value={results[idx].awayScore}
                    onChange={(e) => setResult(idx, 'away', e.target.value)}
                    className="w-8 h-8 text-center rounded-lg p-0 font-black text-xs border-primary/10 bg-white dark:bg-card shadow-inner"
                    disabled={!isAdmin}
                    placeholder="-"
                  />
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
      
      {/* Legenda Minimalista */}
      <div className="flex items-center justify-center gap-6 pt-4 px-2">
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <span className="text-[9px] font-black uppercase text-muted-foreground">Placar Exato (+3)</span>
         </div>
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-[9px] font-black uppercase text-muted-foreground">Vencedor (+1)</span>
         </div>
         <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive/50" />
            <span className="text-[9px] font-black uppercase text-muted-foreground">Erro</span>
         </div>
      </div>
    </div>
  );
}
