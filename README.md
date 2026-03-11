
# AlphaBet League - Brasileirão 2026

Este é o portal oficial da AlphaBet League, uma plataforma de palpites para o Brasileirão focada em competição entre amigos e análise de dados.

## 🚀 Como usar o App

1. **QUILA/JOGOS**: Veja as partidas da rodada, horários e preencha seus palpites.
2. **Palpites**: Compare suas predições com as dos outros jogadores em tempo real.
3. **Ranking**: Acompanhe a classificação geral do campeonato e o saldo bancário da liga.
4. **Tabela**: Consulte a classificação oficial da Série A atualizada.

## 📦 Como Publicar (Deploy) via Terminal

Se o botão de "Publish" no painel falhar ou se você quiser forçar uma atualização manual, siga estes passos:

1. **Atualizar o CLI**: Garanta que tem a versão mais recente: `npm install -g firebase-tools`
2. **Login**: `firebase login`
3. **Publicar Regras e Funções**: `firebase deploy --only firestore:rules,functions`
4. **Publicar App (Next.js)**: 
   - O nome do seu backend é **studio**.
   - Use o comando abaixo para forçar uma nova versão do site:
   `firebase apphosting:rollouts:create studio`

> **💡 Dica de Produção**: Se você publicou e não vê as mudanças, use `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac) para limpar o cache do navegador e do Service Worker.

## 🔔 Sistema de Notificações (Push)

O app utiliza **Firebase Cloud Messaging (FCM)** e **Cloud Functions** para automação:

- **👀 Palpites Revelados**: Notifica todos quando os placares dos amigos tornam-se visíveis.
- **🎯 Na Mosca!**: Alerta imediato e individual quando você acerta um placar exato (3 pontos).
- **⚠️ Lembrete de Quila**: Job agendado que avisa quem ainda não completou os 10 palpites.
- **🔗 Deep Linking**: Cliques nas notificações abrem o app diretamente na aba correspondente.

## 🤖 Tecnologias e Design

- **Framework**: NextJS 15 (App Router)
- **UI/UX**: ShadCN UI + Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions, Messaging)
- **IA**: Genkit com modelos Gemini.

---
Desenvolvido com NextJS, ShadCN UI e Firebase Studio.
