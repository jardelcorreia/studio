
"use client";

import React from "react";
import { StandingEntry } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cleanTeamName, getTeamAbrev, cn } from "@/lib/utils";

interface LeagueStandingsProps {
  standings: StandingEntry[];
}

export function LeagueStandings({ standings }: LeagueStandingsProps) {
  if (!standings || standings.length === 0) {
    return (
      <div className="p-12 text-center glass-card rounded-3xl border-dashed border-2 flex flex-col items-center gap-4 max-w-4xl mx-auto">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <span className="text-sm font-black italic uppercase text-muted-foreground">Sincronizando com a CBF...</span>
      </div>
    );
  }

  return (
    <Card className="glass-card border-none rounded-3xl overflow-hidden max-w-4xl mx-auto shadow-xl">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[50px] text-center font-black uppercase text-[10px]">#</TableHead>
              <TableHead className="font-black uppercase text-[10px]">Clube</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">J</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">V</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">E</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] hidden sm:table-cell">D</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px]">SG</TableHead>
              <TableHead className="text-center font-black uppercase text-[10px] text-primary">PTS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((entry) => (
              <TableRow key={entry.teamName} className="hover:bg-primary/5 transition-colors border-muted/20">
                <TableCell className="text-center font-black italic p-2">
                   <div className="flex items-center justify-center">
                      <div className={cn(
                        "h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center text-[10px] sm:text-xs shadow-sm",
                        entry.position <= 4 ? "bg-secondary text-white" : entry.position <= 6 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {entry.position}
                      </div>
                   </div>
                </TableCell>
                <TableCell className="p-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <img src={entry.teamCrest} alt={entry.teamName} className="w-6 h-6 sm:w-8 sm:h-8 object-contain drop-shadow-sm shrink-0" />
                    <span className="font-black italic uppercase text-[11px] sm:text-sm whitespace-nowrap">
                      <span className="sm:hidden">{getTeamAbrev(entry.teamName)}</span>
                      <span className="hidden sm:inline">{cleanTeamName(entry.teamName)}</span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold p-2">{entry.playedGames}</TableCell>
                <TableCell className="text-center p-2">{entry.won}</TableCell>
                <TableCell className="text-center hidden sm:table-cell p-2">{entry.draw}</TableCell>
                <TableCell className="text-center hidden sm:table-cell p-2">{entry.lost}</TableCell>
                <TableCell className="text-center font-medium p-2">
                   <Badge variant="outline" className={cn(
                     "rounded-full px-1.5 sm:px-2 text-[9px] sm:text-[10px]",
                     entry.goalDifference > 0 ? "border-secondary/20 text-secondary bg-secondary/5" : "border-destructive/20 text-destructive bg-destructive/5"
                   )}>
                      {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                   </Badge>
                </TableCell>
                <TableCell className="text-center p-2">
                   <span className="text-base sm:text-lg font-black italic text-primary">{entry.points}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
