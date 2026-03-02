"use client";

import React from "react";
import { PLAYERS } from "@/lib/constants";
import { Prediction, PlayerPredictions } from "@/lib/types";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Trophy, CheckCircle2 } from "lucide-react";

interface BettingTableProps {
  roundName: string;
  setRoundName: (name: string) => void;
  matchDescriptions: string[];
  setMatchDescriptions: (index: number, value: string) => void;
  predictions: PlayerPredictions;
  setPrediction: (player: string, matchIndex: number, type: 'home' | 'away', value: string) => void;
  results: Prediction[];
  setResult: (matchIndex: number, type: 'home' | 'away', value: string) => void;
  placaresOcultos: boolean;
  currentPlayer: string;
}

export function BettingTable({
  roundName,
  setRoundName,
  matchDescriptions,
  setMatchDescriptions,
  predictions,
  setPrediction,
  results,
  setResult,
  placaresOcultos,
  currentPlayer
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
            <div className="md:col-span-3 p-6 bg-muted/30 flex flex-col justify-center border-b md:border-b-0 md:border-r border-dashed">
               <div className="text-[10px] font-black uppercase text-muted-foreground mb-2">Confronto #{idx + 1}</div>
               <Input
                  value={desc}
                  onChange={(e) => setMatchDescriptions(idx, e.target.value)}
                  className="bg-transparent border-none p-0 h-auto text-lg font-black italic uppercase text-primary placeholder:opacity-30 focus-visible:ring-0"
                  placeholder="TIME A x TIME B"
                />
            </div>

            {/* Players Predictions Area */}
            <div className="md:col-span-6 p-4 md:p-6 flex flex-wrap items-center justify-around gap-4">
               {PLAYERS.map(player => {
                  const isHidden = placaresOcultos && currentPlayer !== player;
                  const isDisabled = !placaresOcultos || isHidden;
                  const points = getPoints(player, idx);
                  const isCurrent = currentPlayer === player;

                  return (
                    <div key={player} className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all",
                      isCurrent && "bg-primary/5 ring-1 ring-primary/20"
                    )}>
                       <span className={cn(
                         "text-[9px] font-black uppercase tracking-tighter",
                         isCurrent ? "text-primary" : "text-muted-foreground"
                       )}>{player}</span>
                       <div className="flex items-center gap-1 relative">
                          <Input
                            type="number"
                            disabled={isDisabled}
                            value={isHidden ? "" : predictions[player][idx].homeScore}
                            onChange={(e) => setPrediction(player, idx, 'home', e.target.value)}
                            className={cn(
                              "w-9 h-10 text-center rounded-xl p-0 font-black",
                              points === 3 && "bg-secondary/20 border-secondary text-secondary",
                              points === 1 && "bg-accent/20 border-accent text-accent",
                              isDisabled && !isHidden && "opacity-80"
                            )}
                          />
                          <span className="text-muted-foreground/30 font-black text-[10px]">X</span>
                          <Input
                            type="number"
                            disabled={isDisabled}
                            value={isHidden ? "" : predictions[player][idx].awayScore}
                            onChange={(e) => setPrediction(player, idx, 'away', e.target.value)}
                            className={cn(
                              "w-9 h-10 text-center rounded-xl p-0 font-black",
                              points === 3 && "bg-secondary/20 border-secondary text-secondary",
                              points === 1 && "bg-accent/20 border-accent text-accent",
                              isDisabled && !isHidden && "opacity-80"
                            )}
                          />
                          {points !== null && points > 0 && (
                            <div className={cn(
                              "absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm",
                              points === 3 ? "bg-secondary" : "bg-accent"
                            )}>
                               {points === 3 ? <Trophy className="h-2 w-2" /> : points}
                            </div>
                          )}
                          {isHidden && (
                            <div className="absolute inset-0 bg-muted/40 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                               <Badge className="bg-muted text-muted-foreground text-[7px] border-none">?</Badge>
                            </div>
                          )}
                       </div>
                    </div>
                  );
               })}
            </div>

            {/* Real Result Area */}
            <div className="md:col-span-3 p-6 bg-primary/5 flex flex-col items-center justify-center md:border-l border-dashed">
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
                  />
                  <span className="font-black text-primary/40 italic">VS</span>
                  <Input
                    type="number"
                    value={results[idx].awayScore}
                    onChange={(e) => setResult(idx, 'away', e.target.value)}
                    className="w-11 h-12 text-center rounded-xl p-0 font-black text-xl border-primary/20 shadow-inner"
                  />
               </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}