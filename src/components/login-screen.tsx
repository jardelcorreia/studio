
"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, updatePassword } from "firebase/auth";
import { doc, serverTimestamp } from "firebase/firestore";
import { PLAYERS } from "@/lib/constants";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Shield, Loader2, Trophy, AlertCircle, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";

interface LoginScreenProps {
  onPasswordChangeRequired?: () => void;
  onPasswordChanged?: () => void;
  forcePasswordChange?: boolean;
}

export function LoginScreen({ onPasswordChangeRequired, onPasswordChanged, forcePasswordChange }: LoginScreenProps) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [showPasswordChange, setShowPasswordChange] = useState(forcePasswordChange || false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (forcePasswordChange) {
      setShowPasswordChange(true);
    }
  }, [forcePasswordChange]);

  const formatEmail = (name: string) => `${name.toLowerCase().trim().replace(/\s+/g, '')}@alphabet.com`;

  const ensureUserDocument = (uid: string, name: string) => {
    const userRef = doc(db, "users", uid);
    setDocumentNonBlocking(userRef, {
      id: uid,
      username: name,
      isAdmin: name === "Jardel",
      photoUrl: "",
      dateCreated: serverTimestamp(),
    }, { merge: true });

    if (name === "Jardel") {
      const adminRef = doc(db, "roles_admin", uid);
      setDocumentNonBlocking(adminRef, {
        userId: uid,
        grantedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !password) return;

    setLoading(true);
    setError(null);

    const email = formatEmail(playerName);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Garante que o documento existe no Firestore ao logar
      ensureUserDocument(userCredential.user.uid, playerName);

      if (password === "alphabet123") {
        onPasswordChangeRequired?.();
        setShowPasswordChange(true);
      } else {
        toast({
          title: `Bem-vindo de volta, ${playerName}!`,
          description: "Acesso autorizado.",
        });
      }
    } catch (err: any) {
      if ((err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") && password === "alphabet123") {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: playerName });
          
          // Cria o documento do novo usuário
          ensureUserDocument(userCredential.user.uid, playerName);

          toast({
            title: "Primeiro Acesso!",
            description: "Agora, por favor, defina uma senha segura.",
          });
          onPasswordChangeRequired?.();
          setShowPasswordChange(true);
        } catch (createErr: any) {
          setError("Erro ao configurar acesso. Verifique se o login com e-mail/senha está ativo no Console.");
        }
      } else {
        setError("Senha incorreta ou usuário não encontrado.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPassword === "alphabet123") {
      setError("Você não pode usar a senha padrão como sua nova senha.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast({
          title: "Senha Alterada!",
          description: "Sua conta está segura e pronta para o jogo.",
        });
        onPasswordChanged?.();
      }
    } catch (err: any) {
      setError("Erro ao atualizar senha. Tente deslogar e logar novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (showPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-2">
              <div className="h-16 w-16 bg-accent rounded-2xl flex items-center justify-center -rotate-3 shadow-lg">
                <KeyRound className="h-10 w-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Segurança Alpha</CardTitle>
            <CardDescription>Para sua proteção, escolha uma nova senha pessoal.</CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  className="h-12"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita a nova senha"
                  className="h-12"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full h-12 text-lg font-bold gap-2 bg-accent hover:bg-accent/90" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    SALVAR E ENTRAR
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center rotate-3 shadow-lg">
              < Trophy className="h-10 w-10 text-white" />
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
                * Primeiro acesso? Use a senha combinada com o admin.
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
