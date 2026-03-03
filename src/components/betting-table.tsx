
"use client";

import React from "react";
import { PLAYERS, TEAMS } from "@/lib/constants";
import { Prediction, PlayerPredictions } from "@/lib/types";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Trophy, UserCircle2, Swords, Share2, Camera, X } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "./ui/dialog";

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
  roundName,
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

  const getTeamAbrev = (cleanName: string) => {
    const team = Object.values(TEAMS).find(t => t.nome === cleanName);
    return team ? team.abrev : cleanName.substring(0, 3).toUpperCase();
  };

  return (
    <div className="w-full space-y-4">
      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex justify-end px-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-black italic uppercase rounded-full gap-2 shadow-lg shadow-accent/20">
                <Camera className="h-4 w-4" />
                Gerar Card da Rodada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[620px] p-0 overflow-hidden border-none bg-black/95 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col items-center p-3">
                 <div className="w-full flex justify-between items-center mb-1 px-2">
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                       <Share2 className="h-2.5 w-2.5 text-accent" /> Alpha Protocol
                    </p>
                    <DialogClose className="text-white/40 hover:text-white transition-colors">
                       <X className="h-4 w-4" />
                    </DialogClose>
                 </div>

                 {/* 1:1 Static Card - Focus on Data Density */}
                 <div className="aspect-square w-full max-w-[580px] min-w-[300px] bg-[#020617] p-2.5 flex flex-col relative shadow-2xl overflow-hidden border border-white/10 rounded-xl self-center">
                    
                    {/* Ultra Compact Header */}
                    <div className="relative z-10 flex justify-between items-center mb-1.5 border-b border-white/10 pb-1">
                       <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 bg-accent rounded-sm flex items-center justify-center -rotate-6">
                            <Trophy className="h-2.5 w-2.5 text-black" />
                          </div>
                          <div>
                            <h2 className="text-[10px] font-black italic uppercase text-white leading-none tracking-tighter">AlphaBet</h2>
                            <span className="text-[4px] font-bold text-accent uppercase tracking-[0.3em] opacity-80">League 2026</span>
                          </div>
                       </div>
                       <div className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          <span className="text-[8px] font-black text-accent italic leading-none">{roundName.toUpperCase()}</span>
                       </div>
                    </div>

                    {/* Table Layout */}
                    <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
                       {/* Table Header */}
                       <div className="grid grid-cols-5 gap-0.5 mb-0.5 px-0.5">
                          <div className="text-[5px] font-black uppercase text-white/20 italic">JOGO</div>
                          {PLAYERS.map(player => (
                            <div key={player} className="text-center text-[6px] font-black uppercase text-accent tracking-tighter truncate">
                               {player}
                            </div>
                          ))}
                       </div>

                       {/* Match List - Optimized Vertical Spacing */}
                       <div className="flex-1 flex flex-col justify-between">
                          {Array.from({ length: 10 }).map((_, idx) => {
                             const desc = matchDescriptions[idx];
                             const parts = desc ? desc.split(' x ') : [];
                             const abrevDesc = parts.length === 2 
                                ? `${getTeamAbrev(parts[0])} x ${getTeamAbrev(parts[1])}`
                                : "--- x ---";

                             return (
                               <div key={idx} className="grid grid-cols-5 gap-0.5 items-center bg-white/[0.01] py-0.5 px-0.5 rounded border border-white/[0.01] h-[calc(100%/10.8)]">
                                  {/* Match ID + Abrev */}
                                  <div className="flex items-center gap-1 overflow-hidden">
                                     <span className="text-[4px] font-black text-white/10 italic tabular-nums">#{idx + 1}</span>
                                     <span className="text-[7.5px] font-black italic uppercase text-white truncate tracking-tighter">
                                        {abrevDesc}
                                     </span>
                                  </div>

                                  {/* Player Predictions - Compact Cells */}
                                  {PLAYERS.map(player => (
                                     <div key={player} className="flex justify-center h-full items-center">
                                        <div className="bg-black/40 w-full py-0.5 rounded border border-white/5 flex items-center justify-center">
                                           <span className="text-[9px] font-black text-white leading-none tabular-nums tracking-tighter">
                                              {predictions[player][idx]?.homeScore || "0"}-{predictions[player][idx]?.awayScore || "0"}
                                           </span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                             );
                          })}
                       </div>
                    </div>

                    {/* Minimal Footer */}
                    <div className="relative z-10 flex justify-center items-center mt-1 pt-0.5 border-t border-white/5">
                       <span className="text-[4px] font-black text-white/10 uppercase tracking-[0.5em]">Alpha Cloud Protocol • High Density Data View</span>
                    </div>
                 </div>
                 
                 <div className="mt-2">
                    <p className="text-white/30 text-[7px] uppercase tracking-[0.2em] text-center font-bold">
                       Captura Técnica 1:1 • Minimalista
                    </p>
                 </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* App View Viewport */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 bg-muted/20 rounded-2xl border border-transparent">
        <div className="col-span-3 text-[10px] font-black uppercase text-muted-foreground">Confronto</div>
        <div className="col-span-6 flex justify-around text-[10px] font-black uppercase text-muted-foreground">Palpites da Liga</div>
        <div className="col-span-3 text-center text-[10px] font-black uppercase text-muted-foreground">Resultado</div>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {matchDescriptions.map((desc, idx) => (
          <div key={idx} className="glass-card border-none rounded-2xl overflow-hidden group hover:bg-primary/5 transition-all duration-200">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[60px]">
              
              {/* Match Info */}
              <div className="md:col-span-3 px-4 py-2 flex items-center gap-3 border-b md:border-b-0 md:border-r border-dashed border-primary/10">
                <span className="text-[9px] font-black text-primary/40 italic">#{idx + 1}</span>
                <div className="text-[11px] md:text-xs font-black italic uppercase text-primary leading-tight truncate">
                  {desc || "---"}
                </div>
              </div>

              {/* Players Predictions */}
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
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Real Result */}
              <div className="md:col-span-3 px-4 py-2 bg-primary/5 flex items-center justify-center md:border-l border-dashed border-primary/10 gap-3">
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
    </div>
  );
}
