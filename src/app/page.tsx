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
import { LogOut, Sun, Moon, Shield, Save, Trophy, Loader2, LayoutDashboard, Calendar, ListChecks, Medal, RefreshCw, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getBrasileiraoMatches, getBrasileiraoCurrentMatchday, getLeagueStandings } from "@/lib/football-api";
import { useUser, useAuth, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection, serverTimestamp } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";

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
  
  const roundDocRef = useMemoFirebase(() => (roundId && user) ? doc(db, "rounds", roundId) : null, [db, roundId, user]);
  const { data: roundData } = useDoc(roundDocRef);

  const betsCollectionRef = useMemoFirebase(() => {
    if (!roundId || !user) return null;
    return collection(db, "rounds", roundId, "bets");
  }, [db, roundId, user]);
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

  // Função auxiliar para limpar nomes de times vindos da API
  const cleanName = (name: string) => {
    if (TEAMS[name]) return TEAMS[name].nome;
    return name
      .replace(/^(Clube\sdo\s|SE\s|SC\s|EC\s|CR\s|RB\s|CA\s)/gi, '')
      .replace(/\s(FC|EC|SC|AC|AF|FR|FBPA|FBC|FBPC|CR|SE|RB|Club|Clube|Paulista|da Gama|Foot\sBall\sClub)$/gi, '')
      .trim();
  };

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
            const home = cleanName(match.homeTeam);
            const away = cleanName(match.awayTeam);
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
      PLAYERS.forEach(p => { next[p] = Array(10).fill({ homeScore: "", awayScore: "" }); });
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

  const handleLogout = () => { setMustChangePassword(false); signOut(auth); };

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
        const betId = `${user.uid}_${idx}`;
        const betRef = doc(db, "rounds", roundId, "bets", betId);
        setDocumentNonBlocking(betRef, {
          id: betId,
          userId: user.uid,
          username: user.displayName,
          matchId: matches[idx]?.id || idx,
          homeScorePrediction: parseInt(pred.homeScore),
          awayScorePrediction: parseInt(pred.awayScore),
          dateSubmitted: serverTimestamp(),
        }, { merge: true });
      });
      toast({ title: "Sincronizado!", description: "Dados salvos no AlphaBet Cloud." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha na sincronização." });
    } finally { setIsSaving(false); }
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
    const activeIndices = matchDescriptions.map((d, i) => (d && d !== "" ? i : -1)).filter((i) => i !== -1);
    if (activeIndices.length === 0) return PLAYERS.map(p => ({ name: p, points: 0, exactScores: 0, betsCompleted: false }));
    const playerStats = PLAYERS.map(player => {
      let pts = 0, exs = 0, pending = 0, completed = true;
      activeIndices.forEach(idx => {
        const res = results[idx], pred = predictions[player][idx];
        const hasRes = res.homeScore !== "" && res.awayScore !== "";
        const hasPred = pred.homeScore !== "" && pred.awayScore !== "";
        if (!hasPred) completed = false;
        if (hasRes && hasPred) {
          const rh = parseInt(res.homeScore), ra = parseInt(res.awayScore);
          const ph = parseInt(pred.homeScore), pa = parseInt(pred.awayScore);
          if (ph === rh && pa === ra) { pts += 3; exs += 1; }
          else if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) { pts += 1; }
        } else if (!hasRes && hasPred) { pending++; }
      });
      return { name: player, points: pts, exactScores: exs, pending, maxPossiblePts: pts + (pending * 3), maxPossibleExs: exs + pending, betsCompleted: completed };
    });
    const finalScores: PlayerScore[] = playerStats.map(p => ({
      name: p.name, points: p.points, exactScores: p.exactScores, betsCompleted: p.betsCompleted, isWinner: false
    }));
    const maxPts = Math.max(...finalScores.map(s => s.points));
    if (maxPts > 0) {
      const candidates = finalScores.filter(s => s.points === maxPts);
      const maxExs = Math.max(...candidates.map(s => s.exactScores));
      finalScores.forEach(s => { if (s.points === maxPts && s.exactScores === maxExs) s.isWinner = true; });
    }
    return finalScores;
  }, [matchDescriptions, results, predictions]);

  useEffect(() => {
    if (!currentRound) return;
    const winnersList = scores.filter(s => s.isWinner).map(s => s.name).join(", ");
    if (winnersList) {
      setRoundWinners(prev => prev.map((rw, i) => (i === currentRound - 1 ? { ...rw, winners: winnersList } : rw)));
    }
  }, [scores, currentRound]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  const isAdminUser = user?.displayName === "Jardel";

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user || mustChangePassword) return <LoginScreen forcePasswordChange={mustChangePassword} onPasswordChangeRequired={() => setMustChangePassword(true)} onPasswordChanged={() => setMustChangePassword(false)} />;

  return (
    <div className="flex-1 min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-none rounded-none shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 sports-gradient rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-primary leading-none">AlphaBet</h1>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Brasileirão 2026</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 px-6 py-2 bg-muted/50 rounded-full border">
             <div className="flex flex-col items-center">
                <span className="text-[9px] uppercase font-bold text-muted-foreground">Rodada Atual</span>
                <span className="font-black italic text-primary">#{currentRound}</span>
             </div>
             <div className="h-6 w-px bg-border" />
             <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                   <UserCircle className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold italic uppercase">{user?.displayName}</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 rounded-full px-5 shadow-lg shadow-primary/20" onClick={handleSaveAll} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">{isSaving ? "Sincronizando..." : "Salvar"}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="h-6 w-6 text-accent" />
                <h2 className="text-xl font-black italic uppercase">Líderes da Rodada</h2>
              </div>
              {(loadingMatches || isLoadingBets) && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
           </div>
           <RankingSummary scores={scores} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="betting" className="space-y-6">
              <TabsList className="w-full bg-muted/50 p-1 rounded-2xl h-14">
                <TabsTrigger value="betting" className="flex-1 gap-2 font-black uppercase text-xs rounded-xl data-[state=active]:shadow-lg">
                  <ListChecks className="h-4 w-4" />
                  Apostas
                </TabsTrigger>
                <TabsTrigger value="overall" className="flex-1 gap-2 font-black uppercase text-xs rounded-xl data-[state=active]:shadow-lg">
                  <Trophy className="h-4 w-4" />
                  Ranking
                </TabsTrigger>
                <TabsTrigger value="standings" className="flex-1 gap-2 font-black uppercase text-xs rounded-xl data-[state=active]:shadow-lg">
                  <LayoutDashboard className="h-4 w-4" />
                  Tabela
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex-1 gap-2 font-black uppercase text-xs rounded-xl data-[state=active]:shadow-lg">
                  <Calendar className="h-4 w-4" />
                  Jogos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="betting" className="space-y-4 outline-none">
                <div className="flex items-center justify-between px-2">
                   <div className="flex flex-col">
                      <h3 className="font-black italic uppercase text-lg text-primary">{roundName}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Preencha seus palpites abaixo</p>
                   </div>
                   <div className="flex items-center gap-2">
                      {isAdminUser && (
                        <Button variant="outline" size="sm" onClick={() => setPlacaresOcultos(!placaresOcultos)} className="rounded-full text-[10px] font-black uppercase h-8 px-4 border-primary/20">
                          {placaresOcultos ? "Revelar Tudo" : "Ocultar Tudo"}
                        </Button>
                      )}
                      <Badge className={cn("rounded-full px-3 text-[9px] font-black uppercase", placaresOcultos ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary")}>
                        {placaresOcultos ? "Modo Privado" : "Modo Público"}
                      </Badge>
                   </div>
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

              <TabsContent value="overall" className="outline-none">
                 <ChampionshipRanking roundWinners={roundWinners} setRoundWinners={setRoundWinners} />
              </TabsContent>

              <TabsContent value="standings" className="outline-none">
                 <LeagueStandings standings={standings} />
              </TabsContent>

              <TabsContent value="calendar" className="outline-none">
                {currentRound !== null && (
                  <MatchCalendar 
                    matches={matches} round={currentRound} totalRounds={38}
                    onPrev={() => setCurrentRound(prev => Math.max(1, prev! - 1))}
                    onNext={() => setCurrentRound(prev => Math.min(38, prev! + 1))}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <AiBetAssistant />
            
            <Card className="glass-card border-none overflow-hidden rounded-3xl">
               <div className="bg-primary p-5 flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                     <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-black italic uppercase text-white">Manual Alpha</h4>
               </div>
               <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                     <span className="h-6 w-6 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center font-black text-xs">03</span>
                     <p className="text-xs font-medium leading-relaxed"><b>Placar Exato:</b> O santo graal das apostas. Garante a pontuação máxima e desempate no ranking.</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <span className="h-6 w-6 rounded-lg bg-accent/20 text-accent flex items-center justify-center font-black text-xs">01</span>
                     <p className="text-xs font-medium leading-relaxed"><b>Vencedor:</b> Acertou quem leva os 3 pontos? Ganha ponto de consolação pela análise.</p>
                  </div>
                  <div className="pt-4 border-t border-dashed">
                     <p className="text-[10px] text-muted-foreground uppercase font-black italic">Dica do Admin: Salve sempre antes dos jogos começarem!</p>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t mt-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
           <div className="h-8 w-8 sports-gradient rounded-lg flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
           </div>
           <div className="text-center">
              <p className="text-sm font-black italic uppercase tracking-widest text-primary">AlphaBet League 2026</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Desenvolvido para competidores de elite • Brasileirão Série A</p>
           </div>
        </div>
      </footer>
    </div>
  );
}
