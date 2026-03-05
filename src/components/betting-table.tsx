"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { TEAMS } from "@/lib/constants";
import { Prediction, PlayerPredictions, Match } from "@/lib/types";
import { Input } from "./ui/input";
import { cn, cleanTeamName } from "@/lib/utils";
import { Trophy, Swords, Share2, Camera, X, AlertCircle } from "lucide-react";
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

function RoundCardView({
  roundName,
  matches,
  predictions,
  sortedUsers,
  getTeamAbrev,
}: {
  roundName: string;
  matches: Match[];
  predictions: PlayerPredictions;
  sortedUsers: any[];
  getTeamAbrev: (name: string) => string;
}) {
  const [cardScale, setCardScale] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const COL_WIDTH = 90; 
  const CONFRONTO_WIDTH = 105; 
  const BASE_WIDTH = CONFRONTO_WIDTH + (sortedUsers.length * COL_WIDTH) + 40;
  const BASE_HEIGHT = 580;

  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === "undefined") return;
      const dialogWidth = Math.min(window.innerWidth * 0.95, 700);
      const availableWidth = dialogWidth - 32;
      const newScale = Math.min(1, availableWidth / BASE_WIDTH);
      setCardScale(newScale);
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [BASE_WIDTH]);

  const scaledWidth = BASE_WIDTH * cardScale;
  const scaledHeight = BASE_HEIGHT * cardScale;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden", flexShrink: 0 }}>
        <div
          ref={cardRef}
          className="bg-[#020617] p-3 flex flex-col relative shadow-2xl overflow-hidden border border-white/10 rounded-2xl"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `scale(${cardScale})`,
            transformOrigin: "top left",
          }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[80px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[80px] rounded-full" />
          </div>

          <div className="relative z-10 flex justify-between items-center mb-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 relative rounded-md overflow-hidden shadow-lg border border-primary/5 -rotate-6 bg-gradient-to-br from-white to-blue-50 p-1 flex items-center justify-center">
                <Image 
                  src="/icons/android-chrome-512x512.png?v=2" 
                  alt="AlphaBet Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
              <div className="h-8 flex flex-col justify-center">
                <div className="text-[20px] font-black italic uppercase text-white tracking-tighter" style={{ lineHeight: '20px' }}>
                  AlphaBet
                </div>
                <div className="text-[9px] font-bold text-accent uppercase tracking-[0.3em] opacity-80 mt-1" style={{ lineHeight: '8px' }}>
                  League 2026
                </div>
              </div>
            </div>
            <div className="bg-white/5 px-3 h-8 rounded border border-white/10 text-center">
              <span className="text-[12px] font-black text-accent italic uppercase" style={{ lineHeight: '30px' }}>
                {roundName}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center mb-1 px-2 h-6">
              <div style={{ width: CONFRONTO_WIDTH, minWidth: CONFRONTO_WIDTH, maxWidth: CONFRONTO_WIDTH, flexShrink: 0 }} className="text-[9px] font-black uppercase text-white/20 italic h-full">
                <span style={{ lineHeight: '24px' }} className="block w-full">CONFRONTO</span>
              </div>
              {sortedUsers.map((u) => (
                <div
                  key={u.id}
                  style={{ width: COL_WIDTH, minWidth: COL_WIDTH, maxWidth: COL_WIDTH, flexShrink: 0 }}
                  className="flex justify-center items-center text-center text-[12px] font-black uppercase text-accent px-1 h-full truncate"
                >
                  <span style={{ lineHeight: '24px' }} className="block w-full">{u.username}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 flex flex-col justify-between py-1">
              {Array.from({ length: 10 }).map((_, idx) => {
                const match = matches[idx];
                const homeAbrev = match ? getTeamAbrev(match.homeTeam) : "---";
                const awayAbrev = match ? getTeamAbrev(match.awayTeam) : "---";
                const abrevDesc = `${homeAbrev} x ${awayAbrev}`;
                const isInvalid = match?.isValidForPoints === false;

                return (
                  <div
                    key={idx}
                    className="flex items-center bg-white/[0.03] px-2 rounded-xl border border-white/[0.02]"
                    style={{ height: 44 }}
                  >
                    <div style={{ width: CONFRONTO_WIDTH, minWidth: CONFRONTO_WIDTH, maxWidth: CONFRONTO_WIDTH, flexShrink: 0 }} className="flex gap-1.5 pr-2 h-full">
                      <span className="text-[7px] font-black text-white/10 italic tabular-nums" style={{ lineHeight: '42px' }}>
                        #{idx + 1}
                      </span>
                      <div className="flex-1 overflow-hidden h-full">
                        <span
                          className={cn(
                            "block text-[13px] font-black italic uppercase truncate tracking-tighter",
                            isInvalid ? "text-white/20" : "text-white"
                          )}
                          style={{ lineHeight: '42px' }}
                        >
                          {abrevDesc}
                        </span>
                      </div>
                    </div>

                    {sortedUsers.map((u) => (
                      <div key={u.id} style={{ width: COL_WIDTH, minWidth: COL_WIDTH, maxWidth: COL_WIDTH, flexShrink: 0 }} className="px-1 h-8">
                        <div className="bg-black/60 w-full h-full rounded-xl border border-white/5 text-center overflow-hidden">
                          <div
                            className={cn("w-full h-full whitespace-nowrap", isInvalid ? "text-white/20" : "text-white")}
                            style={{ lineHeight: '30px' }}
                          >
                            <span className="text-[16px] font-black tabular-nums tracking-tighter">
                              {predictions[u.id]?.[idx]?.homeScore || "0"}
                            </span>
                            <span className="text-[12px] font-black opacity-30 mx-1">-</span>
                            <span className="text-[16px] font-black tabular-nums tracking-tighter">
                              {predictions[u.id]?.[idx]?.awayScore || "0"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex justify-center items-center mt-2 pt-2 border-t border-white/5">
            <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.5em] pb-1">
              AlphaBet League • Visão de Dados Técnica
            </span>
          </div>
        </div>
      </div>
      <div className="text-center py-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
          Card pronto para print manual!
        </p>
      </div>
    </div>
  );
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
  allUsers,
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
    const team = Object.values(TEAMS).find((t) => t.nome === cleaned);
    return team ? team.abrev : cleaned.substring(0, 3).toUpperCase();
  };

  const sortedUsers = [...allUsers].sort((a, b) => (a.username || "").localeCompare(b.username || ""));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {isAdmin && (
        <div className="flex justify-end px-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-black italic uppercase rounded-full gap-2 shadow-lg shadow-accent/20">
                <Camera className="h-4 w-4" />
                Gerar Card da Rodada
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-[95vw] sm:max-w-[700px] max-h-[95vh] p-0 border-none bg-black/95 backdrop-blur-xl shadow-2xl focus:outline-none rounded-[2rem] overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Card da Rodada</DialogTitle>
                <DialogDescription>Visualização técnica dos palpites da rodada para compartilhamento.</DialogDescription>
              </DialogHeader>

              <div className="flex flex-col p-4 gap-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Share2 className="h-3 w-3 text-accent" /> AlphaBet League
                  </p>
                  <DialogClose className="text-white/40 hover:text-white transition-colors p-1">
                    <X className="h-5 w-5" />
                  </DialogClose>
                </div>

                <RoundCardView
                  roundName={roundName}
                  matches={matches}
                  predictions={predictions}
                  sortedUsers={sortedUsers}
                  getTeamAbrev={getTeamAbrev}
                />
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
              <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[60px] md:min-h-[70px]">
                <div className="md:col-span-3 px-6 py-3 flex items-center justify-between md:justify-start gap-4 border-b md:border-b-0 md:border-r border-dashed border-primary/10">
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
                        <Input type="number" value={results[idx].homeScore} onChange={(e) => setResult(idx, 'home', e.target.value)} className="w-6 h-6 text-center p-0 font-black text-xs border-none bg-transparent text-primary shadow-none focus-visible:ring-0" placeholder="-" />
                        <span className="text-[10px] font-black text-primary/30">x</span>
                        <Input type="number" value={results[idx].awayScore} onChange={(e) => setResult(idx, 'away', e.target.value)} className="w-6 h-6 text-center p-0 font-black text-xs border-none bg-transparent text-primary shadow-none focus-visible:ring-0" placeholder="-" />
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

                <div className="md:col-span-6 px-4 py-3 flex items-center overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 min-w-max md:w-full md:justify-around">
                    {sortedUsers.map(u => {
                      const isHidden = placaresOcultos && currentPlayerId !== u.id;
                      const points = getPoints(u.id, idx);
                      const isCurrent = currentPlayerId === u.id;

                      return (
                        <div key={u.id} className={cn("flex flex-col items-center min-w-[55px] md:min-w-[65px] relative transition-all", isCurrent && "scale-105 z-10")}>
                          <div className="flex items-center gap-1 mb-1 px-1 w-full justify-center">
                            <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-tighter truncate text-center w-full", isCurrent ? "text-primary font-bold" : "text-muted-foreground/50")}>
                              {u.username}
                            </span>
                          </div>
                          <div className={cn("flex items-center justify-center gap-1 px-1 py-0.5 md:py-1 rounded-xl border-2 transition-all duration-300",
                            isOutOfWindow ? "bg-muted/50 border-transparent text-muted-foreground" :
                            points === 3 ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20" :
                            points === 1 ? "bg-accent text-accent-foreground border-accent shadow-md" :
                            points === 0 ? "bg-destructive/5 border-destructive/10 text-destructive" :
                            "bg-background border-muted/30 shadow-sm"
                          )}>
                            <span className="text-[11px] md:text-[13px] font-black tabular-nums tracking-tighter">
                              {isHidden ? "?" : (predictions[u.id]?.[idx]?.homeScore || "-")}
                            </span>
                            <span className="text-[7px] md:text-[8px] font-black opacity-30 italic">x</span>
                            <span className="text-[11px] md:text-[13px] font-black tabular-nums tracking-tighter">
                              {isHidden ? "?" : (predictions[u.id]?.[idx]?.awayScore || "-")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className={cn("md:col-span-3 px-6 py-3 flex items-center justify-center md:border-l border-dashed border-primary/10 gap-3 hidden md:flex")}>
                  <div className="flex items-center gap-2 bg-muted/20 p-1 rounded-2xl border border-transparent hover:border-primary/10 transition-colors">
                    <Input type="number" value={results[idx].homeScore} onChange={(e) => setResult(idx, 'home', e.target.value)} className="w-8 h-8 md:w-9 md:h-9 text-center rounded-xl p-0 font-black text-sm border-primary/10 bg-white dark:bg-card shadow-inner focus:ring-primary/20" disabled={!isAdmin} placeholder="-" />
                    <Swords className="h-3 w-3 text-primary/20" />
                    <Input type="number" value={results[idx].awayScore} onChange={(e) => setResult(idx, 'away', e.target.value)} className="w-8 h-8 md:w-9 md:h-9 text-center rounded-xl p-0 font-black text-sm border-white/10 bg-white/5 text-white shadow-inner focus:ring-white/20" disabled={!isAdmin} placeholder="-" />
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
