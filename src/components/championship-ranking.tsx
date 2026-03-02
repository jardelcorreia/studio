
"use client";

import React, { useMemo } from "react";
import { PLAYERS } from "@/lib/constants";
import { ChampionshipWinner, PlayerOverallStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Trophy, Medal, TrendingUp, TrendingDown, Users, CheckCircle2, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChampionshipRankingProps {
  roundWinners: ChampionshipWinner[];
  setRoundWinners: React.Dispatch<React.SetStateAction<ChampionshipWinner[]>>;
}

export function ChampionshipRanking({ roundWinners, setRoundWinners }: ChampionshipRankingProps) {
  
  const updateValue = (roundIndex: number, value: number) => {
    setRoundWinners((prev) =>
      prev.map((rw, i) => (i === roundIndex ? { ...rw, value } : rw))
    );
  };

  const overallStats = useMemo(() => {
    const stats: Record<string, PlayerOverallStats> = Object.fromEntries(
      PLAYERS.map((p) => [
        p,
        { name: p, wins: 0, draws: 0, points: 0, balance: 0 },
      ])
    );

    roundWinners.forEach((rw) => {
      if (!rw.winners || !rw.winners.trim()) return;

      const winnersList = rw.winners
        .split(",")
        .map((s) => s.trim())
        .filter((s) => PLAYERS.includes(s));

      if (winnersList.length === 0) return;

      const roundValue = rw.value;
      const numPlayers = PLAYERS.length;

      if (winnersList.length === 1) {
        // Vitória única
        const winner = winnersList[0];
        stats[winner].wins += 1;
        stats[winner].balance += roundValue * (numPlayers - 1);
        
        PLAYERS.forEach(p => {
          if (p !== winner) stats[p].balance -= roundValue;
        });
      } else {
        // Empate
        winnersList.forEach((w) => {
          stats[w].draws += 1;
        });

        const losers = PLAYERS.filter(p => !winnersList.includes(p));
        const totalPot = losers.length * roundValue;
        const prizePerWinner = totalPot / winnersList.length;

        winnersList.forEach(w => {
          stats[w].balance += prizePerWinner;
        });
        losers.forEach(l => {
          stats[l].balance -= roundValue;
        });
      }
    });

    return Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.draws !== a.draws) return b.draws - a.draws;
      return b.balance - a.balance;
    });
  }, [roundWinners]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-xl border-none overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground py-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            <CardTitle className="text-lg uppercase italic font-black">Histórico de Vencedores</CardTitle>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium opacity-70">
            <CheckCircle2 className="h-3 w-3" />
            Auto-Sync Ativo
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[650px] p-4">
            <div className="space-y-3">
              {roundWinners.map((rw, idx) => (
                <div key={rw.round} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-card border border-muted/50 hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                      {rw.round}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Vencedor</span>
                      <div className="flex items-center gap-2 min-h-[20px]">
                        {rw.winners ? (
                          <span className="text-sm font-black italic text-primary uppercase">
                            {rw.winners}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-muted-foreground/50">Aguardando resultados...</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Valor</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-primary">R$</span>
                      <Input
                        type="number"
                        value={rw.value}
                        onChange={(e) => updateValue(idx, parseFloat(e.target.value) || 0)}
                        className="w-12 h-7 p-1 text-right font-black text-xs border-muted-foreground/20 bg-muted/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Medal className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-black italic uppercase">Placar do Campeonato</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overallStats.map((player, index) => (
            <Card key={player.name} className={cn(
              "relative overflow-hidden border-none shadow-lg transition-all hover:scale-[1.02]",
              index === 0 ? "bg-gradient-to-br from-primary/10 to-accent/10 border-l-4 border-l-accent" : "bg-white dark:bg-card"
            )}>
              <div className={cn(
                "absolute top-0 right-0 h-10 w-10 flex items-center justify-center font-black text-white rounded-bl-xl",
                index === 0 ? "bg-accent shadow-lg" : "bg-primary/50"
              )}>
                {index + 1}
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="text-xl font-black italic uppercase text-primary mb-1">{player.name}</div>
                  {index === 0 && <Badge className="bg-accent hover:bg-accent animate-pulse text-[10px] shadow-sm">Líder Alpha</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl text-center">
                    <div className="text-2xl font-black">{player.wins}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vitórias</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl text-center">
                    <div className="text-2xl font-black">{player.draws}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Empates</div>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl text-center col-span-2 flex items-center justify-around">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "text-xl font-black flex items-center gap-1",
                        player.balance >= 0 ? "text-secondary" : "text-destructive"
                      )}>
                        {player.balance >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        R$ {player.balance.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saldo Acumulado</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/20 border-dashed border-2">
          <CardContent className="p-4 flex items-center gap-4 text-xs text-muted-foreground italic">
            <Users className="h-8 w-8 opacity-20" />
            <p>O saldo é calculado automaticamente: quando todos os placares de uma rodada são preenchidos na aba de Apostas, o sistema identifica os vencedores (usando placares exatos como desempate) e atualiza o ranking instantaneamente.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
