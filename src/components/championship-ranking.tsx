
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
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
           {overallStats.map((player, index) => {
              const hasActivity = player.wins > 0 || player.draws > 0 || player.points > 0 || player.balance !== 0;
              const isFirst = index === 0 && hasActivity;
              const isPositive = player.balance >= 0;

              return (
                <Card key={player.id} className={cn(
                  "glass-card border-none rounded-[1.5rem] overflow-hidden transition-all duration-500 group relative",
                  isFirst && "ring-2 ring-accent ring-offset-2 ring-offset-background shadow-2xl shadow-accent/20"
                )}>
                  <CardContent className="p-0">
                     <div className={cn(
                       "p-3 sm:p-5 flex flex-row items-center justify-center gap-4 sm:gap-6 relative overflow-hidden",
                       isFirst ? "bg-accent/10" : "bg-primary/[0.03]"
                     )}>
                        {isFirst && (
                          <Trophy className="absolute -top-2 -right-2 h-16 w-16 opacity-[0.08] text-accent transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" />
                        )}

                        <div className="relative shrink-0">
                           <div className={cn(
                             "relative h-14 w-14 sm:h-20 sm:w-20 flex items-center justify-center rounded-2xl shadow-inner transition-all duration-500 group-hover:scale-105",
                             isFirst ? "sports-gradient shadow-lg" : "bg-primary/5 border border-primary/10"
                           )}>
                              <Avatar className={cn(
                                 "h-12 w-12 sm:h-[72px] sm:w-[72px] rounded-full border-2 border-background shadow-md bg-muted flex items-center justify-center transition-all",
                                 isFirst && "border-white/40"
                              )}>
                                <AvatarImage src={player.photoUrl || undefined} className="object-cover" />
                                <AvatarFallback className={cn(
                                  "text-lg sm:text-2xl font-black italic w-full h-full flex items-center justify-center",
                                  isFirst ? "bg-white text-primary" : "bg-primary/10 text-primary"
                                )}>
                                  {player.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                           </div>
                           
                           {hasActivity && (
                             <div className={cn(
                               "absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center shadow-md border-2 border-background z-20 transition-transform group-hover:rotate-12",
                               index === 0 ? "bg-accent" : index === 1 ? "bg-slate-300" : index === 2 ? "bg-amber-600" : "bg-muted"
                             )}>
                                {index === 0 ? <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent-foreground" /> : 
                                 index === 1 ? <Medal className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-600" /> :
                                 <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white" />}
                             </div>
                           )}
                        </div>

                        <div className="flex flex-col items-start space-y-0.5 relative z-10 min-w-0 max-w-[150px] sm:max-w-none">
                          <h3 className="text-sm sm:text-lg font-black italic uppercase text-primary leading-tight tracking-tighter truncate w-full">{player.name}</h3>
                          <Badge variant="outline" className={cn(
                             "rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0 h-4 border-primary/10 bg-white/50 dark:bg-black/20 whitespace-nowrap",
                             isFirst ? "text-accent border-accent/20" : "text-muted-foreground"
                          )}>
                             {isFirst ? "Líder Geral" : `Posição ${index + 1}`}
                          </Badge>
                        </div>
                     </div>

                     <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center">
                             <span className="text-lg sm:text-xl font-black italic text-primary leading-none">{player.wins}</span>
                             <span className="text-[6px] sm:text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Vits</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-base sm:text-lg font-black italic text-foreground leading-none">{player.draws}</span>
                             <span className="text-[6px] sm:text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Emps</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-base sm:text-lg font-black italic text-foreground leading-none">{player.points}</span>
                             <span className="text-[6px] sm:text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Pts</span>
                          </div>
                        </div>

                        <div className={cn(
                          "p-2 sm:p-3 rounded-xl border border-dashed flex items-center justify-between transition-colors",
                          isPositive ? "bg-secondary/5 border-secondary/20" : "bg-destructive/5 border-destructive/20"
                        )}>
                          <div className="flex items-center gap-2">
                             <div className={cn(
                               "h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center shadow-sm",
                               isPositive ? "bg-secondary text-white" : "bg-destructive text-white"
                             )}>
                                {isPositive ? <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" /> : <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />}
                             </div>
                             <span className="text-[6px] sm:text-[7px] font-black uppercase text-muted-foreground tracking-widest">Saldo</span>
                          </div>
                          <span className={cn(
                             "text-sm sm:text-base font-black italic leading-none",
                             isPositive ? "text-secondary" : "text-destructive"
                          )}>
                             R$ {player.balance.toFixed(2)}
                          </span>
                        </div>
                     </div>
                  </CardContent>
                </Card>
              );
           })}
        </div>

        <div className="lg:col-span-4">
          <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden sticky top-24 shadow-xl">
             <CardHeader className="p-5 border-b border-primary/5">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-primary" />
                      <div>
                         <CardTitle className="text-[12px] font-black italic uppercase text-primary leading-tight">Histórico</CardTitle>
                         <p className="text-muted-foreground text-[8px] font-bold uppercase tracking-widest">Registro de Rodadas</p>
                      </div>
                   </div>
                   {isAdmin && (
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => onSave?.()} 
                       disabled={isSaving}
                       className="rounded-lg h-7 px-2 text-[9px] font-black uppercase italic gap-1.5 text-primary hover:bg-primary/10"
                     >
                       {isSaving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Save className="h-2.5 w-2.5" />}
                       Salvar
                     </Button>
                   )}
                </div>
             </CardHeader>
             <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                   <AccordionItem value="turno1" className="border-none">
                      <AccordionTrigger className="px-5 hover:no-underline hover:bg-primary/5 py-3 transition-colors text-xs">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="rounded-full text-[11px] font-black uppercase text-primary border-primary/10 bg-primary/5 px-3 h-6">
                             1º Turno (R1 a R19)
                           </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5 pt-1 space-y-2">
                        {roundWinners.slice(0, 19).map((rw, idx) => renderRoundItem(rw, idx))}
                      </AccordionContent>
                   </AccordionItem>

                   <AccordionItem value="turno2" className="border-none">
                      <AccordionTrigger className="px-5 hover:no-underline hover:bg-primary/5 py-3 transition-colors text-xs">
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="rounded-full text-[11px] font-black uppercase text-primary border-primary/10 bg-primary/5 px-3 h-6">
                             2º Turno (R20 a R38)
                           </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5 pt-1 space-y-2">
                        {roundWinners.slice(19, 38).map((rw, idx) => renderRoundItem(rw, idx + 19))}
                      </AccordionContent>
                   </AccordionItem>
                </Accordion>
                <div className="px-5 py-3 border-t border-primary/5">
                   <p className="text-[10px] font-bold text-muted-foreground/60 uppercase text-center tracking-tighter">
                      Sincronizado com resultados oficiais
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
          <Card className="glass-card border-none rounded-[1.5rem] overflow-hidden border-l-4 border-l-primary shadow-lg">
            <CollapsibleTrigger asChild>
              <CardHeader className="bg-primary/5 pb-2 cursor-pointer hover:bg-primary/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-black italic uppercase text-primary">Ajuste de Valores</CardTitle>
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
                    {isSaving ? "Salvando..." : "Aplicar Turnos"}
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
