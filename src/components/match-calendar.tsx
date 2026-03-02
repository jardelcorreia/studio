
"use client";

import React from "react";
import { Match } from "@/lib/types";
import { TEAMS } from "@/lib/constants";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { CalendarDays, Clock, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-card p-4 rounded-lg shadow-sm">
        <button 
          onClick={onPrev} 
          disabled={round <= 1}
          className="p-2 hover:bg-muted rounded-full disabled:opacity-30"
        >
          <CalendarDays className="h-5 w-5 rotate-180" />
        </button>
        <div className="text-center">
          <h3 className="font-bold text-lg">Rodada {round}</h3>
          <p className="text-xs text-muted-foreground">Brasileirão Série A</p>
        </div>
        <button 
          onClick={onNext} 
          disabled={round >= totalRounds}
          className="p-2 hover:bg-muted rounded-full disabled:opacity-30"
        >
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map(match => {
          const home = getTeamInfo(match.homeTeam);
          const away = getTeamInfo(match.awayTeam);
          const isFinished = match.status === 'FINISHED';
          const isLive = match.status === 'LIVE' || match.status === 'PAUSED';

          return (
            <Card key={match.id} className="hover:shadow-md transition-shadow group overflow-hidden">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-muted">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(match.utcDate)}
                  </span>
                  <Badge variant={isLive ? "destructive" : "secondary"} className={cn("text-[9px] h-5 px-2", isLive && "animate-pulse")}>
                    {match.status === 'FINISHED' ? 'Encerrado' : isLive ? 'Ao Vivo' : 'Agendado'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between flex-1">
                  <div className="flex flex-col items-center w-1/3 text-center">
                    <img src={home.escudo} alt={home.nome} className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm leading-tight">{home.abrev}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{home.nome}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center w-1/3">
                    {match.homeScore !== undefined ? (
                      <div className="flex items-center gap-2 text-2xl font-black">
                        <span>{match.homeScore}</span>
                        <span className="text-muted-foreground font-light text-xl">:</span>
                        <span>{match.awayScore}</span>
                      </div>
                    ) : (
                      <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground">VS</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center w-1/3 text-center">
                    <img src={away.escudo} alt={away.nome} className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm leading-tight">{away.abrev}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{away.nome}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-muted flex justify-center items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(match.utcDate)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
