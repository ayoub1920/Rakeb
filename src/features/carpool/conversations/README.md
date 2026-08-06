# carpool/conversations

**Status:** reserved — no code yet.

Messaging between a passenger and a driver. A conversation is created with the
booking; there is no "start a chat" entry point.

## Endpoints — `API Rakeb.md` §9

- `GET /conversations` — list with last message and unread count
- `GET /conversations/{id}/messages` — cursor paginated, newest first
- `POST /conversations/{id}/messages`
- `POST /conversations/{id}/read`
- `GET /conversations/quick-replies`
- `WS /ws/conversations/{id}` — live messages and typing indicator

## Screens

- `src/app/(tabs)/messages.tsx` — list
- `src/app/carpool/conversation/[id].tsx` — thread

## Notes

- Message history is the one paginated list that loads **backwards**; the
  `useInfiniteQuery` shape from `carpool/search` still applies, but the list is
  inverted.
- Optimistically append a sent message, and reconcile on the socket `message`
  event by id — the echo will arrive for messages the sender already rendered.
- Conversation socket event names are assumed, not documented. See open
  question 4 in `docs/API_FRONTEND_ANALYSIS.md`.
- Query scope: `QUERY_SCOPES.conversations`.
