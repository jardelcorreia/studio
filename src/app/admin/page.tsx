
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from "@/firebase";
import { doc, serverTimestamp, collection } from "firebase/firestore";
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
  TrendingUp,
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
              <h1 className="text-sm font-black italic uppercase text-primary">Painel Administrativo</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-9 px-4 rounded-xl font-black italic uppercase text-[10px] border-primary/20 text-primary">
              Admin: Jardel
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Tabs defaultValue="rodada" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 bg-muted/50 rounded-2xl p-1 mb-8">
            <TabsTrigger value="rodada" className="rounded-xl font-black italic uppercase text-[10px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <LayoutGrid className="h-4 w-4" />
              Gestão de Jogos
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="rounded-xl font-black italic uppercase text-[10px] gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <DollarSign className="h-4 w-4" />
              Valores da Liga
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rodada" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentRound(prev => Math.max(1, prev! - 1))}
                  className="rounded-2xl border-primary/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center min-w-[120px]">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Controle de Rodada</span>
                  <h2 className="text-2xl font-black italic uppercase text-primary leading-tight">#{currentRound}</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setCurrentRound(prev => Math.min(38, prev! + 1))}
                  className="rounded-2xl border-primary/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                 <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Privacidade</span>
                    <span className={cn("text-[11px] font-black italic uppercase", placaresOcultos ? "text-destructive" : "text-secondary")}>
                      {placaresOcultos ? "Palpites Ocultos" : "Palpites Liberados"}
                    </span>
                 </div>
                 <Button
                   variant={placaresOcultos ? "destructive" : "secondary"}
                   onClick={toggleVisibility}
                   className="rounded-2xl h-12 px-6 gap-2 font-black italic uppercase shadow-lg transition-all active:scale-95"
                 >
                   {placaresOcultos ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                   Mudar Status
                 </Button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black italic uppercase text-muted-foreground tracking-widest">Jogos Oficiais</h3>
                <div className="flex items-center gap-4">
                  {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
                  <Button 
                    onClick={handleSaveRound} 
                    disabled={saving || loading}
                    className="rounded-xl h-9 px-6 font-black italic uppercase gap-2 shadow-lg shadow-primary/20"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Rodada
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {matches.map((match, idx) => (
                  <Card key={match.id} className="glass-card border-none rounded-3xl overflow-hidden group">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
                          <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <span className="text-[11px] font-black italic uppercase text-primary leading-tight truncate">
                              {cleanTeamName(match.homeTeam)}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">CASA</span>
                          </div>
                          <Swords className="h-4 w-4 text-primary/20" />
                          <div className="flex flex-col items-center md:items-start text-center md:text-left">
                            <span className="text-[11px] font-black italic uppercase text-primary leading-tight truncate">
                              {cleanTeamName(match.awayTeam)}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">FORA</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-2xl border border-primary/5">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={match.homeScore ?? ""}
                              onChange={(e) => updateMatch(idx, { homeScore: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                              className="w-12 h-12 text-center rounded-xl font-black text-xl bg-background border-primary/10"
                              placeholder="-"
                            />
                            <span className="font-black text-primary/30 italic">X</span>
                            <Input
                              type="number"
                              value={match.awayScore ?? ""}
                              onChange={(e) => updateMatch(idx, { awayScore: e.target.value === "" ? undefined : parseInt(e.target.value) })}
                              className="w-12 h-12 text-center rounded-xl font-black text-xl bg-background border-primary/10"
                              placeholder="-"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <Select
                            value={match.status}
                            onValueChange={(val: MatchStatus) => updateMatch(idx, { status: val })}
                          >
                            <SelectTrigger className="h-12 flex-1 md:w-32 rounded-2xl font-black italic uppercase text-[10px] border-primary/10 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="upcoming" className="text-[10px] font-black italic uppercase">Agendado</SelectItem>
                              <SelectItem value="live" className="text-[10px] font-black italic uppercase text-destructive">Ao Vivo</SelectItem>
                              <SelectItem value="finished" className="text-[10px] font-black italic uppercase text-secondary">Finalizado</SelectItem>
                              <SelectItem value="cancelled" className="text-[10px] font-black italic uppercase text-muted-foreground">Adiado</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {match.status === 'finished' && (
                            <div className="h-12 w-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center shrink-0">
                              <CheckCircle2 className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="glass-card border-none rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black italic uppercase text-primary">Valores por Rodada</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Defina quanto vale cada rodada nos turnos</CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveLeagueSettings} 
                    disabled={saving}
                    className="rounded-xl h-10 px-6 font-black italic uppercase gap-2 shadow-lg shadow-primary/20"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Salvar Valores
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-muted-foreground ml-2 tracking-widest">1º Turno (R1 a R19)</label>
                    <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-primary/10 shadow-inner">
                      <span className="text-sm font-black text-primary">R$</span>
                      <input 
                        type="number" 
                        value={turn1Value} 
                        onChange={(e) => setTurn1Value(parseFloat(e.target.value) || 0)}
                        className="border-none bg-transparent font-black text-2xl focus:outline-none w-full h-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-muted-foreground ml-2 tracking-widest">2º Turno (R20 a R38)</label>
                    <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-primary/10 shadow-inner">
                      <span className="text-sm font-black text-primary">R$</span>
                      <input 
                        type="number" 
                        value={turn2Value} 
                        onChange={(e) => setTurn2Value(parseFloat(e.target.value) || 0)}
                        className="border-none bg-transparent font-black text-2xl focus:outline-none w-full h-10"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={applyTurnValues}
                    className="rounded-2xl h-16 font-black italic uppercase gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                  >
                    <Settings2 className="h-5 w-5" />
                    Aplicar em Massa
                  </Button>
                </div>

                <div className="pt-8 border-t border-primary/5">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-widest">Detalhamento por Rodada</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {roundWinners.map((rw, idx) => (
                      <div key={idx} className="bg-muted/30 p-3 rounded-xl border border-primary/5 flex flex-col items-center gap-1 group hover:border-primary/20 transition-all">
                        <span className="text-[8px] font-black uppercase text-muted-foreground/60">Rodada {rw.round}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-bold text-primary">R$</span>
                          <input 
                            type="number" 
                            value={rw.value} 
                            onChange={(e) => updateRoundWinnerValue(idx, parseFloat(e.target.value) || 0)}
                            className="w-10 bg-transparent text-center font-black text-sm focus:outline-none"
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

        {matches.length === 0 && !loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm font-black italic uppercase text-muted-foreground/40">Nenhum dado encontrado para processamento.</p>
          </div>
        )}
      </main>
    </div>
  );
}
