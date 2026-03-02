
"use client";

import React, { useState } from "react";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { PLAYERS } from "@/lib/constants";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Shield, Loader2, Trophy, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginScreen() {
  const auth = authInstance(); // Usando a instância do hook ou helper se disponível, mas aqui usaremos useAuth()
  const authHook = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formatEmail = (name: string) => `${name.toLowerCase().replace(/\s+/g, '')}@alphabet.com`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !password) return;

    setLoading(true);
    setError(null);

    const email = formatEmail(playerName);

    try {
      // Tenta fazer o login direto
      await signInWithEmailAndPassword(authHook, email, password);
      toast({
        title: `Bem-vindo, ${playerName}!`,
        description: "Acesso autorizado.",
      });
    } catch (err: any) {
      console.error("Erro no login:", err.code, err.message);

      // No Firebase moderno, 'auth/invalid-credential' substitui 'auth/user-not-found' 
      // e 'auth/wrong-password' por segurança.
      // Se falhar e a senha for a padrão, tentamos criar a conta (Primeiro Acesso)
      if ((err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") && password === "alphabet123") {
        try {
          const userCredential = await createUserWithEmailAndPassword(authHook, email, password);
          await updateProfile(userCredential.user, { displayName: playerName });
          
          toast({
            title: "Primeiro Acesso Realizado!",
            description: `Sua conta como ${playerName} foi configurada com sucesso.`,
          });
        } catch (createErr: any) {
          console.error("Erro ao criar conta:", createErr.code, createErr.message);
          if (createErr.code === "auth/email-already-in-use") {
            setError("Senha incorreta para este jogador.");
          } else {
            setError("Erro ao configurar acesso. O administrador precisa ativar o provedor de e-mail/senha no Firebase.");
          }
        }
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Senha incorreta ou usuário não encontrado.");
      } else {
        setError("Ocorreu um erro de conexão com o servidor de autenticação.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center rotate-3 shadow-lg">
              <Trophy className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">AlphaBet 2026</CardTitle>
          <CardDescription>Entre com seu nome e senha para palpitar</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player">Quem é você?</Label>
              <Select onValueChange={setPlayerName} value={playerName}>
                <SelectTrigger id="player" className="h-12">
                  <SelectValue placeholder="Selecione seu nome" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYERS.map((player) => (
                    <SelectItem key={player} value={player}>
                      {player}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic">
                * Dica: Use a senha padrão combinada para o primeiro acesso.
              </p>
            </div>
            {error && (
              <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-lg font-bold gap-2" disabled={loading || !playerName}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR NO JOGO"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="fixed bottom-4 text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
        Brasileirão AlphaBet League • 2026
      </div>
    </div>
  );
}
