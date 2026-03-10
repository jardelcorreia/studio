'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from './use-toast';

// VAPID KEY gerada no console do Firebase
const VAPID_KEY = 'BDJfhs7Q5xip0lcpZNOZp5APUhbIWpzwEuG9Vck9TI6wXmDrNedtdWy6Ky1ULQ58014V-uAZpHdoa1x6_iTGpo4';

export function useFcm() {
  const { messaging, user, firestore } = useFirebase();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!messaging || !user || !firestore) return;

    try {
      // Verifica se o navegador suporta Service Workers antes de tentar o registro
      if (!('serviceWorker' in navigator)) {
        throw new Error('Navegador não suporta Service Workers.');
      }

      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        // Registra explicitamente o service worker para evitar o AbortError
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        const fcmToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (fcmToken) {
          setToken(fcmToken);
          // Salva o token no Firestore
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(fcmToken)
          });
          
          toast({
            title: 'Notificações Ativas!',
            description: 'Você receberá alertas da rodada agora.'
          });
        }
      } else if (status === 'denied') {
        toast({
          variant: 'destructive',
          title: 'Permissão Negada',
          description: 'Ative as notificações nas configurações do seu navegador para não perder o prazo.'
        });
      }
    } catch (error: any) {
      console.error('Erro ao solicitar permissão FCM:', error);
      // Se for um AbortError ou erro de registro, avisa o usuário
      if (error.name === 'AbortError' || error.message.includes('service error')) {
        toast({
          variant: 'destructive',
          title: 'Erro de Conexão Push',
          description: 'O serviço de push do navegador falhou. Tente atualizar a página ou usar outro navegador.'
        });
      }
    }
  }, [messaging, user, firestore, toast]);

  const disableNotifications = useCallback(async () => {
    if (!user || !firestore || !token) return;

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token)
      });
      setToken(null);
      toast({
        title: 'Notificações Desativadas',
        description: 'Você não receberá mais lembretes de quila.'
      });
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
    }
  }, [user, firestore, token, toast]);

  // Listener para mensagens em primeiro plano (quando o app está aberto)
  useEffect(() => {
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      toast({
        title: payload.notification?.title || 'AlphaBet League',
        description: payload.notification?.body || 'Nova notificação recebida.',
      });
    });

    return () => unsubscribe();
  }, [messaging, toast]);

  return {
    permission,
    token,
    requestPermission,
    disableNotifications,
    isSupported: !!messaging
  };
}
