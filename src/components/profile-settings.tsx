"use client";

import React, { useState, useRef } from "react";
import { useFirebase } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera, Loader2, Save, User as UserIcon, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ProfileSettings() {
  const { user, storage, firestore } = useFirebase();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateName = async () => {
    if (!user || !displayName.trim()) return;
    setLoading(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { username: displayName.trim() });
      toast({ title: "Perfil Atualizado!", description: "Seu nome de exibição foi alterado." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível atualizar o nome." });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const storageRef = ref(storage, `avatars/${user.uid}`);
    
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      await updateProfile(user, { photoURL: url });
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { photoUrl: url });
      
      toast({ title: "Foto Atualizada!", description: "Sua nova foto de perfil está ativa." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Upload", description: "Certifique-se de que o Storage está habilitado no Console." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="glass-card border-none rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-32 sports-gradient relative">
           <div className="absolute -bottom-16 left-8 flex items-end gap-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background rounded-3xl shadow-xl bg-muted">
                  <AvatarImage src={user?.photoURL || ""} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black italic">
                    {user?.displayName?.substring(0, 2).toUpperCase() || "AL"}
                  </AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-2 right-2 h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
           </div>
        </div>
        
        <CardHeader className="pt-20 pb-4">
          <CardTitle className="text-2xl font-black italic uppercase text-primary">Configurações de Elite</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Personalize sua identidade na AlphaBet League</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="display-name" className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nome de Exibição</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                <Input 
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome de guerra"
                  className="h-12 pl-12 rounded-2xl border-primary/10 bg-primary/5 font-bold focus:ring-primary/20"
                />
              </div>
              <Button 
                onClick={handleUpdateName} 
                disabled={loading || !displayName.trim() || displayName === user?.displayName}
                className="h-12 w-12 rounded-2xl p-0 shrink-0 shadow-lg shadow-primary/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-start gap-4">
             <div className="h-8 w-8 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
                <Check className="h-4 w-4" />
             </div>
             <div>
                <p className="text-xs font-bold text-secondary uppercase italic">Sincronização em tempo real</p>
                <p className="text-[10px] text-muted-foreground">Suas alterações serão refletidas instantaneamente em todos os rankings da liga.</p>
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">AlphaBet Protocol v2.6 • Perfil de Atleta</p>
      </div>
    </div>
  );
}
