
"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { BrainCircuit, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { aiBetSuggestion, AiBetSuggestionOutput } from "@/ai/flows/ai-bet-suggestion-flow";
import { TEAMS } from "@/lib/constants";

export function AiBetAssistant() {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiBetSuggestionOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestion = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mocked data based on actual teams for the flow
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
      setError("Falha ao gerar sugestão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">Assistente AlphaAI</CardTitle>
        </div>
        <CardDescription>Análise inteligente para seus palpites da rodada.</CardDescription>
      </CardHeader>
      <CardContent>
        {!suggestion ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <Sparkles className="h-12 w-12 text-accent/50 animate-pulse" />
            <p className="text-sm text-center text-muted-foreground max-w-xs">
              Deixe nossa IA analisar os dados históricos e a forma atual dos times para você.
            </p>
            <Button onClick={generateSuggestion} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Analisando..." : "Gerar Palpite Sugerido"}
            </Button>
            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs mt-2">
                <AlertCircle className="h-3 w-3" /> {error}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-white dark:bg-card p-4 rounded-lg border border-primary/10 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase text-primary">Previsão</span>
                <Badge variant="outline" className="border-secondary text-secondary">{suggestion.prediction}</Badge>
              </div>
              
              <div className="flex items-center justify-center gap-8 py-2">
                <div className="text-center">
                  <div className="text-4xl font-black">{suggestion.suggestedHomeScore}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">CASA</div>
                </div>
                <div className="text-2xl font-light text-muted-foreground">vs</div>
                <div className="text-center">
                  <div className="text-4xl font-black">{suggestion.suggestedAwayScore}</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">FORA</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted/30 rounded text-xs leading-relaxed italic text-muted-foreground">
                "{suggestion.reasoning}"
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => setSuggestion(null)} className="w-full text-xs">
              Nova análise
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
