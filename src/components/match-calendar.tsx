"use client";

import React from "react";
import { Match } from "@/lib/types";
import { TEAMS } from "@/lib/constants";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface MatchCalendarProps {
  matches: Match[];
  round: number;
  totalRounds: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MatchCalendar({ matches, round, totalRounds, onPrev, onNext }: MatchCalendarProps) {
  const getTeamInfo = (name: string) => TEAMS[name] || {
    abrev: name.substring(0, 3).toUpperCase(),
    nome: name,
    escudo: "https://logodetimes.com/imagens/generico-256.png"
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-8">
      {/* Round Selector Premium */}
      <div className="flex items-center justify-between glass-card p-4 rounded-3xl shadow-lg border-none">
        <Button variant="ghost" size="icon" onClick={onPrev} disabled={round <= 1} className="rounded-2xl hover:bg-primary/10">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center">
          <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase mb-1 px-3">Brasileirão Elite</Badge>
          <div className="flex items-baseline gap-2">
             <span className="text-xs font-bold text-muted-foreground uppercase">Rodada</span>
             <span className="text-2xl font-black italic text-primary leading-none">#{round}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onNext} disabled={round >= totalRounds} className="rounded-2xl hover:bg-primary/10">
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map(match => {
          const home = getTeamInfo(match.homeTeam);
          const away = getTeamInfo(match.awayTeam);
          const isFinished = match.status === 'FINISHED';
          const isLive = match.status === 'LIVE' || match.status === 'PAUSED';

          return (
            <Card key={match.id} className="glass-card border-none rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group">
              <CardContent className="p-0">
                {/* Status Bar */}
                <div className="px-6 py-3 bg-muted/30 flex justify-between items-center border-b border-white/10">
                   <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground">{formatDate(match.utcDate)}</span>
                   </div>
                   <Badge className={cn(
                     "rounded-full px-3 text-[8px] font-black uppercase border-none",
                     isLive ? "bg-destructive text-white animate-pulse" : "bg-primary/10 text-primary"
                   )}>
                      {isFinished ? 'Finalizado' : isLive ? 'Ao Vivo' : 'Agendado'}
                   </Badge>
                </div>

                {/* Conflict Area */}
                <div className="p-8 flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                    <img src={home.escudo} alt={home.nome} className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex flex-col">
                       <span className="text-lg font-black italic uppercase leading-tight">{home.abrev}</span>
                       <span className="text-[9px] font-bold text-muted-foreground uppercase line-clamp-1">{home.nome}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center w-1/3">
                    {match.homeScore !== undefined ? (
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-black italic text-primary">{match.homeScore}</span>
                        <div className="h-8 w-[2px] bg-muted/50 rotate-12" />
                        <span className="text-4xl font-black italic text-primary">{match.awayScore}</span>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-full sports-gradient flex items-center justify-center text-white shadow-lg animate-float">
                        <span className="text-xs font-black italic">VS</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                    <img src={away.escudo} alt={away.nome} className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex flex-col">
                       <span className="text-lg font-black italic uppercase leading-tight">{away.abrev}</span>
                       <span className="text-[9px] font-bold text-muted-foreground uppercase line-clamp-1">{away.nome}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="px-6 py-4 bg-primary/5 flex justify-center items-center gap-2">
                   <Clock className="h-3 w-3 text-primary/40" />
                   <span className="text-[10px] font-black italic text-primary/60">{formatTime(match.utcDate)} • ESTÁDIO NACIONAL</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}