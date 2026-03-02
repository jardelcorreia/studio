
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PLAYERS, TEAMS } from "@/lib/constants";
import { Match, PlayerPredictions, Prediction, PlayerScore } from "@/lib/types";
import { RankingSummary } from "@/components/ranking-summary";
import { BettingTable } from "@/components/betting-table";
import { MatchCalendar } from "@/components/match-calendar";
import { AiBetAssistant } from "@/components/ai-bet-assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Sun, Moon, Shield, Save, Trophy, LayoutDashboard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock match data for Brazileirão
const MOCK_MATCHES: Match[] = [
  { id: 1, homeTeam: "SE Palmeiras", awayTeam: "Botafogo FR", utcDate: "2025-05-15T21:00:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 2, homeTeam: "CR Flamengo", awayTeam: "Fluminense FC", utcDate: "2025-05-15T21:30:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 3, homeTeam: "Grêmio FBPA", awayTeam: "São Paulo FC", utcDate: "2025-05-16T19:00:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 4, homeTeam: "CA Mineiro", awayTeam: "Cruzeiro EC", utcDate: "2025-05-16T21:00:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 5, homeTeam: "SC Internacional", awayTeam: "SC Corinthians Paulista", utcDate: "2025-05-17T16:00:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 6, homeTeam: "EC Bahia", awayTeam: "CR Vasco da Gama", utcDate: "2025-05-17T18:30:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 7, homeTeam: "Fortaleza EC", awayTeam: "RB Bragantino", utcDate: "2025-05-17T21:00:00Z", status: "SCHEDULED", matchday: 1 },
  { id: 8, homeTeam: "EC Vitória", awayTeam: "CA Paranaense", utcDate: "2025-05-18T16:00:00Z", status: "SCHEDULED", matchday: 1 },
];

export default function Home() {
  const { toast } = useToast();
  // Bypass login for development
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState("Jardel");
  const [password, setPassword] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  
  // App state
  const [roundName, setRoundName] = useState("Rodada 1");
  const [matchDescriptions, setMatchDescriptions] = useState<string[]>(Array(10).fill(""));
  const [predictions, setPredictions] = useState<PlayerPredictions>(
    Object.fromEntries(PLAYERS.map(p => [p, Array(10).fill({ homeScore: "", awayScore: "" })]))
  );
  const [results, setResults] = useState<Prediction[]>(Array(10).fill({ homeScore: "", awayScore: "" }));
  const [placaresOcultos, setPlacaresOcultos] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Authentication
  const handleLogin = () => {
    if (currentUser && password) {
      setIsLoggedIn(true);
      toast({ title: "Bem-vindo!", description: `Logado como ${currentUser}` });
    } else {
      toast({ variant: "destructive", title: "Erro de login", description: "Preencha usuário e senha." });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    setPassword("");
  };

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
        if (!desc || desc.toLowerCase().includes("sem jogo")) continue;

        const res = results[i];
        const pred = predictions[player][i];

        if (!pred.homeScore || !pred.awayScore) completed = false;
        if (!res.homeScore || !res.awayScore) continue;

        const rh = parseInt(res.homeScore);
        const ra = parseInt(res.awayScore);
        const ph = parseInt(pred.homeScore);
        const pa = parseInt(pred.awayScore);

        if (ph === rh && pa === ra) {
          points += 3;
          exactScores += 1;
        } else if ((ph > pa && rh > ra) || (ph < pa && rh < ra) || (ph === pa && rh === ra)) {
          points += 1;
        }
      }

      return { name: player, points, exactScores, betsCompleted: completed };
    });
  }, [matchDescriptions, results, predictions]);

  const scores = calculateScores();
  const maxPoints = Math.max(...scores.map(s => s.points));
  const topPlayers = scores.filter(s => s.points === maxPoints && maxPoints > 0);
  if (topPlayers.length > 0) {
    const maxExact = Math.max(...topPlayers.map(p => p.exactScores));
    scores.forEach(s => {
      if (s.points === maxPoints && s.exactScores === maxExact && maxPoints > 0) {
        s.isWinner = true;
      }
    });
  }

  // Effect for dark mode
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  if (!isLoggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-primary to-secondary/80">
        <Card className="w-full max-w-sm p-8 space-y-6 shadow-2xl bg-white/95 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary italic">ALPHABET</h1>
            <p className="text-muted-foreground font-medium">Faça seu login para apostar</p>
          </div>
          <div className="space-y-4">
            <Input 
              placeholder="Nome de usuário" 
              value={currentUser} 
              onChange={(e) => setCurrentUser(e.target.value)}
            />
            <Input 
              type="password" 
              placeholder="Senha" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Button className="w-full h-12 text-lg font-bold" onClick={handleLogin}>Entrar</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 pb-20">
      {/* Header section */}
      <div className="relative overflow-hidden bg-primary py-12 px-4 shadow-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-secondary to-accent" />
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-lg flex gap-2 flex-wrap justify-center">
            {"BRASILEIRÃO ALPHABET 2026".split(" ").map((word, wi) => (
              <span key={wi} className="flex">
                {word.split("").map((char, ci) => (
                  <span 
                    key={ci} 
                    className="animate-letter-reveal opacity-0" 
                    style={{ animationDelay: `${(wi * 10 + ci) * 0.05}s` }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <p className="text-white/80 font-medium tracking-widest uppercase">Liga de Apostas Profissional</p>
        </div>
        
        {/* Navbar-like controls */}
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
        {/* Admin and Global Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-card p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <span className="font-bold">Painel Alpha</span>
          </div>
          <div className="flex gap-2 ml-auto">
            {currentUser === "Jardel" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPlacaresOcultos(!placaresOcultos)}
                className="gap-2"
              >
                <Shield className="h-4 w-4 text-primary" />
                {placaresOcultos ? "Revelar Placares" : "Ocultar Placares"}
              </Button>
            )}
            <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/90" onClick={() => {
              setIsSaving(true);
              setTimeout(() => {
                setIsSaving(false);
                toast({ title: "Salvo!", description: "Suas apostas foram armazenadas com sucesso." });
              }, 1000);
            }}>
              <Save className="h-4 w-4" />
              Salvar Rodada
            </Button>
          </div>
        </div>

        {/* Ranking Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-black italic uppercase">Liderança da Rodada</h2>
          </div>
          <RankingSummary scores={scores} />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-12">
            {/* Betting Table */}
            <section className="space-y-4">
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
            </section>

            {/* Match Calendar */}
            <section className="space-y-4">
              <h2 className="text-2xl font-black italic uppercase flex items-center gap-2">
                <span className="h-8 w-2 bg-secondary" />
                Calendário Brasileirão
              </h2>
              <MatchCalendar 
                matches={MOCK_MATCHES}
                round={currentRound}
                totalRounds={38}
                onPrev={() => setCurrentRound(prev => Math.max(1, prev - 1))}
                onNext={() => setCurrentRound(prev => Math.min(38, prev + 1))}
              />
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <AiBetAssistant />
            
            <Card>
              <div className="p-4 bg-muted/20 border-b">
                <h3 className="font-bold flex items-center gap-2">Regras AlphaBet</h3>
              </div>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex gap-2">
                  <div className="h-4 w-4 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-white shrink-0">3</div>
                  <p>Placar Exato: Acertar os dois resultados garante 3 pontos.</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-4 w-4 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</div>
                  <p>Resultado: Acertar apenas o vencedor ou empate garante 1 ponto.</p>
                </div>
                <p className="text-muted-foreground italic">Em caso de empate na rodada, o critério de desempate é o número de placares exatos.</p>
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
          <p className="text-muted-foreground text-sm">© 2025 AlphaBet League. Desenvolvido para amantes de futebol.</p>
          <div className="flex justify-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Fair Play</span>
            <span>Data Real-Time</span>
            <span>Alpha Insights</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
