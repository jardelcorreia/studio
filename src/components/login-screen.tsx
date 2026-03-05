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
import { Shield, Loader2, Trophy, AlertCircle, KeyRound, CheckCircle2, User, Lock, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[100px] rounded-full" />
        
        <Card className="w-full max-w-md glass-card border-none rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <CardHeader className="space-y-4 text-center pb-6 sm:pb-8 pt-6 sm:pt-8">
            <div className="flex justify-center">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center -rotate-6 shadow-sm bg-white p-0 overflow-hidden relative border border-black/5">
                <Image 
                  src="/icons/android-chrome-512x512.png" 
                  alt="AlphaBet Logo" 
                  fill
                  className="object-contain p-0.5"
                />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-primary">Segurança</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Atualize sua senha de acesso</CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 sm:h-14 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-bold focus:ring-primary/20"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input
                    type="password"
                    placeholder="Repita a nova senha"
                    className="h-12 sm:h-14 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-bold focus:ring-primary/20"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-[10px] font-black uppercase p-3 sm:p-4 rounded-2xl flex items-center gap-3 border border-destructive/20 animate-in shake duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2 sm:pt-4 pb-6 sm:pb-8">
              <Button type="submit" className="w-full h-14 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] text-base sm:text-lg font-black italic uppercase gap-3 sports-gradient shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={loading}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <>
                    <CheckCircle2 className="h-6 w-6" />
                    Finalizar Cadastro
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
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/30 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 blur-[120px] rounded-full animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md glass-card border-none rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardHeader className="space-y-4 sm:space-y-6 text-center pt-8 sm:pt-10 pb-4 sm:pb-8">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-[1.5rem] sm:rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-[1.5rem] sm:rounded-[1.8rem] shadow-sm -rotate-6 bg-white flex items-center justify-center transition-transform group-hover:rotate-0 duration-500 p-0 border border-black/5">
                <Image 
                  src="/icons/android-chrome-512x512.png" 
                  alt="AlphaBet Logo" 
                  fill 
                  className="object-contain p-0.5"
                  priority
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-primary leading-none">AlphaBet</CardTitle>
            <CardDescription className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground">League Brasileirão 2026</CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 sm:space-y-6 px-6 sm:px-8">
            <div className="space-y-1 sm:space-y-2">
              <Label className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Identificação</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 z-10" />
                <Select onValueChange={setPlayerName} value={playerName}>
                  <SelectTrigger className="h-12 sm:h-14 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-black italic uppercase text-xs focus:ring-primary/20">
                    <SelectValue placeholder="Escolha seu Perfil" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-primary/10">
                    {PLAYERS.map((player) => (
                      <SelectItem key={player} value={player} className="font-black italic uppercase text-xs focus:bg-primary/10 py-3">
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Chave de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="h-12 sm:h-14 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-black text-sm focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground/60 italic font-medium px-1">
                * Primeiro acesso use a senha padrão do campeonato.
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-[9px] sm:text-[10px] font-black uppercase p-3 sm:p-4 rounded-2xl flex items-center gap-3 border border-destructive/20 animate-in shake duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="px-6 sm:px-8 pb-8 sm:pb-10 pt-2 sm:pt-4">
            <Button 
              type="submit" 
              className="w-full h-14 sm:h-16 rounded-[1.25rem] sm:rounded-[1.5rem] text-lg sm:text-xl font-black italic uppercase gap-3 sports-gradient shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group" 
              disabled={loading || !playerName}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <>
                  Entrar na Arena
                  <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="fixed bottom-4 sm:bottom-8 flex flex-col items-center gap-2 opacity-30 sm:opacity-40 hover:opacity-100 transition-opacity">
        <div className="h-px w-8 sm:w-12 bg-primary/30" />
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-muted-foreground">Portal Oficial de Palpites</span>
      </div>
    </div>
  );
}
