import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TEAMS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Limpa o nome do time removendo sufixos como FC, EC, AF e prefixos como Clube do.
 * Também utiliza o mapeamento manual de constants.ts para nomes padronizados.
 */
export function cleanTeamName(name: string): string {
  if (!name) return "";
  
  // Se já temos um mapeamento manual, usamos ele
  if (TEAMS[name]) return TEAMS[name].nome;

  // Caso contrário, aplicamos a limpeza por Regex
  return name
    .replace(/^(Clube\sdo\s|SE\s|SC\s|EC\s|CR\s|RB\s|CA\s|Atlético\sClube\s)/gi, '')
    .replace(/\s(FC|EC|SC|AC|AF|FR|FBPA|FBC|FBPC|CR|SE|RB|Club|Clube|Paulista|da\sGama|Foot\sBall\sClub|MG|PR|RJ|SP|RS)$/gi, '')
    .replace(/Athletico\sParanaense/gi, 'Athletico-PR')
    .replace(/Atlético\sMineiro/gi, 'Atlético-MG')
    .replace(/Atlético\sGoianiense/gi, 'Atlético-GO')
    .trim();
}
