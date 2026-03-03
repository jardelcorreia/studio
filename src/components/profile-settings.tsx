
"use client";

import React, { useState, useRef, useCallback } from "react";
import { useFirebase } from "@/firebase";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera, Loader2, Save, User as UserIcon, Check, Trash2, Crop as CropIcon, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import Cropper, { Area } from "react-easy-crop";

export function ProfileSettings() {
  const { user, storage, firestore } = useFirebase();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Crop States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_extendedArea: Area, _croppedAreaPixels: Area) => {
    setCroppedAreaPixels(_croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleUploadCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels || !user) return;

    setUploading(true);
    setImageToCrop(null); // Fecha o dialog de crop
    
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Erro ao processar imagem");

      const storageRef = ref(storage, `avatars/${user.uid}`);
      const snapshot = await uploadBytes(storageRef, croppedBlob);
      const url = await getDownloadURL(snapshot.ref);
      
      await updateProfile(user, { photoURL: url });
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { photoUrl: url });
      
      toast({ title: "Foto Atualizada!", description: "Sua foto de perfil foi recortada e salva." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro no Upload", description: "Não foi possível salvar a imagem recortada." });
    } finally {
      setUploading(false);
      setZoom(1);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setUploading(true);
    
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      try {
        await deleteObject(storageRef);
      } catch (e) {
        // Ignora se o arquivo não existir
      }

      await updateProfile(user, { photoURL: "" });
      const userRef = doc(firestore, "users", user.uid);
      await updateDoc(userRef, { photoUrl: "" });
      
      toast({ title: "Foto Removida", description: "Seu avatar voltou ao padrão da liga." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível remover a foto." });
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
                <Avatar className="h-32 w-32 border-4 border-background rounded-3xl shadow-xl bg-muted overflow-hidden">
                  {user?.photoURL && <AvatarImage src={user.photoURL} className="object-cover w-full h-full" />}
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black italic">
                    {user?.displayName?.substring(0, 2).toUpperCase() || "AL"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="absolute -right-2 -bottom-2 flex flex-col gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                    title="Alterar Foto"
                  >
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  </button>
                  
                  {user?.photoURL && (
                    <button 
                      onClick={handleRemovePhoto}
                      disabled={uploading}
                      className="h-10 w-10 bg-destructive text-destructive-foreground rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                      title="Remover Foto"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
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

      {/* Manual Crop Dialog */}
      <Dialog open={!!imageToCrop} onOpenChange={() => setImageToCrop(null)}>
        <DialogContent className="max-w-xl p-0 border-none bg-background overflow-hidden">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="font-black italic uppercase flex items-center gap-2">
              <CropIcon className="h-5 w-5" />
              Enquadramento Alpha
            </DialogTitle>
            <DialogDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
              Ajuste sua imagem para o formato oficial da liga
            </DialogDescription>
          </DialogHeader>

          <div className="relative h-[400px] w-full bg-black">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                <span>Nível de Zoom</span>
                <span className="text-primary">{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[zoom]}
                  min={1}
                  max={3}
                  step={0.1}
                  onValueChange={(vals) => setZoom(vals[0])}
                  className="flex-1"
                />
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setImageToCrop(null)} className="rounded-xl font-bold uppercase text-[10px]">
                Cancelar
              </Button>
              <Button onClick={handleUploadCroppedImage} className="rounded-xl font-black italic uppercase text-xs gap-2 px-8">
                <Check className="h-4 w-4" />
                Confirmar Ajuste
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50">AlphaBet Protocol v2.6 • Perfil de Atleta</p>
      </div>
    </div>
  );
}
