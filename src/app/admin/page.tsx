
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Match, MatchStatus, ChampionshipWinner } from "@/lib/types";
import { getBrasileiraoMatches, getBrasileiraoCurrentMatchday } from "@/lib/football-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Swords,
  CheckCircle2,
  Settings2,
  DollarSign,
  LayoutGrid
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cleanTeamName, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placaresOcultos, setPlacaresOcultos] = useState(true);
  const [roundName, setRoundName] = useState("");

  // Configurações Globais
  const [turn1Value, setTurn1Value] = useState(6);
  const [turn2Value, setTurn2Value] = useState(6);
  const [roundWinners, setRoundWinners] = useState<ChampionshipWinner[]>(
    Array.from({ length: 38 }, (_, i) => ({
      round: i + 1,
      winners: "",
      value: 6,
      pointsMap: {}
    }))
  );

  const isAdmin = user?.email === "jardel@alphabet.com";

  const roundId = currentRound ? `round_${currentRound}` : null;
  const roundDocRef = useMemoFirebase(() => (roundId && user) ? doc(db, "rounds", roundId) : null, [db, roundId, user]);
  const { data: roundData } = useDoc(roundDocRef);

  const settingsDocRef = useMemoFirebase(() => user ? doc(db, "app_settings", "championship") : null, [db, user]);
  const { data: settingsData } = useDoc(settingsDocRef);

  useEffect(() => {
    if (!isUserLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isUserLoading, router]);

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
      setLoading(true);
      const rawData = await getBrasileiraoMatches(currentRound!);
      let data = rawData;

      if (roundData?.matches && Array.isArray(roundData.matches)) {
        data = data.map(m => {
          const override = roundData.matches.find((o: any) => o.id === m.id);
          if (override) {
            return {
              ...m,
              homeScore: override.homeScore !== undefined ? override.homeScore : m.homeScore,
              awayScore: override.awayScore !== undefined ? override.awayScore : m.awayScore,
              status: override.status || m.status,
            };
          }
          return m;
        });
      }
      setMatches(data);
      setLoading(false);
    }
    loadMatches();
  }, [currentRound, roundData?.matches]);

  const updateMatch = (idx: number, updates: Partial<Match>) => {
    setMatches(prev => prev.map((m, i) => i === idx ? { ...m, ...updates } : m));
  };

  const handleSaveRound = async () => {
    if (!currentRound || !roundId) return;
    setSaving(true);
    try {
      const roundRef = doc(db, "rounds", roundId);
      const matchOverrides = matches.map(m => ({
        id: m.id,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        status: m.status,
        utcDate: m.utcDate
      }));

      setDocumentNonBlocking(roundRef, {
        id: roundId,
        roundNumber: currentRound,
        name: roundName,
        isScoresHidden: placaresOcultos,
        matches: matchOverrides,
        dateUpdated: serverTimestamp(),
        dateCreated: roundData?.dateCreated || serverTimestamp(),
      }, { merge: true });

      toast({ title: "Sucesso!", description: "Dados da rodada atualizados." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLeagueSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, "app_settings", "championship");
      setDocumentNonBlocking(settingsRef, {
        history: roundWinners,
        dateUpdated: serverTimestamp(),
      }, { merge: true });
      toast({ title: "Configurações Salvas!", description: "Valores e vencedores sincronizados." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar configurações." });
    } finally {
      setSaving(false);
    }
  };

  const applyTurnValues = () => {
    const nextWinners = roundWinners.map((rw) => ({
      ...rw,
      value: rw.round <= 19 ? turn1Value : turn2Value
    }));
    setRoundWinners(nextWinners);
    toast({ title: "Valores Aplicados", description: "Clique em salvar para confirmar as alterações." });
  };

  const updateRoundWinnerValue = (roundIdx: number, val: number) => {
    setRoundWinners(prev => prev.map((rw, i) => i === roundIdx ? { ...rw, value: val } : rw));
  };

  const toggleVisibility = () => {
    setPlacaresOcultos(!placaresOcultos);
  };

  if (isUserLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="sticky top-0 z-50 glass-card border-none rounded-none shadow-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-sm font-black italic uppercase text-primary">Gestão AlphaBet</h1>
            </div>
          </div>
          <Button 
            onClick={handleSaveRound} 
            disabled={saving || loading}
            size="sm"
            className="rounded-xl h-9 px-6 font-black italic uppercase gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="rodada" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 rounded-2xl p-1 mb-6">
            <TabsTrigger value="rodada" className="rounded-xl font-black italic uppercase text-[9px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <LayoutGrid className="h-3.5 w-3.5" />
              Jogos
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl font-black italic uppercase text-[9px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <DollarSign className="h-3.5 w-3.5" />
              Liga
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rodada" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentRound(prev => Math.max(1, prev! - 1))}
                  className="h-8 w-8 rounded-lg border-primary/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center min-w-[80px]">
                  <h2 className="text-lg font-black italic uppercase text-primary leading-tight">R#{currentRound}</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentRound(prev => Math.min(38, prev! + 1))}
                  className="h-8 w-8 rounded-lg border-primary/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                 <Button
                   variant={placaresOcultos ? "destructive" : "secondary"}
                   onClick={toggleVisibility}
                   size="sm"
                   className="rounded-xl h-8 px-4 gap-2 font-black italic uppercase text-[9px] shadow-sm"
                 >
                   {placaresOcultos ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                   {placaresOcultos ? "Ocultos" : "Visíveis"}
                 </Button>
              </div>
            </section>

            <section className="space-y-2">
              <div className="grid grid-cols-1 gap-2">
                {matches.map((match, idx) => (
                  <Card key={match.id} className="glass-card border-none rounded-xl overflow-hidden group">
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                      {/* Times e Placar */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex flex-col items-end text-right flex-1 min-w-0">
                          <span className="text-[10px] font-black italic uppercase text-primary truncate leading-none">
                            {cleanTeamName(match.homeTeam)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-lg border border-primary/5 shrink-0">
                          <input
                            type="number"
                            value={match.homeScore ?? ""}
                            onChange={(e) => updateMatch(idx, { homeScore: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                            className="w-7 h-7 text-center rounded-md font-black text-sm bg-background border border-primary/10 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            placeholder="-"
                          />
                          <span className="font-black text-primary/20 italic text-[10px]">X</span>
                          <input
                            type="number"
                            value={match.awayScore ?? ""}
                            onChange={(e) => updateMatch(idx, { awayScore: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                            className="w-7 h-7 text-center rounded-md font-black text-sm bg-background border border-primary/10 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            placeholder="-"
                          />
                        </div>

                        <div className="flex flex-col items-start text-left flex-1 min-w-0">
                          <span className="text-[10px] font-black italic uppercase text-primary truncate leading-none">
                            {cleanTeamName(match.awayTeam)}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={match.status}
                          onValueChange={(val: MatchStatus) => updateMatch(idx, { status: val })}
                        >
                          <SelectTrigger className="h-8 w-24 rounded-lg font-black italic uppercase text-[8px] border-primary/10 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="upcoming" className="text-[9px] font-black italic uppercase">Agendado</SelectItem>
                            <SelectItem value="live" className="text-[9px] font-black italic uppercase text-destructive">Ao Vivo</SelectItem>
                            <SelectItem value="finished" className="text-[9px] font-black italic uppercase text-secondary">Fim</SelectItem>
                            <SelectItem value="cancelled" className="text-[9px] font-black italic uppercase text-muted-foreground">Adiado</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {match.status === 'finished' && (
                          <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="glass-card border-none rounded-2xl overflow-hidden">
              <CardHeader className="bg-primary/5 p-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-sm font-black italic uppercase text-primary">Valores da Liga</CardTitle>
                </div>
                <Button 
                  onClick={handleSaveLeagueSettings} 
                  disabled={saving}
                  size="sm"
                  className="rounded-lg h-8 px-4 font-black italic uppercase gap-2 text-[9px]"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Salvar
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">1º Turno (R1-19)</label>
                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl border border-primary/10">
                      <span className="text-xs font-black text-primary">R$</span>
                      <input 
                        type="number" 
                        value={turn1Value} 
                        onChange={(e) => setTurn1Value(parseFloat(e.target.value) || 0)}
                        className="border-none bg-transparent font-black text-lg focus:outline-none w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">2º Turno (R20-38)</label>
                    <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl border border-primary/10">
                      <span className="text-xs font-black text-primary">R$</span>
                      <input 
                        type="number" 
                        value={turn2Value} 
                        onChange={(e) => setTurn2Value(parseFloat(e.target.value) || 0)}
                        className="border-none bg-transparent font-black text-lg focus:outline-none w-full"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={applyTurnValues}
                  variant="outline"
                  className="w-full rounded-xl h-10 font-black italic uppercase gap-2 text-[9px] border-primary/20 text-primary hover:bg-primary/5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar Todas as 38 Rodadas
                </Button>

                <div className="pt-4 border-t border-primary/5">
                  <h4 className="text-[9px] font-black uppercase text-muted-foreground mb-3 tracking-widest">Individual</h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {roundWinners.map((rw, idx) => (
                      <div key={idx} className="bg-muted/30 p-2 rounded-lg border border-primary/5 flex flex-col items-center gap-0.5">
                        <span className="text-[7px] font-black uppercase text-muted-foreground/60">R{rw.round}</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[7px] font-bold text-primary">R$</span>
                          <input 
                            type="number" 
                            value={rw.value} 
                            onChange={(e) => updateRoundWinnerValue(idx, parseFloat(e.target.value) || 0)}
                            className="w-8 bg-transparent text-center font-black text-[10px] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
