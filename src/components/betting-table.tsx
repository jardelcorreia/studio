
"use client";

import React from "react";
import { TEAMS } from "@/lib/constants";
import { Prediction, PlayerPredictions, Match } from "@/lib/types";
import { Input } from "./ui/input";
import { cn, cleanTeamName } from "@/lib/utils";
import { Trophy, UserCircle2, Swords, Share2, Camera, X, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "./ui/dialog";

interface BettingTableProps {
  roundName: string;
  matches: Match[];
  predictions: PlayerPredictions;
  setPrediction: (userId: string, matchIndex: number, type: 'home' | 'away', value: string) => void;
  results: Prediction[];
  setResult: (matchIndex: number, type: 'home' | 'away', value: string) => void;
  placaresOcultos: boolean;
  currentPlayerId: string;
  isAdmin?: boolean;
  allUsers: any[];
}

export function BettingTable({
  roundName,
  matches,
  predictions,
  results,
  setResult,
  placaresOcultos,
  currentPlayerId,
  isAdmin,
  allUsers
}: BettingTableProps) {
  
  const getPoints = (userId: string, idx: number) => {
    if (matches[idx]?.isValidForPoints === false) return null;

    const res = results[idx];
    const pred = predictions[userId]?.[idx];
    if (!res?.homeScore || !res?.awayScore || !pred?.homeScore || !pred?.awayScore) return null;
    const rh = parseInt(res.homeScore), ra = parseInt(res.awayScore);
    const ph = parseInt(pred.homeScore), pa = parseInt(pred.awayScore);
    if (ph === rh && pa === ra) return 3;
    if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) return 1;
    return 0;
  };

  const getTeamAbrev = (rawName: string) => {
    const cleaned = cleanTeamName(rawName);
    const team = Object.values(TEAMS).find(t => t.nome === cleaned);
    return team ? team.abrev : cleaned.substring(0, 3).toUpperCase();
  };

  const sortedUsers = [...allUsers].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="w-full space-y-4">
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
              <DialogHeader className="sr-only">
                <DialogTitle>Card da Rodada</DialogTitle>
                <DialogDescription>Visualização técnica dos palpites da rodada para compartilhamento.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center p-3">
                 <div className="w-full flex justify-between items-center mb-1 px-2">
                    <p className="text-white/40 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                       <Share2 className="h-2.5 w-2.5 text-accent" /> AlphaBet League
                    </p>
                    <DialogClose className="text-white/40 hover:text-white transition-colors">
                       <X className="h-4 w-4" />
                    </DialogClose>
                 </div>

                 <div className="aspect-square w-full max-w-[580px] min-w-[300px] bg-[#020617] p-2 flex flex-col relative shadow-2xl overflow-hidden border border-white/10 rounded-xl self-center">
                    <div className="relative z-10 flex justify-between items-center mb-0.5 border-b border-white/10 pb-0.5">
                       <div className="flex items-center gap-1.5">
                          <div className="h-4 w-4 bg-accent rounded-sm flex items-center justify-center -rotate-6">
                            <Trophy className="h-2.5 w-2.5 text-black" />
                          </div>
                          <div className="flex flex-col -space-y-0.5">
                            <div className="text-[10px] font-black italic uppercase text-white leading-none tracking-tighter">AlphaBet</div>
                            <div className="text-[4px] font-bold text-accent uppercase tracking-[0.3em] opacity-80 leading-none">League 2026</div>
                          </div>
                       </div>
                       <div className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                          <span className="text-[8px] font-black text-accent italic leading-none">{roundName.toUpperCase()}</span>
                       </div>
                    </div>

                    <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
                       <div className="grid grid-cols-5 gap-0.5 mb-0.5 px-0.5">
                          <div className="text-[5px] font-black uppercase text-white/20 italic">JOGO</div>
                          {sortedUsers.map(u => (
                            <div key={u.id} className="text-center text-[7px] font-black uppercase text-accent tracking-tighter truncate px-1">
                               {u.username}
                            </div>
                          ))}
                       </div>

                       <div className="flex-1 flex flex-col justify-between">
                          {Array.from({ length: 10 }).map((_, idx) => {
                             const match = matches[idx];
                             const homeAbrev = match ? getTeamAbrev(match.homeTeam) : "---";
                             const awayAbrev = match ? getTeamAbrev(match.awayTeam) : "---";
                             const abrevDesc = `${homeAbrev} x ${awayAbrev}`;

                             return (
                               <div key={idx} className="grid grid-cols-5 gap-0.5 items-center bg-white/[0.01] py-0.2 px-0.5 rounded border border-white/[0.01] h-[calc(100%/10.8)]">
                                  <div className="flex items-center gap-1 overflow-hidden">
                                     <span className="text-[4px] font-black text-white/10 italic tabular-nums">#{idx + 1}</span>
                                     <span className={cn(
                                       "text-[7.5px] font-black italic uppercase truncate tracking-tighter",
                                       match?.isValidForPoints === false ? "text-white/20" : "text-white"
                                     )}>
                                        {abrevDesc}
                                     </span>
                                  </div>

                                  {sortedUsers.map(u => (
                                     <div key={u.id} className="flex justify-center h-full items-center">
                                        <div className="bg-black/40 w-full py-0.2 rounded border border-white/5 flex items-center justify-center">
                                           <span className={cn(
                                             "text-[9px] font-black leading-none tabular-nums tracking-tighter",
                                             match?.isValidForPoints === false ? "text-white/20" : "text-white"
                                           )}>
                                              {predictions[u.id]?.[idx]?.homeScore || "0"}-{predictions[u.id]?.[idx]?.awayScore || "0"}
                                           </span>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                             );
                          })}
                       </div>
                    </div>
                    <div className="relative z-10 flex justify-center items-center mt-1 pt-0.5 border-t border-white/5">
                       <span className="text-[4px] font-black text-white/10 uppercase tracking-[0.5em]">AlphaBet League • Visão de Dados</span>
                    </div>
                 </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
        <div className="col-span-3 text-[10px] font-black uppercase text-primary/60 italic tracking-widest">Confronto</div>
        <div className="col-span-6 flex justify-around text-[10px] font-black uppercase text-primary/60 italic tracking-widest">Palpites dos Jogadores</div>
        <div className="col-span-3 text-center text-[10px] font-black uppercase text-primary/60 italic tracking-widest">Placar Oficial</div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {matches.map((match, idx) => {
          const isOutOfWindow = match.isValidForPoints === false;
          const desc = `${cleanTeamName(match.homeTeam)} x ${cleanTeamName(match.awayTeam)}`;

          return (
            <div key={idx} className={cn(
              "glass-card border-none rounded-2xl overflow-hidden group transition-all duration-300",
              isOutOfWindow ? "opacity-60 saturate-50" : "hover:bg-primary/[0.02]"
            )}>
              <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[70px]">
                <div className="md:col-span-3 px-6 py-4 flex items-center justify-between md:justify-start gap-4 border-b md:border-b-0 md:border-r border-dashed border-primary/10">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-primary/40 italic tabular-nums">#{idx + 1}</span>
                    <div className="flex flex-col">
                      <div className="text-[11px] md:text-xs font-black italic uppercase text-primary leading-tight truncate max-w-[140px] sm:max-w-none group-hover:translate-x-1 transition-transform">
                        {desc || "---"}
                      </div>
                      {isOutOfWindow && (
                        <span className="text-[8px] font-black text-destructive uppercase flex items-center gap-1 mt-0.5">
                          <AlertCircle className="h-2 w-2" /> Fora da Janela
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="md:hidden flex items-center gap-1 px-2">
                    {isAdmin ? (
                      <div className="flex items-center gap-0.5">
                        <Input
                          type="number"
                          value={results[idx].homeScore}
                          onChange={(e) => setResult(idx, 'home', e.target.value)}
                          className="w-6 h-6 text-center p-0 font-black text-xs border-none bg-transparent text-primary shadow-none focus-visible:ring-0"
                          placeholder="-"
                        />
                        <span className="text-[10px] font-black text-primary/30">x</span>
                        <Input
                          type="number"
                          value={results[idx].awayScore}
                          onChange={(e) => setResult(idx, 'away', e.target.value)}
                          className="w-6 h-6 text-center p-0 font-black text-xs border-none bg-transparent text-primary shadow-none focus-visible:ring-0"
                          placeholder="-"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 font-black text-xs text-primary tabular-nums">
                        <span>{results[idx].homeScore !== "" ? results[idx].homeScore : "-"}</span>
                        <span className="text-primary/30 font-bold">x</span>
                        <span>{results[idx].awayScore !== "" ? results[idx].awayScore : "-"}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-6 px-4 py-4 flex items-center justify-around gap-2 md:gap-6 overflow-x-auto no-scrollbar">
                  {sortedUsers.map(u => {
                    const isHidden = placaresOcultos && currentPlayerId !== u.id;
                    const points = getPoints(u.id, idx);
                    const isCurrent = currentPlayerId === u.id;

                    return (
                      <div key={u.id} className={cn(
                        "flex flex-col items-center min-w-[75px] md:min-w-[90px] relative transition-all",
                        isCurrent && "scale-110 z-10"
                      )}>
                        <div className="flex items-center gap-1 mb-2 px-1 w-full justify-center">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-tighter truncate text-center w-full",
                            isCurrent ? "text-primary font-bold" : "text-muted-foreground/50"
                          )}>
                            {u.username}
                          </span>
                        </div>

                        <div className={cn(
                          "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all duration-300",
                          isOutOfWindow ? "bg-muted/50 border-transparent text-muted-foreground" :
                          points === 3 ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" : 
                          points === 1 ? "bg-accent text-accent-foreground border-accent shadow-md" : 
                          points === 0 ? "bg-destructive/5 border-destructive/10 text-destructive" :
                          "bg-background border-muted/30 shadow-sm"
                        )}>
                          <span className="text-[14px] font-black tabular-nums tracking-tighter">
                            {isHidden ? "?" : (predictions[u.id]?.[idx]?.homeScore || "-")}
                          </span>
                          <span className="text-[9px] font-black opacity-30 italic">x</span>
                          <span className="text-[14px] font-black tabular-nums tracking-tighter">
                            {isHidden ? "?" : (predictions[u.id]?.[idx]?.awayScore || "-")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={cn(
                  "md:col-span-3 px-6 py-4 flex items-center justify-center md:border-l border-dashed border-primary/10 gap-3 hidden md:flex",
                )}>
                  <div className="flex items-center gap-2 bg-muted/20 p-1.5 rounded-2xl border border-transparent hover:border-primary/10 transition-colors">
                    <Input
                      type="number"
                      value={results[idx].homeScore}
                      onChange={(e) => setResult(idx, 'home', e.target.value)}
                      className="w-10 h-10 text-center rounded-xl p-0 font-black text-sm border-primary/10 bg-white dark:bg-card shadow-inner focus:ring-primary/20"
                      disabled={!isAdmin}
                      placeholder="-"
                    />
                    <Swords className="h-4 w-4 text-primary/20" />
                    <Input
                      type="number"
                      value={results[idx].awayScore}
                      onChange={(e) => setResult(idx, 'away', e.target.value)}
                      className="w-10 h-10 text-center rounded-xl p-0 font-black text-sm border-primary/10 bg-white dark:bg-card shadow-inner focus:ring-primary/20"
                      disabled={!isAdmin}
                      placeholder="-"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
