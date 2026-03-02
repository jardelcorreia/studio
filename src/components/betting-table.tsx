
"use client";

import React from "react";
import { PLAYERS } from "@/lib/constants";
import { Prediction, PlayerPredictions } from "@/lib/types";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, CheckCircle2, UserCircle2 } from "lucide-react";

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
    <div className="grid grid-cols-1 gap-4">
      {matchDescriptions.map((desc, idx) => (
        <Card key={idx} className="glass-card border-none rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            {/* Match Info Area */}
            <div className="md:col-span-3 p-6 bg-muted/30 flex flex-col justify-center border-b md:border-b-0 md:border-r border-dashed h-full">
               <div className="text-[10px] font-black uppercase text-muted-foreground mb-2">Confronto #{idx + 1}</div>
               <div className="text-lg font-black italic uppercase text-primary leading-tight">
                 {desc || "Pendente"}
               </div>
            </div>

            {/* Players Predictions Area */}
            <div className="md:col-span-6 p-4 md:p-6 flex flex-wrap items-center justify-around gap-4">
               {PLAYERS.map(player => {
                  const isHidden = placaresOcultos && currentPlayer !== player;
                  const points = getPoints(player, idx);
                  const isCurrent = currentPlayer === player;

                  return (
                    <div key={player} className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all min-w-[80px]",
                      isCurrent && "bg-primary/5 ring-1 ring-primary/20"
                    )}>
                       <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-tighter",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )}>{player}</span>
                          {isCurrent && <UserCircle2 className="h-2 w-2 text-primary" />}
                       </div>
                       <div className="flex items-center gap-1 relative">
                          <div className={cn(
                            "w-9 h-10 flex items-center justify-center rounded-xl font-black text-lg border bg-background shadow-sm",
                            points === 3 && "bg-secondary/20 border-secondary text-secondary",
                            points === 1 && "bg-accent/20 border-accent text-accent",
                          )}>
                            {isHidden ? "?" : predictions[player][idx].homeScore}
                          </div>
                          <span className="text-muted-foreground/30 font-black text-[10px]">X</span>
                          <div className={cn(
                            "w-9 h-10 flex items-center justify-center rounded-xl font-black text-lg border bg-background shadow-sm",
                            points === 3 && "bg-secondary/20 border-secondary text-secondary",
                            points === 1 && "bg-accent/20 border-accent text-accent",
                          )}>
                            {isHidden ? "?" : predictions[player][idx].awayScore}
                          </div>
                          
                          {points !== null && points > 0 && !isHidden && (
                            <div className={cn(
                              "absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm",
                              points === 3 ? "bg-secondary" : "bg-accent"
                            )}>
                               {points === 3 ? <Trophy className="h-2 w-2" /> : points}
                            </div>
                          )}
                       </div>
                    </div>
                  );
               })}
            </div>

            {/* Real Result Area */}
            <div className="md:col-span-3 p-6 bg-primary/5 flex flex-col items-center justify-center md:border-l border-dashed h-full">
               <div className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Placar Final
               </div>
               <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={results[idx].homeScore}
                    onChange={(e) => setResult(idx, 'home', e.target.value)}
                    className="w-11 h-12 text-center rounded-xl p-0 font-black text-xl border-primary/20 shadow-inner"
                    disabled={!isAdmin}
                    placeholder="-"
                  />
                  <span className="font-black text-primary/40 italic">VS</span>
                  <Input
                    type="number"
                    value={results[idx].awayScore}
                    onChange={(e) => setResult(idx, 'away', e.target.value)}
                    className="w-11 h-12 text-center rounded-xl p-0 font-black text-xl border-primary/20 shadow-inner"
                    disabled={!isAdmin}
                    placeholder="-"
                  />
               </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
