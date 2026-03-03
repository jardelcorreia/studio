
"use client";

import React from "react";
import { PLAYERS } from "@/lib/constants";
import { Prediction, PlayerPredictions } from "@/lib/types";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { Trophy, UserCircle2, Swords, Share2, Camera } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

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
            <DialogContent className="max-w-[640px] p-0 overflow-hidden border-none bg-transparent shadow-none">
              <div className="flex flex-col items-center">
                 {/* 1:1 Card for Screenshot - ULTRA COMPACT 10 MATCHES */}
                 <div className="aspect-square w-[600px] h-[600px] sports-gradient p-4 flex flex-col relative shadow-2xl overflow-hidden border-2 border-white/20">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                       <div className="absolute -top-10 -right-10 rotate-12 scale-150">
                          <Trophy className="h-64 w-64 text-white" />
                       </div>
                    </div>

                    {/* Ultra Minimal Header */}
                    <div className="relative z-10 flex justify-between items-center mb-3">
                       <div className="flex flex-col">
                          <h2 className="text-2xl font-black italic uppercase text-white leading-none tracking-tighter">AlphaBet</h2>
                          <span className="text-[8px] font-bold text-accent uppercase tracking-[0.4em]">Elite League 2026</span>
                       </div>
                       <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-white/60 uppercase leading-none">Rodada</span>
                            <span className="text-xl font-black text-white italic leading-none">{roundName.split(' ')[1] || "38"}</span>
                          </div>
                       </div>
                    </div>

                    {/* Optimized Grid: 2 columns, 5 rows - PERFECT FIT */}
                    <div className="relative z-10 grid grid-cols-2 grid-rows-5 gap-2 flex-1">
                       {Array.from({ length: 10 }).map((_, idx) => {
                          const desc = matchDescriptions[idx];
                          return (
                            <div key={idx} className="bg-black/25 backdrop-blur-sm p-2 rounded-xl border border-white/10 flex flex-col justify-between">
                               <div className="text-[7px] font-black italic uppercase text-accent/90 truncate border-b border-white/5 pb-1 mb-1.5 flex justify-between">
                                  <span className="truncate">{desc || "CONFRONTO PENDENTE"}</span>
                                  <span className="text-white/30 ml-1">#{idx+1}</span>
                               </div>
                               <div className="grid grid-cols-4 gap-1.5">
                                  {PLAYERS.map(player => (
                                     <div key={player} className="flex flex-col items-center">
                                        <span className="text-[5px] font-black text-white/40 uppercase leading-none mb-1">{player.substring(0,3)}</span>
                                        <div className="bg-white/5 w-full py-1.5 rounded-md text-center border border-white/5 shadow-inner">
                                           <span className="text-[10px] font-black text-white leading-none">
                                              {predictions[player][idx]?.homeScore || "0"}-{predictions[player][idx]?.awayScore || "0"}
                                           </span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                          );
                       })}
                    </div>

                    {/* Ultra Minimal Footer */}
                    <div className="relative z-10 flex justify-between items-center border-t border-white/10 pt-3 mt-3">
                       <div className="flex items-center gap-2">
                          <div className="h-5 w-5 bg-accent rounded-lg flex items-center justify-center">
                             <Trophy className="h-3 w-3 text-accent-foreground" />
                          </div>
                          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest italic">Protocolo Alpha 2026</span>
                       </div>
                       <span className="text-[7px] font-bold text-white/20 uppercase tracking-[0.3em]">alphabet-league.cloud</span>
                    </div>
                 </div>
                 
                 <div className="mt-6 flex flex-col items-center gap-1 bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                    <p className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                       <Share2 className="h-4 w-4 text-accent" /> Capturar para Redes Sociais
                    </p>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest text-center">
                       Formato 1:1 (600x600px) com os 10 confrontos completos.
                    </p>
                 </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

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
