"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
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

  const ensureUserDocument = (uid: string, name: string, email: string, isInitialCreation: boolean = false) => {
    const isAdmin = email === "jardel@alphabet.com";
    const userRef = doc(db, "users", uid);
    
    const userData: any = {
      id: uid,
      isAdmin: isAdmin,
      dateUpdated: serverTimestamp(),
    };

    if (isInitialCreation) {
      userData.username = name;
      userData.photoUrl = "";
      userData.dateCreated = serverTimestamp();
    }
    
    setDocumentNonBlocking(userRef, userData, { merge: true });

    if (isAdmin) {
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
      ensureUserDocument(userCredential.user.uid, playerName, email, false);

      if (password === "alphabet123") {
        onPasswordChangeRequired?.();
        setShowPasswordChange(true);
      } else {
        toast({
          title: `Bem-vindo, ${playerName}!`,
          description: "Acesso autorizado à plataforma AlphaBet.",
        });
      }
    } catch (err: any) {
      if ((err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") && password === "alphabet123") {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: playerName });
          ensureUserDocument(userCredential.user.uid, playerName, email, true);

          toast({
            title: "Primeiro Acesso!",
            description: "Agora defina sua senha para garantir a segurança da sua conta.",
          });
          onPasswordChangeRequired?.();
          setShowPasswordChange(true);
        } catch (createErr: any) {
          setError("Erro ao criar perfil. Verifique a conexão.");
        }
      } else {
        setError("Senha incorreta ou usuário não autorizado.");
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
      setError("Use uma senha diferente da padrão.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast({
          title: "Senha Atualizada!",
          description: "Sua conta agora está protegida.",
        });
        onPasswordChanged?.();
      }
    } catch (err: any) {
      setError("Erro ao atualizar. Reconecte e tente novamente.");
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
            <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Alterar Senha</CardTitle>
            <CardDescription>Defina sua nova senha de acesso.</CardDescription>
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
            <div className="h-20 w-20 relative overflow-hidden rounded-2xl shadow-2xl -rotate-6 border-2 border-primary/20 bg-white">
              <Image 
                src="/icons/android-chrome-512x512.png" 
                alt="AlphaBet Logo" 
                fill 
                className="object-cover"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">AlphaBet 2026</CardTitle>
          <CardDescription>Entre com seu nome e senha</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player">Selecione seu Perfil</Label>
              <Select onValueChange={setPlayerName} value={playerName}>
                <SelectTrigger id="player" className="h-12">
                  <SelectValue placeholder="Escolha seu nome" />
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
                * Primeiro acesso? Use a senha inicial.
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
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR"}
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
