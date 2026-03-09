
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
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cleanTeamName, cn } from "@/lib/utils";

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

  const handleSave = async () => {
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
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl h-9 px-6 font-black italic uppercase gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Tudo
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
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
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Gestão de Rodada</span>
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
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Visibilidade</span>
                <span className={cn("text-[11px] font-black italic uppercase", placaresOcultos ? "text-destructive" : "text-secondary")}>
                  {placaresOcultos ? "Oculto para usuários" : "Público para todos"}
                </span>
             </div>
             <Button
               variant={placaresOcultos ? "destructive" : "secondary"}
               onClick={toggleVisibility}
               className="rounded-2xl h-12 px-6 gap-2 font-black italic uppercase shadow-lg"
             >
               {placaresOcultos ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
               {placaresOcultos ? "Liberar Palpites" : "Ocultar Palpites"}
             </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black italic uppercase text-muted-foreground tracking-widest">Jogos da Rodada</h3>
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {matches.map((match, idx) => (
              <Card key={match.id} className="glass-card border-none rounded-3xl overflow-hidden group">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 justify-center md:justify-start">
                      <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] font-black italic uppercase text-primary leading-tight truncate">
                          {cleanTeamName(match.homeTeam)}
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">CASA</span>
                      </div>
                      <Swords className="h-4 w-4 text-primary/20" />
                      <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] font-black italic uppercase text-primary leading-tight truncate">
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

        {matches.length === 0 && !loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm font-black italic uppercase text-muted-foreground/40">Nenhum jogo encontrado para esta rodada.</p>
          </div>
        )}
      </main>
    </div>
  );
}
