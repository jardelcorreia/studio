'use server';
/**
 * @fileOverview An AI assistant that analyzes a bettor's historical performance.
 *
 * - analyzeBettingPerformance - A function that handles the betting performance analysis process.
 * - BettingPerformanceAnalysisInput - The input type for the analyzeBettingPerformance function.
 * - BettingPerformanceAnalysisOutput - The return type for the analyzeBettingPerformance function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlayerBetSchema = z.object({
  matchDescription: z.string().describe('Description of the match, e.g., "PAL x BOT".'),
  betHomeScore: z.number().describe("Player's predicted home team score."),
  betAwayScore: z.number().describe("Player's predicted away team score."),
});

const ActualResultSchema = z.object({
  matchDescription: z.string().describe('Description of the match, e.g., "PAL x BOT".'),
  actualHomeScore: z.number().describe("Actual home team score."),
  actualAwayScore: z.number().describe("Actual away team score."),
});

const HistoricalRoundSchema = z.object({
  roundName: z.string().describe('Name of the round, e.g., "Rodada 1".'),
  playerBets: z.array(PlayerBetSchema).describe("Player's bets for matches in this round."),
  actualResults: z.array(ActualResultSchema).describe("Actual results for matches in this round."),
  playerPoints: z.number().describe("Total points scored by the player in this round."),
  placaresExatos: z.number().describe("Number of exact scores predicted by the player in this round."),
  totalMatches: z.number().describe("Total number of matches in this round."),
});

const BettingPerformanceAnalysisInputSchema = z.object({
  playerName: z.string().describe("The name of the bettor."),
  historicalRounds: z.array(HistoricalRoundSchema).describe("An array of historical betting rounds for the player."),
});

export type BettingPerformanceAnalysisInput = z.infer<typeof BettingPerformanceAnalysisInputSchema>;

const BettingPerformanceAnalysisOutputSchema = z.object({
  summary: z.string().describe("A summary of the player's betting performance, highlighting accuracy, strengths, and areas for improvement."),
});

export type BettingPerformanceAnalysisOutput = z.infer<typeof BettingPerformanceAnalysisOutputSchema>;

export async function analyzeBettingPerformance(
  input: BettingPerformanceAnalysisInput
): Promise<BettingPerformanceAnalysisOutput> {
  return bettingPerformanceAnalysisFlow(input);
}

const bettingPerformanceAnalysisPrompt = ai.definePrompt({
  name: 'bettingPerformanceAnalysisPrompt',
  input: { schema: BettingPerformanceAnalysisInputSchema },
  output: { schema: BettingPerformanceAnalysisOutputSchema },
  prompt: `You are an expert sports betting analyst. Your task is to analyze the historical betting performance of a player and provide a summary of their accuracy and areas for improvement.

The player's name is: {{{playerName}}}

Here are the historical rounds with their bets and actual results:

{{#each historicalRounds}}
  --- Round: {{{roundName}}} ---
  Player Points: {{{playerPoints}}}
  Exact Scores: {{{placaresExatos}}} / {{{totalMatches}}}

  Player's Bets:
  {{#each playerBets}}
    Match: {{{matchDescription}}}, Bet: {{{betHomeScore}}} - {{{betAwayScore}}}
  {{/each}}

  Actual Results:
  {{#each actualResults}}
    Match: {{{matchDescription}}}, Actual: {{{actualHomeScore}}} - {{{actualAwayScore}}}
  {{/each}}
{{/each}}

Based on the provided data, generate a concise summary of {{{playerName}}}'s betting performance.
Highlight:
1.  Overall accuracy (mention exact scores and general outcome prediction if discernible).
2.  Strengths in their betting strategy.
3.  Specific areas for improvement.
4.  Actionable advice to refine their future betting strategy.

Your analysis should be insightful and actionable. Output in JSON format as per the output schema.
`,
});

const bettingPerformanceAnalysisFlow = ai.defineFlow(
  {
    name: 'bettingPerformanceAnalysisFlow',
    inputSchema: BettingPerformanceAnalysisInputSchema,
    outputSchema: BettingPerformanceAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await bettingPerformanceAnalysisPrompt(input);
    return output!;
  }
);
