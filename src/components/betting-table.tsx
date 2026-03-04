
"use client";

import React, { useState, useEffect, useRef } from "react";
import { TEAMS } from "@/lib/constants";
import { Prediction, PlayerPredictions, Match } from "@/lib/types";
import { Input } from "./ui/input";
import { cn, cleanTeamName } from "@/lib/utils";
import { Trophy, Swords, Share2, Camera, X, AlertCircle, Download, Loader2 } from "lucide-react";
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
  const [isDownloading, setIsDownloading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const COL_WIDTH = 140;
  const CONFRONTO_WIDTH = 120;
  const BASE_WIDTH = CONFRONTO_WIDTH + sortedUsers.length * COL_WIDTH;
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

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setIsDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      // Captura o card OCULTO (que não tem escala aplicada) para evitar desalinhamentos
      const cardCanvas = await html2canvas(captureRef.current, {
        backgroundColor: "#020617",
        scale: 2,
        useCORS: true,
        logging: false,
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
      });

      // Canvas quadrado para compartilhamento (1:1)
      const size = Math.max(cardCanvas.width, cardCanvas.height);
      const squareCanvas = document.createElement("canvas");
      squareCanvas.width = size;
      squareCanvas.height = size;
      const ctx = squareCanvas.getContext("2d")!;
      
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, size, size);

      const offsetX = Math.round((size - cardCanvas.width) / 2);
      const offsetY = Math.round((size - cardCanvas.height) / 2);
      ctx.drawImage(cardCanvas, offsetX, offsetY);

      const link = document.createElement("a");
      link.download = `${roundName.replace(/\s+/g, "-").toLowerCase()}-alphabet.png`;
      link.href = squareCanvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Erro ao gerar imagem:", e);
    } finally {
      setIsDownloading(false);
    }
  };

  const scaledWidth = BASE_WIDTH * cardScale;
  const scaledHeight = BASE_HEIGHT * cardScale;

  const cardJSX = (
    <>
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[80px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 flex justify-between items-center mb-1 border-b border-white/10 pb-1">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-accent rounded-md flex items-center justify-center -rotate-6 shadow-lg shadow-accent/20">
            <Trophy className="h-4 w-4 text-black" />
          </div>
          <div className="flex flex-col">
            <div className="text-[18px] font-black italic uppercase text-white leading-none tracking-tighter">
              AlphaBet
            </div>
            <div className="text-[8px] font-bold text-accent uppercase tracking-[0.3em] opacity-80 leading-none mt-0.5">
              League 2026
            </div>
          </div>
        </div>
        <div className="bg-white/5 px-2 py-0.5 rounded border border-white/10">
          <span className="text-[11px] font-black text-accent italic leading-none">
            {roundName.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        <div
          className="gap-1 mb-1 px-1"
          style={{ display: "grid", gridTemplateColumns: `${CONFRONTO_WIDTH}px repeat(${sortedUsers.length}, 1fr)` }}
        >
          <div className="text-[8px] font-black uppercase text-white/20 italic">CONFRONTO</div>
          {sortedUsers.map((u) => (
            <div
              key={u.id}
              className="text-center text-[13px] font-black uppercase text-accent tracking-tighter truncate px-1"
            >
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
            const isInvalid = match?.isValidForPoints === false;

            return (
              <div
                key={idx}
                className="items-center bg-white/[0.02] py-0.5 px-1.5 rounded border border-white/[0.02] h-[calc(100%/10.8)]"
                style={{ display: "grid", gridTemplateColumns: `${CONFRONTO_WIDTH}px repeat(${sortedUsers.length}, 1fr)` }}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[7px] font-black text-white/10 italic tabular-nums">
                    #{idx + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[12px] font-black italic uppercase truncate tracking-tighter",
                      isInvalid ? "text-white/20" : "text-white"
                    )}
                  >
                    {abrevDesc}
                  </span>
                </div>

                {sortedUsers.map((u) => (
                  <div key={u.id} className="flex justify-center h-full items-center px-0.5">
                    <div className="bg-black/40 w-full py-0.5 rounded border border-white/5 flex items-center justify-center">
                      <span
                        className={cn(
                          "text-[15px] font-black leading-none tabular-nums tracking-tighter",
                          isInvalid ? "text-white/20" : "text-white"
                        )}
                      >
                        {predictions[u.id]?.[idx]?.homeScore || "0"}-
                        {predictions[u.id]?.[idx]?.awayScore || "0"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 flex justify-center items-center mt-2 pt-1 border-t border-white/5">
        <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.5em]">
          AlphaBet League • Visão de Dados Técnica
        </span>
      </div>
    </>
  );

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Versão VISÍVEL (Escalada para o Dialog) */}
      <div style={{ width: scaledWidth, height: scaledHeight, overflow: "hidden", flexShrink: 0 }}>
        <div
          className="bg-[#020617] p-3 flex flex-col relative shadow-2xl overflow-hidden border border-white/10 rounded-2xl"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `scale(${cardScale})`,
            transformOrigin: "top left",
          }}
        >
          {cardJSX}
        </div>
      </div>

      {/* Versão de CAPTURA (Escondida e Sem Escala) */}
      <div style={{ position: "fixed", top: -9999, left: -9999, width: BASE_WIDTH, height: BASE_HEIGHT, pointerEvents: "none" }}>
        <div
          ref={captureRef}
          className="bg-[#020617] p-3 flex flex-col relative overflow-hidden border border-white/10 rounded-2xl"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
          }}
        >
          {cardJSX}
        </div>
      </div>

      <Button
        onClick={handleDownload}
        disabled={isDownloading}
        size="sm"
        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 font-black italic uppercase rounded-full gap-2 transition-all"
      >
        {isDownloading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
          : <><Download className="h-4 w-4" /> Baixar Card</>
        }
      </Button>
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
                        <div key={u.id} className={cn("flex flex-col items-center min-w-[60px] md:min-w-[80px] relative transition-all", isCurrent && "scale-105 z-10")}>
                          <div className="flex items-center gap-1 mb-1 px-1 w-full justify-center">
                            <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-tighter truncate text-center w-full", isCurrent ? "text-primary font-bold" : "text-muted-foreground/50")}>
                              {u.username}
                            </span>
                          </div>
                          <div className={cn("flex items-center justify-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-xl border-2 transition-all duration-300",
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
                    <Input type="number" value={results[idx].awayScore} onChange={(e) => setResult(idx, 'away', e.target.value)} className="w-8 h-8 md:w-9 md:h-9 text-center rounded-xl p-0 font-black text-sm border-primary/10 bg-white dark:bg-card shadow-inner focus:ring-primary/20" disabled={!isAdmin} placeholder="-" />
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
