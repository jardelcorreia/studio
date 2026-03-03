"use client";

import React from "react";
import { Match, Prediction } from "@/lib/types";
import { TEAMS } from "@/lib/constants";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { CalendarDays, Clock, ChevronLeft, ChevronRight, Save, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { cn, cleanTeamName } from "@/lib/utils";
import { Button } from "./ui/button";

interface MatchCalendarProps {
  matches: Match[];
  round: number;
  totalRounds: number;
  predictions: Prediction[];
  setPrediction: (matchIndex: number, type: 'home' | 'away', value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function MatchCalendar({ 
  matches, 
  round, 
  totalRounds, 
  predictions,
  setPrediction,
  onPrev, 
  onNext,
  onSave,
  isSaving
}: MatchCalendarProps) {
  
  const getTeamInfo = (name: string) => {
    if (TEAMS[name]) return TEAMS[name];
    
    const cleaned = cleanTeamName(name);

    return {
      abrev: cleaned.substring(0, 3).toUpperCase(),
      nome: cleaned,
      escudo: "https://logodetimes.com/imagens/generico-256.png"
    };
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const handleInputChange = (idx: number, type: 'home' | 'away', value: string) => {
    const cleanValue = value.slice(-1);
    setPrediction(idx, type, cleanValue);

    if (cleanValue !== "") {
      if (type === 'home') {
        const nextInput = document.getElementById(`cal-input-${idx}-away`);
        nextInput?.focus();
      } else {
        const nextInput = document.getElementById(`cal-input-${idx + 1}-home`);
        nextInput?.focus();
      }
    }
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
        {matches.map((match, idx) => {
          const home = getTeamInfo(match.homeTeam);
          const away = getTeamInfo(match.awayTeam);
          const isFinished = match.status === 'finished';
          const isLive = match.status === 'live';
          const isCancelled = match.status === 'cancelled';
          const currentPred = predictions[idx] || { homeScore: "", awayScore: "" };
          const isOutOfWindow = match.isValidForPoints === false;

          return (
            <Card key={match.id} className={cn(
              "glass-card border-none rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group relative",
              isOutOfWindow && "border-2 border-destructive/20 opacity-90"
            )}>
              <CardContent className="p-0">
                {/* Status Bar */}
                <div className="px-6 py-3 bg-muted/30 flex justify-between items-center border-b border-white/10">
                   <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[9px] font-black uppercase text-muted-foreground">{formatDate(match.utcDate)}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      {isOutOfWindow && (
                        <Badge variant="destructive" className="rounded-full px-3 text-[8px] font-black uppercase border-none animate-pulse">
                          Fora da Janela
                        </Badge>
                      )}
                      <Badge className={cn(
                        "rounded-full px-3 text-[8px] font-black uppercase border-none",
                        isLive ? "bg-destructive text-white animate-pulse" : 
                        isFinished ? "bg-primary/20 text-primary" : 
                        isCancelled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {isFinished ? 'Finalizado' : isLive ? 'Ao Vivo' : isCancelled ? 'Adiado/Cancelado' : 'Agendado'}
                      </Badge>
                   </div>
                </div>

                {/* Conflict Area */}
                <div className="p-8 flex items-center justify-between gap-4">
                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                    <img src={home.escudo} alt={home.nome} className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex flex-col">
                       <span className="text-sm font-black italic uppercase leading-tight line-clamp-1">{home.nome}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center w-1/3">
                    {isFinished ? (
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-black italic text-primary">{match.homeScore}</span>
                        <div className="h-8 w-[2px] bg-muted/50 rotate-12" />
                        <span className="text-4xl font-black italic text-primary">{match.awayScore}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                         <div className="text-[8px] font-black uppercase text-muted-foreground mb-1">Seu Palpite</div>
                         <div className="flex items-center gap-2">
                            <Input
                              id={`cal-input-${idx}-home`}
                              type="number"
                              value={currentPred.homeScore}
                              onChange={(e) => handleInputChange(idx, 'home', e.target.value)}
                              className="w-10 h-10 text-center rounded-xl p-0 font-black text-lg border-primary/20 shadow-inner"
                              disabled={isFinished || isCancelled}
                            />
                            <span className="font-black text-primary/40 italic text-xs">X</span>
                            <Input
                              id={`cal-input-${idx}-away`}
                              type="number"
                              value={currentPred.awayScore}
                              onChange={(e) => handleInputChange(idx, 'away', e.target.value)}
                              className="w-10 h-10 text-center rounded-xl p-0 font-black text-lg border-primary/20 shadow-inner"
                              disabled={isFinished || isCancelled}
                            />
                         </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 w-1/3 text-center">
                    <img src={away.escudo} alt={away.nome} className="w-16 h-16 object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex flex-col">
                       <span className="text-sm font-black italic uppercase leading-tight line-clamp-1">{away.nome}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className={cn(
                  "px-6 py-4 flex flex-col items-center gap-1",
                  isOutOfWindow ? "bg-destructive/5" : "bg-primary/5"
                )}>
                   <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-primary/40" />
                      <span className="text-[10px] font-black italic text-primary/60">
                        {formatTime(match.utcDate)} • {isFinished ? "RESULTADO FINAL" : isCancelled ? "PARTIDA ADIADA" : "AGUARDANDO PALPITE"}
                      </span>
                   </div>
                   {isOutOfWindow && (
                     <div className="flex items-center gap-1 text-destructive font-black text-[9px] uppercase tracking-wider text-center px-4">
                        <AlertTriangle className="h-3 w-3" /> Regra da Janela: Jogo fora da janela de validade da rodada
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-8">
        <Button 
          size="lg" 
          onClick={onSave} 
          disabled={isSaving}
          className="h-16 px-12 rounded-3xl gap-4 font-black italic uppercase text-xl sports-gradient shadow-2xl shadow-primary/40 hover:scale-[1.05] transition-transform active:scale-95"
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6 fill-current" />}
          {isSaving ? "Sincronizando..." : "CONFIRMAR TODOS PALPITES"}
        </Button>
      </div>
    </div>
  );
}
