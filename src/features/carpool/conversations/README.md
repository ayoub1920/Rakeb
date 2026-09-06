# carpool/conversations

**Status:** implemented against `rakeb-backend`, HTTP **and** websocket.
`api.ts`, `keys.ts`, `queries.ts`, `use-live-updates.ts` and both screens
wired to the real endpoints (HTTP paths also mirrored in the mock).

`POST /conversations/{id}/read` is called on thread open and on each new
message. The thread subscribes to `/ws/conversations` via
`useConversationLiveUpdates`: the driver's replies land live (`message`
event, folded into the same cache the HTTP path writes, deduped by id), plus
a "typing…" indicator both ways. Polling stays on as a fallback — slow (20 s)
while the socket is connected, quicker (5 s) when it isn't — so a dropped
socket only makes the thread slower, never stale. Mock mode skips the socket
entirely (an Axios adapter can't serve one).

Messaging between a passenger and a driver. A conversation is created with the
booking; there is no "start a chat" entry point — the thread opens from the
booking ticket ("Contacter le conducteur").

## Endpoints — `API Rakeb.md` §9

- `GET /conversations` — list with last message and unread count
- `GET /conversations/{id}/messages` — cursor paginated, newest first
- `POST /conversations/{id}/messages`
- `POST /conversations/{id}/read`
- `GET /conversations/quick-replies`
- `WS /ws/conversations` (Socket.IO namespace) — handshake `auth: { token }`;
  client `join` / `leave` / `typing` `{ conversation_id, … }`; server
  `message` (a `MessageResponse`), `read` `{ user_id, read_at }`, `typing`
  `{ user_id, is_typing }`, `error`

## Screens

- `src/app/(tabs)/messages.tsx` — list
- `src/app/carpool/conversation/[id].tsx` — thread

## Notes

- Message history is the one paginated list that loads **backwards**; the
  `useInfiniteQuery` shape from `carpool/search` still applies, but the list is
  inverted.
- A sent message is appended optimistically, reconciled by id from the HTTP
  response, and deduped again against the socket echo (which arrives for the
  sender's own messages too).
- Socket event names are confirmed against `ConversationsGateway` and covered
  by `rakeb-backend`'s `test/websocket.e2e-spec.ts`. `services/socket` is
  namespace-aware — one Socket.IO connection per namespace.
- Token refresh mid-session isn't handled on the socket yet: an expired
  handshake token fails the reconnect, and the polling fallback carries the
  thread until the screen remounts with a fresh token.
- Query scope: `QUERY_SCOPES.conversations`.
