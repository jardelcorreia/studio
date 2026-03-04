
"use client";

import React, { useMemo, useState } from "react";
import { ChampionshipWinner, PlayerOverallStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Trophy, Medal, Wallet, Star, TrendingUp, TrendingDown, Settings2, CheckCircle2, Save, Loader2, CalendarDays, History, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChampionshipRankingProps {
  roundWinners: ChampionshipWinner[];
  setRoundWinners: React.Dispatch<React.SetStateAction<ChampionshipWinner[]>>;
  allUsers: any[];
  isAdmin?: boolean;
  onSave?: (data?: ChampionshipWinner[]) => Promise<void>;
  isSaving?: boolean;
}

export function ChampionshipRanking({ roundWinners, setRoundWinners, allUsers, isAdmin, onSave, isSaving }: ChampionshipRankingProps) {
  const { toast } = useToast();
  const [turn1Value, setTurn1Value] = useState(6);
  const [turn2Value, setTurn2Value] = useState(6);

  const updateValue = (roundIndex: number, value: number) => {
    setRoundWinners((prev) => prev.map((rw, i) => (i === roundIndex ? { ...rw, value } : rw)));
  };

  const applyTurnValues = async () => {
    const newWinners = roundWinners.map((rw) => ({
      ...rw,
      value: rw.round <= 19 ? turn1Value : turn2Value
    }));
    
    setRoundWinners(newWinners);
    
    if (onSave) {
      await onSave(newWinners);
    }
  };

  const overallStats = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];

    const stats: Record<string, PlayerOverallStats & { id: string; photoUrl?: string }> = Object.fromEntries(
      allUsers.map((u) => [u.id, { id: u.id, name: u.username, wins: 0, draws: 0, points: 0, balance: 0, photoUrl: u.photoUrl }])
    );

    roundWinners.forEach((rw) => {
      if (rw.pointsMap) {
        allUsers.forEach(u => {
          if (stats[u.id]) {
            stats[u.id].points += rw.pointsMap?.[u.id] || 0;
          }
        });
      }

      if (!rw.winners || !rw.winners.trim()) return;
      
      const winnersList = rw.winners.split(",").map((s) => s.trim());
      const winnerIds = allUsers.filter(u => winnersList.includes(u.username)).map(u => u.id);
      
      if (winnerIds.length === 0) return;
      
      const roundValue = rw.value;
      const numPlayers = allUsers.length;

      if (winnerIds.length === 1) {
        const winnerId = winnerIds[0];
        stats[winnerId].wins += 1;
        stats[winnerId].balance += roundValue * (numPlayers - 1);
        allUsers.forEach(u => { if (u.id !== winnerId) stats[u.id].balance -= roundValue; });
      } else {
        winnerIds.forEach((wId) => { 
          stats[wId].draws += 1; 
        });
        const losers = allUsers.filter(u => !winnerIds.includes(u.id));
        const totalPot = losers.length * roundValue;
        const prizePerWinner = totalPot / winnerIds.length;
        winnerIds.forEach(wId => { stats[wId].balance += prizePerWinner; });
        losers.forEach(l => { stats[l.id].balance -= roundValue; });
      }
    });

    return Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
      if (b.points !== a.points) return b.points - a.points;
      return b.balance - a.balance;
    });
  }, [roundWinners, allUsers]);

  const renderRoundItem = (rw: ChampionshipWinner, idx: number) => {
    const hasWinners = rw.winners && rw.winners.trim() !== "";
    const winnersList = rw.winners ? rw.winners.split(",").map(s => s.trim()) : [];

    return (
      <div key={idx} className="group relative flex items-center justify-between p-4 rounded-3xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-lg transition-transform group-hover:rotate-6",
            hasWinners ? "bg-primary text-white shadow-primary/20" : "bg-muted text-muted-foreground"
          )}>
            {rw.round}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1">
              {hasWinners ? <Trophy className="h-2 w-2 text-accent" /> : <Clock className="h-2 w-2" />}
              {hasWinners ? "Campeão" : "Aguardando Resultados"}
            </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {hasWinners ? (
                winnersList.map((w, i) => (
                  <span key={i} className="text-[12px] font-black italic uppercase text-primary truncate max-w-[120px]">
                    {w}{i < winnersList.length - 1 ? "," : ""}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-medium italic text-muted-foreground/60">Rodada não finalizada</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end shrink-0 ml-4">
          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Premiação</span>
          <div className="flex items-center gap-1 group-hover:scale-110 transition-transform">
            <span className="text-[10px] font-black text-primary">R$</span>
            <Input 
              type="number" value={rw.value} 
              onChange={(e) => updateValue(idx, parseFloat(e.target.value) || 0)}
              className="w-12 h-6 p-0 text-right bg-transparent border-none font-black text-sm focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={!isAdmin}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {isAdmin && (
        <Card className="glass-card border-none rounded-[2rem] overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="bg-primary/5 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-black italic uppercase text-primary">Configurações de Valores (Admin)</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">1º Turno (R1 a R19)</label>
                <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                  <span className="text-xs font-black text-primary">R$</span>
                  <Input 
                    type="number" 
                    value={turn1Value} 
                    onChange={(e) => setTurn1Value(parseFloat(e.target.value) || 0)}
                    className="border-none bg-transparent font-black text-lg focus-visible:ring-0 h-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">2º Turno (R20 a R38)</label>
                <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                  <span className="text-xs font-black text-primary">R$</span>
                  <Input 
                    type="number" 
                    value={turn2Value} 
                    onChange={(e) => setTurn2Value(parseFloat(e.target.value) || 0)}
                    className="border-none bg-transparent font-black text-lg focus-visible:ring-0 h-8"
                  />
                </div>
              </div>
              <Button 
                onClick={applyTurnValues}
                disabled={isSaving}
                className="rounded-2xl h-12 font-black italic uppercase gap-2 shadow-lg shadow-primary/20"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {isSaving ? "Salvando..." : "Aplicar e Salvar Turnos"}
              </Button>
            </div>
            <p className="mt-4 text-[9px] font-medium text-muted-foreground italic">
              * Ao clicar em "Aplicar", todos os valores das 38 rodadas serão atualizados e salvos permanentemente no banco de dados.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
           {overallStats.map((player, index) => {
              const isFirst = index === 0;
              const isPositive = player.balance >= 0;

              return (
                <Card key={player.id} className={cn(
                  "glass-card border-none rounded-[2.5rem] overflow-hidden transition-all duration-500 group relative",
                  isFirst && "ring-2 ring-accent ring-offset-4 ring-offset-background shadow-2xl shadow-accent/20"
                )}>
                  <CardContent className="p-0">
                     <div className={cn(
                       "p-8 flex flex-col items-center text-center relative overflow-hidden",
                       isFirst ? "bg-accent/10" : "bg-primary/[0.03]"
                     )}>
                        <Trophy className={cn(
                          "absolute -top-4 -right-4 h-24 w-24 opacity-[0.03] transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110",
                          isFirst ? "text-accent opacity-[0.08]" : "text-primary"
                        )} />

                        <div className="relative mb-6">
                           <div className={cn(
                             "relative h-24 w-24 flex items-center justify-center rounded-[2.25rem] shadow-inner transition-all duration-500 group-hover:scale-105",
                             isFirst ? "sports-gradient shadow-lg" : "bg-primary/5 border border-primary/10"
                           )}>
                              <Avatar className={cn(
                                 "h-[82px] w-[82px] rounded-full border-4 border-background shadow-xl bg-muted flex items-center justify-center transition-all",
                                 isFirst && "border-white/40"
                              )}>
                                <AvatarImage src={player.photoUrl || undefined} className="object-cover" />
                                <AvatarFallback className={cn(
                                  "text-3xl font-black italic w-full h-full flex items-center justify-center",
                                  isFirst ? "bg-white text-primary" : "bg-primary/10 text-primary"
                                )}>
                                  {player.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                           </div>
                           
                           <div className={cn(
                             "absolute -top-2 -right-2 h-10 w-10 rounded-full flex items-center justify-center shadow-xl border-4 border-background z-20 transition-transform group-hover:rotate-12",
                             index === 0 ? "bg-accent" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-muted"
                           )}>
                              {index === 0 ? <Trophy className="h-5 w-5 text-accent-foreground" /> : 
                               index === 1 ? <Medal className="h-5 w-5 text-slate-600" /> :
                               <Star className="h-4 w-4 text-white" />}
                           </div>
                        </div>

                        <div className="space-y-1 relative z-10">
                          <h3 className="text-2xl font-black italic uppercase text-primary leading-none tracking-tighter">{player.name}</h3>
                          <Badge variant="outline" className={cn(
                             "rounded-full text-[9px] font-black uppercase tracking-[0.2em] px-4 py-0.5 border-primary/10 bg-white/50 dark:bg-black/20",
                             isFirst ? "text-accent border-accent/20" : "text-muted-foreground"
                          )}>
                             {isFirst ? "Líder Geral" : `Top ${index + 1}`}
                          </Badge>
                        </div>
                     </div>

                     <div className="p-8 space-y-8">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col items-center">
                             <span className="text-3xl font-black italic text-primary leading-none">{player.wins}</span>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Vitórias</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-xl font-black italic text-foreground leading-none">{player.draws}</span>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Empates</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-xl font-black italic text-foreground leading-none">{player.points}</span>
                             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pontos</span>
                          </div>
                        </div>

                        <div className={cn(
                          "p-5 rounded-3xl border border-dashed flex items-center justify-between transition-colors",
                          isPositive ? "bg-secondary/5 border-secondary/20" : "bg-destructive/5 border-destructive/20"
                        )}>
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                               isPositive ? "bg-secondary text-white" : "bg-destructive text-white"
                             )}>
                                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Saldo Financeiro</span>
                                <span className="text-[10px] font-bold uppercase italic opacity-60">Resultados</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className={cn(
                               "text-2xl font-black italic leading-none",
                               isPositive ? "text-secondary" : "text-destructive"
                             )}>
                                R$ {player.balance.toFixed(2)}
                             </span>
                          </div>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              );
           })}
        </div>

        <div className="lg:col-span-4">
          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden sticky top-24 shadow-2xl">
             <CardHeader className="bg-primary p-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white -rotate-6">
                         <History className="h-6 w-6" />
                      </div>
                      <div>
                         <CardTitle className="text-white font-black italic uppercase text-lg leading-tight">Histórico</CardTitle>
                         <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Registro de Rodadas</p>
                      </div>
                   </div>
                   {isAdmin && (
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       onClick={() => onSave?.()} 
                       disabled={isSaving}
                       className="text-white hover:bg-white/10 rounded-xl"
                     >
                       {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                     </Button>
                   )}
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <ScrollArea className="h-[600px] no-scrollbar">
                   <div className="p-6 space-y-8">
                      {/* 1º Turno */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                          <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5">
                            1º Turno (R1 a R19)
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {roundWinners.slice(0, 19).map((rw, idx) => renderRoundItem(rw, idx))}
                        </div>
                      </div>

                      {/* 2º Turno */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-primary/10 pb-2">
                          <Badge variant="outline" className="rounded-full text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5">
                            2º Turno (R20 a R38)
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {roundWinners.slice(19, 38).map((rw, idx) => renderRoundItem(rw, idx + 19))}
                        </div>
                      </div>
                   </div>
                </ScrollArea>
                <div className="p-6 bg-primary/5 border-t border-dashed">
                   <p className="text-[9px] font-bold text-muted-foreground uppercase text-center leading-relaxed">
                      Os vencedores e saldos são atualizados automaticamente ao preencher os resultados oficiais.
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
