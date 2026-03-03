"use client";

import React, { useMemo } from "react";
import { ChampionshipWinner, PlayerOverallStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Trophy, Medal, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChampionshipRankingProps {
  roundWinners: ChampionshipWinner[];
  setRoundWinners: React.Dispatch<React.SetStateAction<ChampionshipWinner[]>>;
  allUsers: any[];
}

export function ChampionshipRanking({ roundWinners, setRoundWinners, allUsers }: ChampionshipRankingProps) {
  const updateValue = (roundIndex: number, value: number) => {
    setRoundWinners((prev) => prev.map((rw, i) => (i === roundIndex ? { ...rw, value } : rw)));
  };

  const overallStats = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];

    const stats: Record<string, PlayerOverallStats & { photoUrl?: string }> = Object.fromEntries(
      allUsers.map((u) => [u.id, { name: u.username, wins: 0, draws: 0, points: 0, balance: 0, photoUrl: u.photoUrl }])
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
      // Encontra os IDs dos vencedores baseados nos nomes salvos no histórico
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
         {overallStats.map((player, index) => (
            <Card key={player.name} className={cn(
              "glass-card border-none rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.03]",
              index === 0 && "ring-2 ring-accent ring-offset-4 ring-offset-background"
            )}>
              <CardContent className="p-0">
                 <div className={cn(
                   "p-6 flex flex-col items-center text-center",
                   index === 0 ? "bg-accent/10" : "bg-muted/30"
                 )}>
                    <div className="relative mb-4">
                       <div className={cn(
                         "h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-lg overflow-hidden",
                         index === 0 ? "sports-gradient text-white rotate-6" : "bg-white dark:bg-card border-2"
                       )}>
                          {player.photoUrl ? (
                            <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
                          ) : player.name.substring(0, 2).toUpperCase()}
                       </div>
                       {index === 0 && (
                         <div className="absolute -top-3 -right-3 h-8 w-8 bg-accent rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                            <Trophy className="h-4 w-4 text-accent-foreground" />
                         </div>
                       )}
                    </div>
                    <h3 className="text-xl font-black italic uppercase text-primary leading-none mb-2">{player.name}</h3>
                    <Badge variant="outline" className="rounded-full text-[8px] font-black uppercase tracking-widest border-primary/20 px-4">
                       {index === 0 ? "Líder Alpha" : `Top ${index + 1} Elite`}
                    </Badge>
                 </div>

                 <div className="p-6 grid grid-cols-3 gap-2">
                    <div className="text-center">
                       <div className="text-3xl font-black text-primary leading-none">{player.wins}</div>
                       <div className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Vitórias</div>
                    </div>
                    <div className="text-center">
                       <div className="text-xl font-black">{player.draws}</div>
                       <div className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Empates</div>
                    </div>
                    <div className="text-center">
                       <div className="text-xl font-black">{player.points}</div>
                       <div className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Total Pts</div>
                    </div>
                    <div className="col-span-3 pt-4 border-t border-dashed flex items-center justify-between mt-2">
                       <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">Saldo</span>
                       </div>
                       <span className={cn(
                         "text-lg font-black italic",
                         player.balance >= 0 ? "text-secondary" : "text-destructive"
                       )}>
                          R$ {player.balance.toFixed(2)}
                       </span>
                    </div>
                 </div>
              </CardContent>
            </Card>
         ))}
      </div>

      <div className="lg:col-span-4 space-y-4">
        <Card className="glass-card border-none rounded-3xl overflow-hidden h-full">
           <CardHeader className="bg-primary p-6">
              <CardTitle className="text-white font-black italic uppercase text-sm flex items-center gap-2">
                 <Medal className="h-5 w-5" />
                 Histórico das Rodadas
              </CardTitle>
           </CardHeader>
           <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                 <div className="p-4 space-y-2">
                    {roundWinners.map((rw, idx) => (
                       <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border border-transparent hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                {rw.round}
                             </div>
                             <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase text-muted-foreground">Campeão</span>
                                <span className="text-[11px] font-black italic uppercase text-primary truncate max-w-[120px]">
                                   {rw.winners || "Pendente"}
                                </span>
                             </div>
                          </div>
                          <div className="flex flex-col items-end">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Custo</span>
                             <div className="flex items-center gap-1">
                                <span className="text-[9px] font-bold text-primary">R$</span>
                                <Input 
                                  type="number" value={rw.value} 
                                  onChange={(e) => updateValue(idx, parseFloat(e.target.value) || 0)}
                                  className="w-10 h-6 p-0 text-right bg-transparent border-none font-black text-xs focus-visible:ring-0"
                                />
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </ScrollArea>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
