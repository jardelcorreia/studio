
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from './use-toast';

// IMPORTANTE: Substitua por sua VAPID KEY gerada no console do Firebase
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
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === 'granted') {
        const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (fcmToken) {
          setToken(fcmToken);
          // Salva o token no Firestore
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(fcmToken)
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Permissão Negada',
          description: 'Ative as notificações nas configurações do seu navegador.'
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão FCM:', error);
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
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
    }
  }, [user, firestore, token]);

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
