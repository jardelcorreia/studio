
"use client";

import React from "react";
import { StandingEntry } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card } from "./ui/card";

interface LeagueStandingsProps {
  standings: StandingEntry[];
}

export function LeagueStandings({ standings }: LeagueStandingsProps) {
  if (!standings || standings.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
        Carregando classificação do campeonato...
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px] text-center font-bold">Pos</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center font-bold">P</TableHead>
              <TableHead className="text-center">V</TableHead>
              <TableHead className="text-center">E</TableHead>
              <TableHead className="text-center">D</TableHead>
              <TableHead className="text-center hidden sm:table-cell">GP</TableHead>
              <TableHead className="text-center hidden sm:table-cell">GC</TableHead>
              <TableHead className="text-center">SG</TableHead>
              <TableHead className="text-center font-black text-primary">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-card">
            {standings.map((entry) => (
              <TableRow key={entry.teamName} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-center font-bold">
                  <span className={entry.position <= 4 ? "text-secondary" : entry.position <= 6 ? "text-primary" : ""}>
                    {entry.position}º
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={entry.teamCrest} alt={entry.teamName} className="w-6 h-6 object-contain" />
                    <span className="font-bold text-xs sm:text-sm whitespace-nowrap">{entry.teamName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">{entry.playedGames}</TableCell>
                <TableCell className="text-center">{entry.won}</TableCell>
                <TableCell className="text-center">{entry.draw}</TableCell>
                <TableCell className="text-center">{entry.lost}</TableCell>
                <TableCell className="text-center hidden sm:table-cell text-muted-foreground">{entry.goalsFor}</TableCell>
                <TableCell className="text-center hidden sm:table-cell text-muted-foreground">{entry.goalsAgainst}</TableCell>
                <TableCell className="text-center font-medium">{entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}</TableCell>
                <TableCell className="text-center font-black text-primary text-lg">{entry.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
