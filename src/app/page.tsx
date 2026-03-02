
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PLAYERS, TEAMS } from "@/lib/constants";
import { Match, PlayerPredictions, Prediction, PlayerScore, StandingEntry, ChampionshipWinner } from "@/lib/types";
import { RankingSummary } from "@/components/ranking-summary";
import { BettingTable } from "@/components/betting-table";
import { MatchCalendar } from "@/components/match-calendar";
import { LeagueStandings } from "@/components/league-standings";
import { ChampionshipRanking } from "@/components/championship-ranking";
import { AiBetAssistant } from "@/components/ai-bet-assistant";
import { LoginScreen } from "@/components/login-screen";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Sun, Moon, Shield, Save, Trophy, Loader2, ListOrdered, Calendar, Table as TableIcon, Medal, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBrasileiraoMatches, getBrasileiraoCurrentMatchday, getLeagueStandings } from "@/lib/football-api";
import { useUser, useAuth, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection, serverTimestamp, query, where } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function Home() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  
  const [darkMode, setDarkMode] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  
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

  const [roundWinners, setRoundWinners] = useState<ChampionshipWinner[]>(
    Array.from({ length: 38 }, (_, i) => ({
      round: i + 1,
      winners: "",
      value: 6,
    }))
  );

  const roundId = currentRound ? `round_${currentRound}` : null;
  const roundDocRef = useMemoFirebase(() => roundId ? doc(db, "rounds", roundId) : null, [db, roundId]);
  const { data: roundData } = useDoc(roundDocRef);

  // Nova query: busca direta dentro da coleção 'bets' da rodada (sem Collection Group)
  const betsCollectionRef = useMemoFirebase(() => {
    if (!roundId) return null;
    return collection(db, "rounds", roundId, "bets");
  }, [db, roundId]);
  const { data: allBets, isLoading: isLoadingBets } = useCollection(betsCollectionRef);

  useEffect(() => {
    async function init() {
      const matchday = await getBrasileiraoCurrentMatchday();
      setCurrentRound(matchday);
    }
    init();
  }, []);

  useEffect(() => {
    if (roundData) {
      if (roundData.name) setRoundName(roundData.name);
      if (roundData.isScoresHidden !== undefined) setPlacaresOcultos(roundData.isScoresHidden);
    } else if (currentRound) {
      setRoundName(`Rodada ${currentRound}`);
    }
  }, [roundData, currentRound]);

  useEffect(() => {
    if (currentRound === null) return;

    async function loadMatches() {
      setLoadingMatches(true);
      const data = await getBrasileiraoMatches(currentRound!);
      setMatches(data);
      
      const leagueTable = await getLeagueStandings();
      setStandings(leagueTable);

      if (data.length > 0) {
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

  useEffect(() => {
    if (!allBets || !currentRound) return;

    setPredictions(prev => {
      const next = { ...prev };
      PLAYERS.forEach(p => {
        next[p] = Array(10).fill({ homeScore: "", awayScore: "" });
      });

      allBets.forEach(bet => {
        const parts = bet.id.split('_');
        const matchIdx = parseInt(parts[parts.length - 1]);
        const player = bet.username;
        
        if (player && PLAYERS.includes(player) && matchIdx >= 0 && matchIdx < 10) {
          next[player][matchIdx] = {
            homeScore: bet.homeScorePrediction?.toString() || "",
            awayScore: bet.awayScorePrediction?.toString() || ""
          };
        }
      });
      return next;
    });
  }, [allBets, currentRound]);

  const handleLogout = () => {
    setMustChangePassword(false);
    signOut(auth);
  };

  const handleSaveAll = async () => {
    if (!currentRound || !user || !roundId) return;
    setIsSaving(true);

    try {
      const roundRef = doc(db, "rounds", roundId);

      setDocumentNonBlocking(roundRef, {
        id: roundId,
        roundNumber: currentRound,
        name: roundName,
        isScoresHidden: placaresOcultos,
        dateUpdated: serverTimestamp(),
        dateCreated: roundData?.dateCreated || serverTimestamp(),
      }, { merge: true });

      const userBets = predictions[user.displayName!];
      userBets.forEach((pred, idx) => {
        if (pred.homeScore === "" || pred.awayScore === "") return;
        
        // Novo ID: combina UID e índice da partida para evitar duplicatas
        const betId = `${user.uid}_${idx}`;
        const betRef = doc(db, "rounds", roundId, "bets", betId);
        
        setDocumentNonBlocking(betRef, {
          id: betId,
          userId: user.uid,
          username: user.displayName,
          matchId: matches[idx]?.id || idx,
          homeScorePrediction: parseInt(pred.homeScore),
          awayScorePrediction: parseInt(pred.awayScore),
          isScoresHidden: placaresOcultos,
          dateSubmitted: serverTimestamp(),
        }, { merge: true });
      });

      toast({
        title: "Sucesso!",
        description: "Os dados foram sincronizados com o Firebase.",
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível sincronizar os dados.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const scores = useMemo((): PlayerScore[] => {
    const activeIndices = matchDescriptions
      .map((d, i) => (d && d !== "" ? i : -1))
      .filter((i) => i !== -1);

    if (activeIndices.length === 0) {
      return PLAYERS.map(p => ({ name: p, points: 0, exactScores: 0, betsCompleted: false }));
    }

    const playerStats = PLAYERS.map(player => {
      let pts = 0;
      let exs = 0;
      let pending = 0;
      let completed = true;

      activeIndices.forEach(idx => {
        const res = results[idx];
        const pred = predictions[player][idx];
        const hasRes = res.homeScore !== "" && res.awayScore !== "";
        const hasPred = pred.homeScore !== "" && pred.awayScore !== "";

        if (!hasPred) completed = false;

        if (hasRes && hasPred) {
          const rh = parseInt(res.homeScore), ra = parseInt(res.awayScore);
          const ph = parseInt(pred.homeScore), pa = parseInt(pred.awayScore);
          if (ph === rh && pa === ra) { pts += 3; exs += 1; }
          else if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) { pts += 1; }
        } else if (!hasRes && hasPred) {
          pending++;
        }
      });

      return { 
        name: player, 
        points: pts, 
        exactScores: exs, 
        pending, 
        maxPossiblePts: pts + (pending * 3), 
        maxPossibleExs: exs + pending,
        betsCompleted: completed 
      };
    });

    const isRoundFinished = activeIndices.length > 0 && activeIndices.every(idx => results[idx].homeScore !== "" && results[idx].awayScore !== "");
    
    const finalScores: PlayerScore[] = playerStats.map(p => ({
      name: p.name,
      points: p.points,
      exactScores: p.exactScores,
      betsCompleted: p.betsCompleted,
      isWinner: false
    }));

    if (isRoundFinished) {
      const maxPts = Math.max(...finalScores.map(s => s.points));
      const candidates = finalScores.filter(s => s.points === maxPts);
      const maxExs = Math.max(...candidates.map(s => s.exactScores));
      finalScores.forEach(s => {
        if (s.points === maxPts && s.exactScores === maxExs && maxPts > 0) s.isWinner = true;
      });
    } else {
      finalScores.forEach(p => {
        const pStat = playerStats.find(s => s.name === p.name)!;
        if (pStat.points === 0) return;

        const isUnreachable = playerStats.every(other => {
          if (p.name === other.name) return true;
          if (other.maxPossiblePts < pStat.points) return true;
          if (other.maxPossiblePts === pStat.points && other.maxPossibleExs < pStat.exactScores) return true;
          return false;
        });

        if (isUnreachable) p.isWinner = true;
      });
    }

    return finalScores;
  }, [matchDescriptions, results, predictions]);

  useEffect(() => {
    if (!currentRound) return;

    const winnersList = scores
      .filter(s => s.isWinner)
      .map(s => s.name)
      .join(", ");

    if (winnersList) {
      setRoundWinners(prev => 
        prev.map((rw, i) => (i === currentRound - 1 ? { ...rw, winners: winnersList } : rw))
      );
    }
  }, [scores, currentRound]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const isAdminUser = user?.displayName === "Jardel";

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || mustChangePassword) {
    return <LoginScreen 
      forcePasswordChange={mustChangePassword}
      onPasswordChangeRequired={() => setMustChangePassword(true)} 
      onPasswordChanged={() => setMustChangePassword(false)} 
    />;
  }

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
          <div className="flex items-center gap-3">
            <p className="text-white/80 font-medium tracking-widest uppercase">Liga de Apostas Profissional</p>
            {isAdminUser && (
              <Badge className="bg-accent text-accent-foreground font-black italic flex gap-1 px-3">
                <Shield className="h-3 w-3" />
                ADMIN
              </Badge>
            )}
          </div>
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
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black italic">
              {user?.displayName?.substring(0, 1) || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Logado como</span>
              <span className="font-black italic text-primary uppercase leading-tight">{user?.displayName}</span>
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            {(loadingMatches || isLoadingBets) && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
            {isAdminUser && (
              <Button variant="outline" size="sm" onClick={() => setPlacaresOcultos(!placaresOcultos)} className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <Shield className="h-4 w-4" />
                {placaresOcultos ? "Revelar Placares" : "Ocultar Placares"}
              </Button>
            )}
            <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/90" onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Sincronizando..." : "Salvar Tudo"}
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
              <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12">
                <TabsTrigger value="betting" className="gap-2 font-bold uppercase text-xs">
                  <TableIcon className="h-4 w-4" />
                  Apostas
                </TabsTrigger>
                <TabsTrigger value="overall" className="gap-2 font-bold uppercase text-xs">
                  <Medal className="h-4 w-4" />
                  Ranking Geral
                </TabsTrigger>
                <TabsTrigger value="standings" className="gap-2 font-bold uppercase text-xs">
                  <ListOrdered className="h-4 w-4" />
                  Tabela Brasileirão
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-2 font-bold uppercase text-xs">
                  <Calendar className="h-4 w-4" />
                  Calendário
                </TabsTrigger>
              </TabsList>

              <TabsContent value="betting" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                    <span className="h-8 w-2 bg-primary" />
                    Quadro de Apostas
                  </h2>
                  <Badge variant="outline" className={placaresOcultos ? "border-destructive text-destructive" : "border-secondary text-secondary"}>
                    {placaresOcultos ? "Placares Ocultos" : "Placares Visíveis"}
                  </Badge>
                </div>
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
                  currentPlayer={user?.displayName || ""}
                />
              </TabsContent>

              <TabsContent value="overall" className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="h-8 w-2 bg-accent" />
                  Ranking AlphaBet 2026
                </h2>
                <ChampionshipRanking 
                  roundWinners={roundWinners}
                  setRoundWinners={setRoundWinners}
                />
              </TabsContent>

              <TabsContent value="standings" className="space-y-4">
                <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                  <span className="h-8 w-2 bg-primary/40" />
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
            <Card className="border-none shadow-lg">
              <div className="p-4 bg-muted/20 border-b">
                <h3 className="font-bold flex items-center gap-2 text-sm uppercase">Regras AlphaBet</h3>
              </div>
              <div className="p-4 space-y-3 text-xs leading-relaxed">
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-[10px] font-black text-white shrink-0">3</div>
                  <p><b>Placar Exato:</b> Acertar os dois resultados garante pontuação máxima.</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center text-[10px] font-black text-white shrink-0">1</div>
                  <p><b>Vencedor/Empate:</b> Acertar apenas quem ganha ou se empata.</p>
                </div>
                <p className="text-muted-foreground italic mt-2 border-t pt-2">Critério de desempate: Maior número de placares exatos na rodada.</p>
              </div>
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
