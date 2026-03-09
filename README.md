# AlphaBet League - Brasileirão 2026

Este é o portal oficial da AlphaBet League, uma plataforma de palpites para o Brasileirão focada em competição entre amigos e análise de dados.

## 🚀 Como usar o App

1. **QUILA/JOGOS**: Veja as partidas da rodada, horários e preencha seus palpites.
2. **Palpites**: Compare suas predições com as dos outros jogadores em tempo real.
3. **Ranking**: Acompanhe a classificação geral do campeonato e o saldo bancário da liga.
4. **Tabela**: Consulte a classificação oficial da Série A atualizada.

## 🔔 Sistema de Notificações (Push)

O app utiliza **Firebase Cloud Messaging (FCM)** e **Cloud Functions** para automação:

- **👀 Palpites Revelados**: Notifica todos quando os placares dos amigos tornam-se visíveis.
- **🎯 Na Mosca!**: Alerta imediato e individual quando você acerta um placar exato (3 pontos).
- **⚠️ Lembrete de Quila**: Job agendado que avisa de hora em hora quem ainda não completou os 10 palpites da rodada.
- **🔗 Deep Linking**: Cliques nas notificações abrem o app diretamente na aba correspondente.

## 🤖 IA e Design

O app utiliza **Genkit** com modelos Gemini para análise de performance e sugestões de apostas.

---

Desenvolvido com NextJS, ShadCN UI e Firebase Studio.