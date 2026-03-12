
"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { 
  Shield, 
  Loader2, 
  Trophy, 
  AlertCircle, 
  Lock, 
  ChevronRight, 
  Zap, 
  TrendingUp, 
  Users, 
  Smartphone, 
  CheckCircle2,
  ChevronDown,
  User,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import placeholderData from "@/app/lib/placeholder-images.json";

interface LoginScreenProps {
  onPasswordChangeRequired?: () => void;
  onPasswordChanged?: () => void;
  forcePasswordChange?: boolean;
}

export function LoginScreen({ onPasswordChangeRequired, onPasswordChanged, forcePasswordChange }: LoginScreenProps) {
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const [showPasswordChange, setShowPasswordChange] = useState(forcePasswordChange || false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isReady, setIsReady] = useState(false);

  const stadiumImage = placeholderData.placeholderImages.find(img => img.id === "soccer-stadium");

  useEffect(() => {
    const savedPlayer = localStorage.getItem("alphabet_last_player");
    if (savedPlayer && PLAYERS.includes(savedPlayer)) {
      setPlayerName(savedPlayer);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (forcePasswordChange) {
      setShowPasswordChange(true);
    }
  }, [forcePasswordChange]);

  const handlePlayerSelect = (val: string) => {
    setPlayerName(val);
    localStorage.setItem("alphabet_last_player", val);
  };

  const scrollToLogin = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#020617] relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Image src={stadiumImage?.imageUrl || ""} alt="" fill className="object-cover" />
        </div>
        <Card className="w-full max-w-md glass-card border border-white/10 rounded-[2.5rem] shadow-2xl relative z-10">
          <CardHeader className="text-center pt-10">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center -rotate-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-black italic uppercase text-primary">Segurança</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">Crie sua senha personalizada</CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4 px-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="h-14 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-bold"
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
                    placeholder="Repita a senha"
                    className="h-14 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-bold"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive text-[10px] font-black p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
            </CardContent>
            <CardFooter className="px-8 pb-10 pt-4">
              <Button type="submit" className="w-full h-16 rounded-2xl font-black italic uppercase text-lg sports-gradient shadow-xl" disabled={loading}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Salvar Senha"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src={stadiumImage?.imageUrl || ""} 
            alt="Estádio" 
            fill 
            className="object-cover opacity-30"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-in fade-in slide-in-from-top-12 duration-1000">
          <div className="flex justify-center">
            <div className="relative h-24 w-24 sm:h-32 sm:w-32 animate-float">
              <Image 
                src="/icons/android-chrome-512x512.png?v=3" 
                alt="AlphaBet Logo" 
                fill 
                className="object-contain"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter text-primary leading-[0.9]">
              AlphaBet <br />
              <span className="text-foreground">League</span>
            </h1>
            <p className="text-sm sm:text-lg font-bold text-muted-foreground uppercase tracking-widest">
              O Portal Oficial de Palpites <br className="sm:hidden" /> do Brasileirão 2026
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={scrollToLogin} size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl text-lg font-black italic uppercase sports-gradient shadow-2xl shadow-primary/40 group">
              Começar Agora
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              <Users className="h-4 w-4 text-primary" />
              +50 Jogadores Ativos
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer" onClick={scrollToLogin}>
          <ChevronDown className="h-8 w-8 text-primary/50" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card border-none rounded-[2rem] p-8 space-y-4 hover:translate-y-[-8px] transition-transform duration-500">
          <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
            <Zap className="h-7 w-7 fill-current" />
          </div>
          <h3 className="text-2xl font-black italic uppercase text-primary">Palpites Rápidos</h3>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Interface otimizada para você preencher seus placares em segundos. Não perca o prazo da quila!
          </p>
        </Card>

        <Card className="glass-card border-none rounded-[2rem] p-8 space-y-4 hover:translate-y-[-8px] transition-transform duration-500 delay-100">
          <div className="h-14 w-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent shadow-inner">
            <Trophy className="h-7 w-7 fill-current" />
          </div>
          <h3 className="text-2xl font-black italic uppercase text-accent">Ranking Real-Time</h3>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Acompanhe sua posição no ranking geral e da rodada enquanto os gols acontecem. Emoção pura!
          </p>
        </Card>

        <Card className="glass-card border-none rounded-[2rem] p-8 space-y-4 hover:translate-y-[-8px] transition-transform duration-500 delay-200">
          <div className="h-14 w-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary shadow-inner">
            <TrendingUp className="h-7 w-7" />
          </div>
          <h3 className="text-2xl font-black italic uppercase text-secondary">Análise de Dados</h3>
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Estatísticas detalhadas e palpites de especialistas para ajudar você a mitar em todas as rodadas.
          </p>
        </Card>
      </section>

      {/* Mobile Experience Section */}
      <section className="bg-primary/5 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full text-[10px] font-black uppercase italic">Mobile Experience</Badge>
            <h2 className="text-4xl sm:text-6xl font-black italic uppercase text-primary leading-tight">Feito para <br /> seu Celular</h2>
            <p className="text-sm sm:text-lg text-muted-foreground font-medium max-w-md mx-auto md:mx-0">
              Instale o app na sua tela inicial e receba notificações em tempo real. Viva o Brasileirão onde você estiver.
            </p>
            <ul className="space-y-4">
              {[
                "Push Notifications instantâneas",
                "Instalação PWA simplificada",
                "Modo Escuro automático",
                "Consumo mínimo de dados"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 font-bold text-xs uppercase italic text-primary/70">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="relative w-[280px] h-[580px] sm:w-[320px] sm:h-[650px] mx-auto rounded-[3rem] border-[12px] border-slate-900 shadow-2xl overflow-hidden bg-background">
               <Image src={stadiumImage?.imageUrl || ""} alt="Mockup" fill className="object-cover opacity-50" />
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center gap-4">
                  <Smartphone className="h-16 w-16 text-primary/20" />
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Interface Nativa</span>
               </div>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 h-64 w-64 bg-primary/20 blur-[100px] rounded-full -z-10" />
          </div>
        </div>
      </section>

      {/* Login Form Section */}
      <section ref={formRef} className="py-24 px-4 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        
        <div className="max-w-md mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase text-foreground">Acesse a Arena</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Escolha seu perfil para entrar</p>
          </div>

          <Card className="glass-card border-none rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-700">
            <form onSubmit={handleLogin}>
              <CardContent className="p-8 sm:p-10 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Quem é você?</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 z-10" />
                    {isReady && (
                      <Select key={playerName || "initial"} onValueChange={handlePlayerSelect} defaultValue={playerName}>
                        <SelectTrigger className="h-16 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-black italic uppercase text-sm focus:ring-primary/20">
                          <SelectValue placeholder="Selecione seu Perfil" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-primary/10">
                          {PLAYERS.map((player) => (
                            <SelectItem key={player} value={player} className="font-black italic uppercase text-sm focus:bg-primary/10 py-4">
                              {player}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Chave de Acesso</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-16 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-black text-lg focus:ring-primary/20"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium italic px-1">* Senha padrão para o primeiro acesso: alphabet123</p>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive text-[10px] font-black uppercase p-4 rounded-2xl flex items-center gap-3 border border-destructive/20 animate-in shake duration-300">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>

              <CardFooter className="px-8 sm:px-10 pb-10">
                <Button 
                  type="submit" 
                  className="w-full h-16 rounded-2xl text-xl font-black italic uppercase gap-3 sports-gradient shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group" 
                  disabled={loading || !playerName}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      Entrar no Jogo
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-primary/5 text-center space-y-4">
        <div className="flex justify-center items-center gap-2 opacity-30">
          <div className="h-px w-12 bg-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">AlphaBet League © 2026</span>
          <div className="h-px w-12 bg-primary" />
        </div>
      </footer>
    </div>
  );
}
