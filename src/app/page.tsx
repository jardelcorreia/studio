
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PLAYERS } from "@/lib/constants";
import { Match, PlayerPredictions, Prediction, PlayerScore, StandingEntry, ChampionshipWinner } from "@/lib/types";
import { RankingSummary } from "@/components/ranking-summary";
import { BettingTable } from "@/components/betting-table";
import { MatchCalendar } from "@/components/match-calendar";
import { LeagueStandings } from "@/components/league-standings";
import { ChampionshipRanking } from "@/components/championship-ranking";
import { AiBetAssistant } from "@/components/ai-bet-assistant";
import { ProfileSettings } from "@/components/profile-settings";
import { LoginScreen } from "@/components/login-screen";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  LogOut, 
  Sun, 
  Moon, 
  Shield, 
  Trophy, 
  Loader2, 
  LayoutDashboard, 
  Calendar, 
  ListChecks, 
  Medal, 
  RefreshCw, 
  UserCircle, 
  Settings,
  ChevronDown,
  Eye,
  EyeOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getBrasileiraoMatches, getBrasileiraoCurrentMatchday, getLeagueStandings } from "@/lib/football-api";
import { useUser, useAuth, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc, collection, serverTimestamp } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn, cleanTeamName } from "@/lib/utils";

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
  const [predictions, setPredictions] = useState<PlayerPredictions>({});
  const [results, setResults] = useState<Prediction[]>(Array(10).fill({ homeScore: "", awayScore: "" }));
  const [placaresOcultos, setPlacaresOcultos] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const [roundWinners, setRoundWinners] = useState<ChampionshipWinner[]>(
    Array.from({ length: 38 }, (_, i) => ({
      round: i + 1,
      winners: "",
      value: 6,
      pointsMap: {}
    }))
  );

  const roundId = currentRound ? `round_${currentRound}` : null;
  
  const roundDocRef = useMemoFirebase(() => (roundId && user) ? doc(db, "rounds", roundId) : null, [db, roundId, user]);
  const { data: roundData } = useDoc(roundDocRef);

  const settingsDocRef = useMemoFirebase(() => user ? doc(db, "app_settings", "championship") : null, [db, user]);
  const { data: settingsData } = useDoc(settingsDocRef);

  const betsCollectionRef = useMemoFirebase(() => {
    if (!roundId || !user) return null;
    return collection(db, "rounds", roundId, "bets");
  }, [db, roundId, user]);
  const { data: allBets, isLoading: isLoadingBets } = useCollection(betsCollectionRef);

  const usersCollectionRef = useMemoFirebase(() => user ? collection(db, "users") : null, [db, user]);
  const { data: allUsers } = useCollection(usersCollectionRef);

  // Verificação de Admin baseada no e-mail fixo para evitar perda de acesso ao mudar nome de perfil
  const isAdminUser = user?.email === "jardel@alphabet.com";

  useEffect(() => {
    // Hack para garantir que o scroll e eventos de ponteiro voltem ao normal após fechar Dialogs do Radix
    if (!showProfileDialog) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showProfileDialog]);

  useEffect(() => {
    async function init() {
      const matchday = await getBrasileiraoCurrentMatchday();
      setCurrentRound(matchday);
    }
    init();
  }, []);

  useEffect(() => {
    if (settingsData?.history) {
      setRoundWinners(settingsData.history);
    }
  }, [settingsData]);

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
            const home = cleanTeamName(match.homeTeam);
            const away = cleanTeamName(match.awayTeam);
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
    if (!allBets || !allUsers) return;
    setPredictions(prev => {
      const next: PlayerPredictions = {};
      allUsers.forEach(u => { next[u.id] = Array(10).fill({ homeScore: "", awayScore: "" }); });
      allBets.forEach(bet => {
        const parts = bet.id.split('_');
        const matchIdx = parseInt(parts[parts.length - 1]);
        const bUserId = bet.userId;
        if (bUserId && next[bUserId] && matchIdx >= 0 && matchIdx < 10) {
          next[bUserId][matchIdx] = {
            homeScore: bet.homeScorePrediction?.toString() || "",
            awayScore: bet.awayScorePrediction?.toString() || ""
          };
        }
      });
      return next;
    });
  }, [allBets, allUsers]);

  const scores = useMemo((): PlayerScore[] => {
    if (!allUsers || allUsers.length === 0) return [];
    
    const activeIndices = matchDescriptions.map((d, i) => (d && d !== "" ? i : -1)).filter((i) => i !== -1);
    const totalActiveMatches = activeIndices.length;
    
    const playerStats = allUsers.map(u => {
      let pts = 0, exs = 0, filledCount = 0;
      const userPreds = predictions[u.id];
      
      if (!userPreds) return { id: u.id, name: u.username, points: 0, exactScores: 0, betsCompleted: false, betsCount: 0, photoUrl: u.photoUrl };

      activeIndices.forEach(idx => {
        const res = results[idx], pred = userPreds[idx];
        const hasRes = res.homeScore !== "" && res.awayScore !== "";
        const hasPred = pred.homeScore !== "" && pred.awayScore !== "";
        if (hasPred) filledCount++;
        if (hasRes && hasPred) {
          const rh = parseInt(res.homeScore), ra = parseInt(res.awayScore);
          const ph = parseInt(pred.homeScore), pa = parseInt(pred.awayScore);
          if (ph === rh && pa === ra) { pts += 3; exs += 1; }
          else if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) { pts += 1; }
        }
      });
      return { 
        id: u.id, 
        name: u.username, 
        points: pts, 
        exactScores: exs, 
        betsCompleted: filledCount >= totalActiveMatches && totalActiveMatches > 0, 
        betsCount: filledCount,
        photoUrl: u.photoUrl 
      };
    });

    const finalScores = playerStats.map(p => ({ ...p, isWinner: false }));
    const maxPts = Math.max(...finalScores.map(s => s.points));
    if (maxPts > 0) {
      const candidates = finalScores.filter(s => s.points === maxPts);
      const maxExs = Math.max(...candidates.map(s => s.exactScores));
      finalScores.forEach(s => { if (s.points === maxPts && s.exactScores === maxExs) s.isWinner = true; });
    }
    return finalScores.sort((a, b) => b.points - a.points || b.exactScores - a.exactScores);
  }, [matchDescriptions, results, predictions, allUsers]);

  useEffect(() => {
    if (!currentRound || scores.length === 0) return;
    const winnersList = scores.filter(s => s.isWinner).map(s => s.name).join(", ");
    const pointsMap = Object.fromEntries(scores.map(s => [s.id, s.points]));
    
    setRoundWinners(prev => {
      const next = [...prev];
      next[currentRound - 1] = {
        ...next[currentRound - 1],
        winners: winnersList || next[currentRound - 1].winners,
        pointsMap: pointsMap
      };
      return next;
    });
  }, [scores, currentRound]);

  const handleTogglePlacaresOcultos = () => {
    if (!isAdminUser || !roundId) return;
    const newValue = !placaresOcultos;
    setPlacaresOcultos(newValue);
    
    // Gravação imediata no Firestore para sincronizar com todos os clientes
    const roundRef = doc(db, "rounds", roundId);
    setDocumentNonBlocking(roundRef, {
      id: roundId,
      isScoresHidden: newValue,
      dateUpdated: serverTimestamp(),
    }, { merge: true });
    
    toast({ 
      title: newValue ? "Modo Privado Ativado" : "Modo Público Ativado", 
      description: newValue ? "Palpites ocultos para os jogadores." : "Todos os palpites estão visíveis!" 
    });
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

      const settingsRef = doc(db, "app_settings", "championship");
      setDocumentNonBlocking(settingsRef, {
        history: roundWinners,
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      const myPreds = predictions[user.uid];
      if (myPreds) {
        myPreds.forEach((pred, idx) => {
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
      }
      toast({ title: "Sincronizado!", description: "Dados salvos no AlphaBet Cloud." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha na sincronização." });
    } finally { setIsSaving(false); }
  };

  const handleLogout = () => { setMustChangePassword(false); signOut(auth); };

  const updatePrediction = (userId: string, idx: number, type: 'home' | 'away', value: string) => {
    setPredictions(prev => ({
      ...prev,
      [userId]: (prev[userId] || Array(10).fill({ homeScore: "", awayScore: "" })).map((p, i) => 
        i === idx ? { ...p, [type === 'home' ? 'homeScore' : 'awayScore']: value } : p
      )
    }));
  };

  const updateResult = (idx: number, type: 'home' | 'away', value: string) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, [type === 'home' ? 'homeScore' : 'awayScore']: value } : r));
  };

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

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
             
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded-full transition-colors pr-3">
                    <Avatar className="h-8 w-8 ring-2 ring-accent/30 bg-muted flex items-center justify-center">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-accent/20 text-accent font-black text-[10px]">
                        {user?.displayName ? user.displayName.substring(0,2).toUpperCase() : "AL"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-bold italic uppercase leading-none">{user?.displayName}</span>
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Nível Alpha</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl glass-card p-2">
                  <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-muted-foreground tracking-widest px-3 py-2">
                    Minha Conta
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setTimeout(() => {
                        setShowProfileDialog(true);
                      }, 150);
                    }}
                    className="rounded-xl gap-2 font-bold cursor-pointer py-3 focus:bg-primary/10"
                  >
                    <UserCircle className="h-4 w-4 text-primary" />
                    Editar Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDarkMode(!darkMode)} className="rounded-xl gap-2 font-bold cursor-pointer py-3 focus:bg-primary/10">
                    {darkMode ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-primary" />}
                    Tema {darkMode ? 'Claro' : 'Escuro'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl gap-2 font-bold cursor-pointer py-3 text-destructive focus:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                    Encerrar Sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>

          <div className="flex md:hidden items-center gap-3">
             <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black italic">#{currentRound}</Badge>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-10 w-10 ring-2 ring-accent/30 cursor-pointer bg-muted flex items-center justify-center">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-accent/20 text-accent font-black text-[10px]">
                      {user?.displayName ? user.displayName.substring(0,2).toUpperCase() : "AL"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl glass-card p-2">
                  <DropdownMenuLabel className="font-black italic uppercase text-[10px] text-muted-foreground tracking-widest px-3 py-2">
                    Minha Conta
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setTimeout(() => {
                        setShowProfileDialog(true);
                      }, 150);
                    }}
                    className="rounded-xl gap-2 font-bold cursor-pointer py-3 focus:bg-primary/10"
                  >
                    <UserCircle className="h-4 w-4 text-primary" />
                    Editar Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDarkMode(!darkMode)} className="rounded-xl gap-2 font-bold cursor-pointer py-3 focus:bg-primary/10">
                    {darkMode ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4 text-primary" />}
                    Tema {darkMode ? 'Claro' : 'Escuro'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/5" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl gap-2 font-bold cursor-pointer py-3 text-destructive focus:bg-destructive/10">
                    <LogOut className="h-4 w-4" />
                    Encerrar Sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none focus:outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Configurações de Perfil</DialogTitle>
            <DialogDescription>Personalize seu perfil na AlphaBet League.</DialogDescription>
          </DialogHeader>
          <ProfileSettings />
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Admin Control Bar - Visível para Jardel através do e-mail oficial */}
        {isAdminUser && (
          <div className="flex flex-col md:flex-row items-center justify-between bg-primary/5 p-5 rounded-[2rem] border border-primary/10 mb-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Painel Admin</span>
                <h3 className="text-sm font-black italic uppercase text-primary leading-none">Controle de Visibilidade</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <Badge className={cn(
                 "rounded-full px-4 py-1 text-[10px] font-black uppercase border-none h-10 flex items-center", 
                 placaresOcultos ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary"
               )}>
                  {placaresOcultos ? "Modo Privado Ativo" : "Modo Público Ativo"}
               </Badge>
               <Button 
                 size="lg" 
                 onClick={handleTogglePlacaresOcultos} 
                 className={cn(
                   "flex-1 md:flex-none rounded-2xl text-[10px] font-black uppercase h-10 px-8 gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                   placaresOcultos ? "bg-secondary hover:bg-secondary/90 text-white" : "bg-destructive hover:bg-destructive/90 text-white"
                 )}
               >
                 {placaresOcultos ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                 {placaresOcultos ? "Revelar Todos os Palpites" : "Ocultar Todos os Palpites"}
               </Button>
            </div>
          </div>
        )}

        <section className="space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Medal className="h-6 w-6 text-accent" />
                <h2 className="text-xl font-black italic uppercase">Pontuação da Rodada</h2>
              </div>
              {(loadingMatches || isLoadingBets) && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
           </div>
           <RankingSummary scores={scores} isScoresHidden={placaresOcultos} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <Tabs defaultValue="calendar" className="space-y-6">
              <TabsList className="w-full bg-muted/50 p-1 rounded-2xl h-14 overflow-x-auto no-scrollbar flex justify-start md:justify-center">
                <TabsTrigger value="calendar" className="gap-2 font-black uppercase text-[10px] rounded-xl data-[state=active]:shadow-lg shrink-0 px-6 h-10">
                  <Calendar className="h-4 w-4" />
                  Jogos & Palpites
                </TabsTrigger>
                <TabsTrigger value="betting" className="gap-2 font-black uppercase text-[10px] rounded-xl data-[state=active]:shadow-lg shrink-0 px-6 h-10">
                  <ListChecks className="h-4 w-4" />
                  Live Score League
                </TabsTrigger>
                <TabsTrigger value="overall" className="gap-2 font-black uppercase text-[10px] rounded-xl data-[state=active]:shadow-lg shrink-0 px-6 h-10">
                  <Trophy className="h-4 w-4" />
                  Ranking
                </TabsTrigger>
                <TabsTrigger value="standings" className="gap-2 font-black uppercase text-[10px] rounded-xl data-[state=active]:shadow-lg shrink-0 px-6 h-10">
                  <LayoutDashboard className="h-4 w-4" />
                  Tabela CBF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="outline-none">
                {currentRound !== null && (
                  <MatchCalendar 
                    matches={matches} 
                    round={currentRound} 
                    totalRounds={38}
                    predictions={predictions[user?.uid || ""] || Array(10).fill({ homeScore: "", awayScore: "" })}
                    setPrediction={(idx, type, value) => updatePrediction(user?.uid || "", idx, type, value)}
                    onPrev={() => setCurrentRound(prev => Math.max(1, prev! - 1))}
                    onNext={() => setCurrentRound(prev => Math.min(38, prev! + 1))}
                    onSave={handleSaveAll}
                    isSaving={isSaving}
                  />
                )}
              </TabsContent>

              <TabsContent value="betting" className="space-y-4 outline-none">
                <div className="flex items-center justify-between px-2">
                   <div className="flex flex-col">
                      <h3 className="font-black italic uppercase text-lg text-primary">{roundName}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Comparativo de palpites em tempo real</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <Badge className={cn("rounded-full px-3 text-[9px] font-black uppercase", placaresOcultos ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary")}>
                        {placaresOcultos ? "Modo Privado" : "Modo Público"}
                      </Badge>
                   </div>
                </div>
                <BettingTable 
                  roundName={roundName}
                  matchDescriptions={matchDescriptions}
                  predictions={predictions}
                  setPrediction={updatePrediction}
                  results={results}
                  setResult={updateResult}
                  placaresOcultos={placaresOcultos}
                  currentPlayerId={user?.uid || ""}
                  isAdmin={isAdminUser}
                  allUsers={allUsers || []}
                />
              </TabsContent>

              <TabsContent value="overall" className="outline-none">
                 <ChampionshipRanking roundWinners={roundWinners} setRoundWinners={setRoundWinners} allUsers={allUsers || []} />
              </TabsContent>

              <TabsContent value="standings" className="outline-none">
                 <LeagueStandings standings={standings} />
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
