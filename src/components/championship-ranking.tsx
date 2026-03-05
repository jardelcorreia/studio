
"use client";

import React, { useMemo, useState } from "react";
import { ChampionshipWinner, PlayerOverallStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Trophy, Medal, Star, TrendingUp, TrendingDown, Settings2, CheckCircle2, Save, Loader2, History, Clock, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
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
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

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
      const aPointsTotal = a.wins + a.draws + a.points + Math.abs(a.balance);
      const bPointsTotal = b.wins + b.draws + b.points + Math.abs(b.balance);
      
      if (aPointsTotal === 0 && bPointsTotal === 0) {
        return a.name.localeCompare(b.name);
      }

      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
      if (b.points !== a.points) return b.points - a.points;
      if (b.balance !== a.balance) return b.balance - a.balance;
      return a.name.localeCompare(b.name);
    });
  }, [roundWinners, allUsers]);

  const renderRoundItem = (rw: ChampionshipWinner, idx: number) => {
    const hasWinners = rw.winners && rw.winners.trim() !== "";
    const winnersList = rw.winners ? rw.winners.split(",").map(s => s.trim()) : [];

    return (
      <div key={idx} className="group relative flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all duration-300">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-transform group-hover:rotate-3",
            hasWinners ? "bg-primary text-white shadow-primary/10" : "bg-muted text-muted-foreground"
          )}>
            {rw.round}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest flex items-center gap-1">
              {hasWinners ? <Trophy className="h-2 w-2 text-accent" /> : <Clock className="h-2 w-2" />}
              {hasWinners ? "Campeão" : "Aguardando"}
            </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {hasWinners ? (
                winnersList.map((w, i) => (
                  <span key={i} className="text-[11px] font-black italic uppercase text-primary truncate max-w-[120px]">
                    {w}{i < winnersList.length - 1 ? "," : ""}
                  </span>
                ))
              ) : (
                <span className="text-[10px] font-medium italic text-muted-foreground/40">Pendente</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end shrink-0 ml-3">
          <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest">Valor</span>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black text-primary/60">R$</span>
            <Input 
              type="number" value={rw.value} 
              onChange={(e) => updateValue(idx, parseFloat(e.target.value) || 0)}
              className="w-10 h-5 p-0 text-right bg-transparent border-none font-black text-xs focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={!isAdmin}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
           {overallStats.map((player, index) => {
              const hasActivity = player.wins > 0 || player.draws > 0 || player.points > 0 || player.balance !== 0;
              const isFirst = index === 0 && hasActivity;
              const isPositive = player.balance >= 0;

              return (
                <Card key={player.id} className={cn(
                  "glass-card border-none rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden transition-all duration-500 group relative",
                  isFirst && "ring-2 ring-accent ring-offset-2 sm:ring-offset-4 ring-offset-background shadow-2xl shadow-accent/20"
                )}>
                  <CardContent className="p-0">
                     <div className={cn(
                       "p-6 sm:p-8 flex flex-col items-center gap-4 relative overflow-hidden text-center",
                       isFirst ? "bg-accent/10" : "bg-primary/[0.03]"
                     )}>
                        {isFirst && (
                          <Trophy className="absolute -top-4 -right-4 h-16 sm:h-24 w-16 sm:w-24 opacity-[0.08] text-accent transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" />
                        )}

                        <div className="relative shrink-0">
                           <div className={cn(
                             "relative h-24 w-24 sm:h-32 sm:w-32 flex items-center justify-center rounded-3xl shadow-inner transition-all duration-500 group-hover:scale-105",
                             isFirst ? "sports-gradient shadow-lg" : "bg-primary/5 border border-primary/10"
                           )}>
                              <Avatar className={cn(
                                 "h-[88px] w-[88px] sm:h-[120px] sm:w-[120px] rounded-full border-4 border-background shadow-xl bg-muted flex items-center justify-center transition-all",
                                 isFirst && "border-white/40"
                              )}>
                                <AvatarImage src={player.photoUrl || undefined} className="object-cover" />
                                <AvatarFallback className={cn(
                                  "text-3xl sm:text-5xl font-black italic w-full h-full flex items-center justify-center",
                                  isFirst ? "bg-white text-primary" : "bg-primary/10 text-primary"
                                )}>
                                  {player.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                           </div>
                           
                           {hasActivity && (
                             <div className={cn(
                               "absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-8 w-8 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shadow-xl border-4 border-background z-20 transition-transform group-hover:rotate-12",
                               index === 0 ? "bg-accent" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-muted"
                             )}>
                                {index === 0 ? <Trophy className="h-4 w-4 sm:h-7 sm:w-7 text-accent-foreground" /> : 
                                 index === 1 ? <Medal className="h-4 w-4 sm:h-7 sm:w-7 text-slate-600" /> :
                                 <Star className="h-3 w-3 sm:h-6 sm:w-6 text-white" />}
                             </div>
                           )}
                        </div>

                        <div className="flex flex-col items-center space-y-1 sm:space-y-2 relative z-10 w-full">
                          <h3 className="text-xl sm:text-2xl font-black italic uppercase text-primary leading-none tracking-tighter truncate w-full">{player.name}</h3>
                          <Badge variant="outline" className={cn(
                             "rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1 border-primary/10 bg-white/50 dark:bg-black/20 whitespace-nowrap",
                             isFirst ? "text-accent border-accent/20" : "text-muted-foreground"
                          )}>
                             {isFirst ? "Líder Geral" : `Posição ${index + 1}`}
                          </Badge>
                        </div>
                     </div>

                     <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col items-center">
                             <span className="text-2xl sm:text-3xl font-black italic text-primary leading-none">{player.wins}</span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Vitórias</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-xl sm:text-2xl font-black italic text-foreground leading-none">{player.draws}</span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Empates</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-xl sm:text-2xl font-black italic text-foreground leading-none">{player.points}</span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pontos</span>
                          </div>
                        </div>

                        <div className={cn(
                          "p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] border border-dashed flex items-center justify-between transition-colors",
                          isPositive ? "bg-secondary/5 border-secondary/20" : "bg-destructive/5 border-destructive/20"
                        )}>
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                               isPositive ? "bg-secondary text-white" : "bg-destructive text-white"
                             )}>
                                {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                             </div>
                             <div className="flex flex-col items-start">
                                <span className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo Financeiro</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className={cn(
                               "text-xl sm:text-2xl font-black italic leading-none",
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
          <Card className="glass-card border-none rounded-[2rem] overflow-hidden sticky top-24 shadow-xl">
             <CardHeader className="p-6 border-b border-primary/5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <History className="h-5 w-5 text-primary" />
                      <div>
                         <CardTitle className="text-sm font-black italic uppercase text-primary leading-tight">Histórico</CardTitle>
                         <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Registro de Rodadas</p>
                      </div>
                   </div>
                   {isAdmin && (
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => onSave?.()} 
                       disabled={isSaving}
                       className="rounded-xl h-8 px-3 text-[10px] font-black uppercase italic gap-2 text-primary hover:bg-primary/10"
                     >
                       {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                       Salvar
                     </Button>
                   )}
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                   <AccordionItem value="turno1" className="border-none">
                      <AccordionTrigger className="px-6 hover:no-underline hover:bg-primary/5 py-4 transition-colors">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="rounded-full text-[11px] font-black uppercase text-primary border-primary/10 bg-primary/5 px-4 h-7">
                             1º Turno (R1 a R19)
                           </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-1 space-y-2">
                        {roundWinners.slice(0, 19).map((rw, idx) => renderRoundItem(rw, idx))}
                      </AccordionContent>
                   </AccordionItem>

                   <AccordionItem value="turno2" className="border-none">
                      <AccordionTrigger className="px-6 hover:no-underline hover:bg-primary/5 py-4 transition-colors">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="rounded-full text-[11px] font-black uppercase text-primary border-primary/10 bg-primary/5 px-4 h-7">
                             2º Turno (R20 a R38)
                           </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-1 space-y-2">
                        {roundWinners.slice(19, 38).map((rw, idx) => renderRoundItem(rw, idx + 19))}
                      </AccordionContent>
                   </AccordionItem>
                </Accordion>
                <div className="px-6 py-4 border-t border-primary/5">
                   <p className="text-[10px] font-bold text-muted-foreground/60 uppercase text-center tracking-tighter">
                      Atualização automática via resultados oficiais
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>

      {isAdmin && (
        <Collapsible
          open={isAdminSettingsOpen}
          onOpenChange={setIsAdminSettingsOpen}
          className="w-full pt-4"
        >
          <Card className="glass-card border-none rounded-[2rem] overflow-hidden border-l-4 border-l-primary shadow-lg">
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-primary/5 pb-2 cursor-pointer hover:bg-primary/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-black italic uppercase text-primary">Configurações de Valores (Admin)</CardTitle>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-primary transition-transform duration-300", isAdminSettingsOpen && "rotate-180")} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">1º Turno (R1 a R19)</label>
                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                      <span className="text-xs font-black text-primary">R$</span>
                      <input 
                        type="number" 
                        value={turn1Value} 
                        onChange={(e) => setTurn1Value(parseFloat(e.target.value) || 0)}
                        className="border-none bg-transparent font-black text-lg focus:outline-none w-full h-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">2º Turno (R20 a R38)</label>
                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-2xl border border-primary/5">
                      <span className="text-xs font-black text-primary">R$</span>
                      <input 
                        type="number" 
                        value={turn2Value} 
                        onChange={(e) => setTurn2Value(parseFloat(e.target.value) || 0)}
                        className="border-none bg-transparent font-black text-lg focus:outline-none w-full h-8"
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
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
