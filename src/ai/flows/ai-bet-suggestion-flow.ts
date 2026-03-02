'use server';
/**
 * @fileOverview An AI agent that provides betting suggestions for football matches.
 *
 * - aiBetSuggestion - A function that generates AI-powered betting suggestions.
 * - AiBetSuggestionInput - The input type for the aiBetSuggestion function.
 * - AiBetSuggestionOutput - The return type for the aiBetSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the AI bet suggestion flow.
const AiBetSuggestionInputSchema = z.object({
  homeTeamName: z.string().describe('The name of the home team.'),
  awayTeamName: z.string().describe('The name of the away team.'),
  homeTeamForm: z.array(z.string()).describe('Recent match results for the home team (e.g., ["W", "D", "L", "W", "D"]). Each entry is a single-character string representing Win (W), Draw (D), or Loss (L).'),
  awayTeamForm: z.array(z.string()).describe('Recent match results for the away team (e.g., ["W", "D", "L", "W", "D"]). Each entry is a single-character string representing Win (W), Draw (D), or Loss (L).'),
  headToHeadMatches: z.array(z.object({
    homeTeamScore: z.number().describe('Score of the home team in a historical match.'),
    awayTeamScore: z.number().describe('Score of the away team in a historical match.'),
  })).describe('A list of historical head-to-head match results between the two teams.'),
  homeTeamLeagueRank: z.number().describe('The current league rank of the home team.'),
  awayTeamLeagueRank: z.number().describe('The current league rank of the away team.'),
});

export type AiBetSuggestionInput = z.infer<typeof AiBetSuggestionInputSchema>;

// Define the output schema for the AI bet suggestion flow.
const AiBetSuggestionOutputSchema = z.object({
  prediction: z.enum(['Home Win', 'Away Win', 'Draw']).describe('The predicted outcome of the match.'),
  suggestedHomeScore: z.number().describe('The suggested score for the home team.'),
  suggestedAwayScore: z.number().describe('The suggested score for the away team.'),
  reasoning: z.string().describe('Detailed reasoning for the betting suggestion, considering all provided data.'),
});

export type AiBetSuggestionOutput = z.infer<typeof AiBetSuggestionOutputSchema>;

/**
 * Generates an AI-powered betting suggestion for a football match.
 * @param input - The input data for the bet suggestion, including team names, form, and historical data.
 * @returns A promise that resolves to the AI\'s betting suggestion.
 */
export async function aiBetSuggestion(input: AiBetSuggestionInput): Promise<AiBetSuggestionOutput> {
  return aiBetSuggestionFlow(input);
}

// Define the prompt for the AI model.
const aiBetSuggestionPrompt = ai.definePrompt({
  name: 'aiBetSuggestionPrompt',
  input: {schema: AiBetSuggestionInputSchema},
  output: {schema: AiBetSuggestionOutputSchema},
  prompt: `You are an expert football analyst providing betting suggestions.
Analyze the following match details and provide a prediction, suggested score, and detailed reasoning in the specified JSON format.

Match Details:
Home Team: {{{homeTeamName}}} (League Rank: {{{homeTeamLeagueRank}}})
Away Team: {{{awayTeamName}}} (League Rank: {{{awayTeamLeagueRank}}})

Recent Form (last 5 matches - W=Win, D=Draw, L=Loss):
{{{homeTeamName}}}: {{#each homeTeamForm}}{{this}} {{/each}}
{{{awayTeamName}}}: {{#each awayTeamForm}}{{this}} {{/each}}

Head-to-Head Records:
{{#each headToHeadMatches}}
  - {{{homeTeamName}}} {{homeTeamScore}}-{{awayTeamScore}} {{{awayTeamName}}}
{{else}}
  No recent head-to-head records available.
{{/each}}

Based on this information, predict the match outcome, suggested scores, and provide your reasoning.
Ensure the output is a valid JSON object matching the output schema.`,
});

// Define the Genkit flow for AI bet suggestion.
const aiBetSuggestionFlow = ai.defineFlow(
  {
    name: 'aiBetSuggestionFlow',
    inputSchema: AiBetSuggestionInputSchema,
    outputSchema: AiBetSuggestionOutputSchema,
  },
  async (input) => {
    const {output} = await aiBetSuggestionPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a betting suggestion.');
    }
    return output;
  }
);
