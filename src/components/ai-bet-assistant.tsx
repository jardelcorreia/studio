
"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { BrainCircuit, Sparkles, AlertCircle, Loader2, Zap } from "lucide-react";
import { aiBetSuggestion, AiBetSuggestionOutput } from "@/ai/flows/ai-bet-suggestion-flow";
import { Badge } from "./ui/badge";

export function AiBetAssistant() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiBetSuggestionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiBetSuggestion({
        homeTeamName: "Palmeiras",
        awayTeamName: "Botafogo",
        homeTeamForm: ["W", "W", "D", "W", "L"],
        awayTeamForm: ["W", "L", "W", "D", "W"],
        headToHeadMatches: [
          { homeTeamScore: 2, awayTeamScore: 1 },
          { homeTeamScore: 1, awayTeamScore: 1 }
        ],
        homeTeamLeagueRank: 2,
        awayTeamLeagueRank: 1
      });
      setSuggestion(result);
    } catch (err) {
      setError("Falha ao gerar sugestão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-none rounded-3xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
         <BrainCircuit className="h-32 w-32 text-primary" />
      </div>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <CardTitle className="text-xl font-black italic uppercase text-primary">AlphaAI Agent</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assistente de Probabilidades</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        {!suggestion ? (
          <div className="flex flex-col items-center py-8 gap-6">
            <div className="text-center space-y-2">
               <p className="text-xs font-medium leading-relaxed max-w-[240px]">
                 Nossa rede neural analisa dados de forma, histórico e performance atual para sugerir o placar mais provável.
               </p>
            </div>
            <Button onClick={generateSuggestion} disabled={loading} className="w-full h-12 rounded-2xl gap-2 font-black italic uppercase shadow-xl shadow-primary/20">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 fill-current" />}
              {loading ? "Processando..." : "Analisar Rodada"}
            </Button>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-[10px] font-bold uppercase">
                <AlertCircle className="h-3 w-3" /> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-black uppercase text-primary tracking-widest">Predição Sugerida</span>
                <Badge className="bg-accent text-accent-foreground font-black italic rounded-full px-3">{suggestion.prediction}</Badge>
              </div>
              
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-black italic text-primary">{suggestion.suggestedHomeScore}</div>
                  <div className="text-[8px] font-black text-muted-foreground uppercase mt-1">CASA</div>
                </div>
                <div className="h-12 w-px bg-primary/10 rotate-12" />
                <div className="text-center">
                  <div className="text-5xl font-black italic text-primary">{suggestion.suggestedAwayScore}</div>
                  <div className="text-[8px] font-black text-muted-foreground uppercase mt-1">FORA</div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-white/50 dark:bg-card/50 rounded-2xl text-[11px] leading-relaxed italic text-muted-foreground border border-dashed">
                "{suggestion.reasoning}"
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => setSuggestion(null)} className="w-full text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 rounded-xl">
              Nova Análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
