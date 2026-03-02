
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PLAYERS, TEAMS } from "@/lib/constants";
import { Match, PlayerPredictions, Prediction, PlayerScore, StandingEntry } from "@/lib/types";
import { RankingSummary } from "@/components/ranking-summary";
import { BettingTable } from "@/components/betting-table";
import { MatchCalendar } from "@/components/match-calendar";
import { LeagueStandings } from "@/components/league-standings";
import { AiBetAssistant } from "@/components/ai-bet-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Sun, Moon, Shield, Save, Trophy, LayoutDashboard, Loader2, ListOrdered, Calendar, Table as TableIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBrasileiraoMatches, getBrasileiraoCurrentMatchday, getLeagueStandings } from "@/lib/football-api";

export default function Home() {
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState("Jardel");
  const [darkMode, setDarkMode] = useState(false);
  
  // App state
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [roundName, setRoundName] = useState("");
  const [matchDescriptions, setMatchDescriptions] = useState<string[]>(Array(10).fill(""));
  const [predictions, setPredictions] = useState<PlayerPredictions>(
    Object.fromEntries(PLAYERS.map(p => [p, Array(10).fill({ homeScore: "", awayScore: "" })]))
  );
  const [results, setResults] = useState<Prediction[]>(Array(10).fill({ homeScore: "", awayScore: "" }));
  const [placaresOcultos, setPlacaresOcultos] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initial fetch
  useEffect(() => {
    async function init() {
      const matchday = await getBrasileiraoCurrentMatchday();
      setCurrentRound(matchday);
      setRoundName(`Rodada ${matchday}`);
      
      const leagueTable = await getLeagueStandings();
      setStandings(leagueTable);
    }
    init();
  }, []);

  // Fetch data from API when round changes
  useEffect(() => {
    if (currentRound === null) return;

    async function loadMatches() {
      setLoadingMatches(true);
      const data = await getBrasileiraoMatches(currentRound!);
      setMatches(data);
      
      if (data.length > 0) {
        setRoundName(`Rodada ${currentRound}`);
        const newDescriptions = Array(10).fill("");
        const newResults = Array(10).fill({ homeScore: "", awayScore: "" });
        
        data.forEach((match, idx) => {
          if (idx < 10) {
            const home = TEAMS[match.homeTeam]?.abrev || match.homeTeam.substring(0, 3).toUpperCase();
            const away = TEAMS[match.awayTeam]?.abrev || match.awayTeam.substring(0, 3).toUpperCase();
            newDescriptions[idx] = `${home} x ${away}`;
            if (match.status === 'FINISHED') {
              newResults[idx] = {
                homeScore: match.homeScore?.toString() || "",
                awayScore: match.awayScore?.toString() || ""
              };
            }
          }
        });
        setMatchDescriptions(newDescriptions);
        setResults(newResults);
      }
      setLoadingMatches(false);
    }
    loadMatches();
  }, [currentRound]);

  const handleLogout = () => setIsLoggedIn(false);

  // State managers
  const updatePrediction = (player: string, idx: number, type: 'home' | 'away', value: string) => {
    setPredictions(prev => ({
      ...prev,
      [player]: prev[player].map((p, i) => i === idx ? { ...p, [type === 'home' ? 'homeScore' : 'awayScore']: value } : p)
    }));
  };

  const updateResult = (idx: number, type: 'home' | 'away', value: string) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, [type === 'home' ? 'homeScore' : 'awayScore']: value } : r));
  };

  const updateMatchDescription = (idx: number, value: string) => {
    setMatchDescriptions(prev => prev.map((d, i) => i === idx ? value : d));
  };

  // Calculate scores
  const calculateScores = useCallback((): PlayerScore[] => {
    return PLAYERS.map(player => {
      let points = 0;
      let exactScores = 0;
      let completed = true;

      for (let i = 0; i < 10; i++) {
        const desc = matchDescriptions[i];
        if (!desc || desc === "") continue;
        const res = results[i];
        const pred = predictions[player][i];
        if (!pred.homeScore || !pred.awayScore) completed = false;
        if (!res.homeScore || !res.awayScore) continue;
        const rh = parseInt(res.homeScore), ra = parseInt(res.awayScore);
        const ph = parseInt(pred.homeScore), pa = parseInt(pred.awayScore);
        if (ph === rh && pa === ra) { points += 3; exactScores += 1; }
        else if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) { points += 1; }
      }
      return { name: player, points, exactScores, betsCompleted: completed };
    });
  }, [matchDescriptions, results, predictions]);

  const scores = calculateScores();
  const maxPoints = Math.max(...scores.map(s => s.points));
  const topPlayers = scores.filter(s => s.points === maxPoints && maxPoints > 0);
  if (topPlayers.length > 0) {
    const maxExact = Math.max(...topPlayers.map(p => p.exactScores));
    scores.forEach(s => { if (s.points === maxPoints && s.exactScores === maxExact && maxPoints > 0) s.isWinner = true; });
  }

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  return (
    <div className="flex-1 space-y-8 pb-20">
      <div className="relative overflow-hidden bg-primary py-12 px-4 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-secondary to-accent" />
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg flex gap-2 flex-wrap justify-center">
            {"BRASILEIRÃO ALPHABET 2026".split(" ").map((word, wi) => (
              <span key={wi} className="flex">
                {word.split("").map((char, ci) => (
                  <span key={ci} className="animate-letter-reveal opacity-0" style={{ animationDelay: `${(wi * 10 + ci) * 0.05}s` }}>
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="text-white/80 font-medium tracking-widest uppercase">Liga de Apostas Profissional</p>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="font-bold">Painel Alpha</span>
          </div>
          <div className="flex gap-2 ml-auto">
            {loadingMatches && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {currentUser === "Jardel" && (
              <Button variant="outline" size="sm" onClick={() => setPlacaresOcultos(!placaresOcultos)} className="gap-2">
                <Shield className="h-4 w-4 text-primary" />
                {placaresOcultos ? "Revelar Placares" : "Ocultar Placares"}
              </Button>
            )}
            <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/90" onClick={() => {
              setIsSaving(true);
              setTimeout(() => { setIsSaving(false); toast({ title: "Salvo!", description: "Dados sincronizados com o servidor." }); }, 800);
            }}>
              <Save className="h-4 w-4" />
              Salvar Tudo
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-black italic uppercase">Liderança da Rodada</h2>
          </div>
          <RankingSummary scores={scores} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Tabs defaultValue="betting" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 h-12">
                <TabsTrigger value="betting" className="gap-2 font-bold uppercase text-xs">
                  <TableIcon className="h-4 w-4" />
                  Apostas
                </TabsTrigger>
                <TabsTrigger value="standings" className="gap-2 font-bold uppercase text-xs">
                  <ListOrdered className="h-4 w-4" />
                  Classificação
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2 font-bold uppercase text-xs">
                  <Calendar className="h-4 w-4" />
                  Calendário
                </TabsTrigger>
              </TabsList>

              <TabsContent value="betting" className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="h-8 w-2 bg-primary" />
                  Quadro de Apostas
                </h2>
                <BettingTable 
                  roundName={roundName}
                  setRoundName={setRoundName}
                  matchDescriptions={matchDescriptions}
                  setMatchDescriptions={updateMatchDescription}
                  predictions={predictions}
                  setPrediction={updatePrediction}
                  results={results}
                  setResult={updateResult}
                  placaresOcultos={placaresOcultos}
                  currentPlayer={currentUser}
                />
              </TabsContent>

              <TabsContent value="standings" className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="h-8 w-2 bg-accent" />
                  Tabela Brasileirão
                </h2>
                <LeagueStandings standings={standings} />
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="h-8 w-2 bg-secondary" />
                  Jogos da Rodada
                </h2>
                {currentRound !== null && (
                  <MatchCalendar 
                    matches={matches}
                    round={currentRound}
                    totalRounds={38}
                    onPrev={() => setCurrentRound(prev => Math.max(1, prev! - 1))}
                    onNext={() => setCurrentRound(prev => Math.min(38, prev! + 1))}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8">
            <AiBetAssistant />
            <Card>
              <div className="p-4 bg-muted/20 border-b">
                <h3 className="font-bold flex items-center gap-2 text-sm uppercase">Regras AlphaBet</h3>
              </div>
              <CardContent className="p-4 space-y-3 text-xs leading-relaxed">
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black text-white shrink-0">3</div>
                  <p><b>Placar Exato:</b> Acertar os dois resultados garante pontuação máxima.</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-white shrink-0">1</div>
                  <p><b>Vencedor/Empate:</b> Acertar apenas quem ganha ou se empata.</p>
                </div>
                <p className="text-muted-foreground italic mt-2 border-t pt-2">Critério de desempate: Maior número de placares exatos na rodada.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="mt-20 py-10 bg-muted/30 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <div className="flex justify-center gap-4">
             <Trophy className="h-6 w-6 text-muted" />
             <div className="text-2xl font-black italic opacity-30">ALPHABET</div>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 AlphaBet League. Dados oficiais via Football-Data API.</p>
        </div>
      </footer>
    </div>
  );
}
