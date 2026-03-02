
"use client";

import React from "react";
import { PLAYERS } from "@/lib/constants";
import { Prediction, PlayerPredictions } from "@/lib/types";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface BettingTableProps {
  roundName: string;
  setRoundName: (name: string) => void;
  matchDescriptions: string[];
  setMatchDescriptions: (index: number, value: string) => void;
  predictions: PlayerPredictions;
  setPrediction: (player: string, matchIndex: number, type: 'home' | 'away', value: string) => void;
  results: Prediction[];
  setResult: (matchIndex: number, type: 'home' | 'away', value: string) => void;
  placaresOcultos: boolean;
  currentPlayer: string;
}

export function BettingTable({
  roundName,
  setRoundName,
  matchDescriptions,
  setMatchDescriptions,
  predictions,
  setPrediction,
  results,
  setResult,
  placaresOcultos,
  currentPlayer
}: BettingTableProps) {
  
  const getPoints = (player: string, idx: number) => {
    const res = results[idx];
    const pred = predictions[player][idx];
    if (!res?.homeScore || !res?.awayScore || !pred?.homeScore || !pred?.awayScore) return null;
    
    const rh = parseInt(res.homeScore);
    const ra = parseInt(res.awayScore);
    const ph = parseInt(pred.homeScore);
    const pa = parseInt(pred.awayScore);
    
    if (ph === rh && pa === ra) return 3;
    if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) return 1;
    return 0;
  };

  return (
    <Card className="overflow-x-auto border-none shadow-lg">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-primary text-primary-foreground">
          <tr>
            <th className="p-4 text-left min-w-[140px] sticky left-0 z-20 bg-primary">
              <Input
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="bg-primary-foreground/10 border-none text-white font-bold h-8 placeholder:text-white/50"
                placeholder="Rodada Name"
              />
            </th>
            {PLAYERS.map(player => (
              <th key={player} className="p-4 text-center min-w-[120px]">{player}</th>
            ))}
            <th className="p-4 text-center min-w-[120px]">Resultado</th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {matchDescriptions.map((desc, idx) => (
            <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-2 sticky left-0 z-10 bg-card border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                <Input
                  value={desc}
                  onChange={(e) => setMatchDescriptions(idx, e.target.value)}
                  className="h-8 font-medium text-xs uppercase"
                  placeholder="TIME A x TIME B"
                />
              </td>
              {PLAYERS.map(player => {
                const isHidden = placaresOcultos && currentPlayer !== player;
                // Os palpites ficam desabilitados se:
                // 1. Os placares estiverem revelados (!placaresOcultos)
                // 2. O palpite for de outro jogador (isHidden)
                const isDisabled = !placaresOcultos || isHidden;
                const points = getPoints(player, idx);
                
                return (
                  <td key={player} className="p-2">
                    <div className="flex items-center justify-center gap-1 relative">
                      <Input
                        type="number"
                        disabled={isDisabled}
                        value={isHidden ? "" : predictions[player][idx].homeScore}
                        onChange={(e) => setPrediction(player, idx, 'home', e.target.value)}
                        className={cn(
                          "w-10 h-8 text-center p-0",
                          points === 3 && "border-secondary bg-secondary/10",
                          points === 1 && "border-accent bg-accent/10"
                        )}
                      />
                      <span className="text-muted-foreground font-light text-xs">x</span>
                      <Input
                        type="number"
                        disabled={isDisabled}
                        value={isHidden ? "" : predictions[player][idx].awayScore}
                        onChange={(e) => setPrediction(player, idx, 'away', e.target.value)}
                        className={cn(
                          "w-10 h-8 text-center p-0",
                          points === 3 && "border-secondary bg-secondary/10",
                          points === 1 && "border-accent bg-accent/10"
                        )}
                      />
                      {points !== null && points > 0 && (
                        <Badge 
                          className={cn(
                            "absolute -top-2 -right-2 h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px]",
                            points === 3 ? "bg-secondary" : "bg-accent"
                          )}
                        >
                          {points}
                        </Badge>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="p-2 bg-muted/20">
                <div className="flex items-center justify-center gap-1">
                  <Input
                    type="number"
                    value={results[idx].homeScore}
                    onChange={(e) => setResult(idx, 'home', e.target.value)}
                    className="w-10 h-8 text-center p-0 font-bold border-muted-foreground/30"
                  />
                  <span className="text-muted-foreground font-light text-xs">x</span>
                  <Input
                    type="number"
                    value={results[idx].awayScore}
                    onChange={(e) => setResult(idx, 'away', e.target.value)}
                    className="w-10 h-8 text-center p-0 font-bold border-muted-foreground/30"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
