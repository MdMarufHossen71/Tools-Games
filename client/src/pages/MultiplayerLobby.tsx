import { useAuth } from "@/_core/hooks/useAuth";
import { useSettings } from "@/contexts/AppSettingsContext";
import { trpc } from "@/lib/trpc";
import { Copy, Gamepad2, LockKeyhole, Plus, Radio, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import "../multiplayer.css";

type MultiplayerSlug = "tic-tac-toe" | "connect-four";
const games: Array<{ slug: MultiplayerSlug; name: string; copy: string }> = [
  { slug: "tic-tac-toe", name: "Tic Tac Toe", copy: "Classic three-in-a-row, now in a private live match." },
  { slug: "connect-four", name: "Connect Four", copy: "Drop discs, make four, and out-think your opponent." },
];

export default function MultiplayerLobby() {
  const { t } = useSettings(); const { user, isAuthenticated, loading } = useAuth(); const [, navigate] = useLocation();
  const [gameSlug, setGameSlug] = useState<MultiplayerSlug>(() => new URLSearchParams(window.location.search).get("game") === "connect-four" ? "connect-four" : "tic-tac-toe");
  const [privacy, setPrivacy] = useState<"public" | "private">("private"); const [notice, setNotice] = useState("");
  const rooms = trpc.games.listRooms.useQuery({ gameSlug }, { refetchInterval: 10_000 });
  const createRoom = trpc.games.createRoom.useMutation({ onSuccess: (room) => navigate(`/games/room/${room.roomToken}`), onError: () => setNotice(t("games.relayUnavailable")) });
  const joinRoom = trpc.games.joinRoom.useMutation({ onSuccess: (room) => navigate(`/games/room/${room.roomToken}`), onError: () => setNotice(t("games.roomExpired")) });
  const displayName = user?.name?.trim().slice(0, 100) || "ToolsHUB Player";

  useEffect(() => { setNotice(""); }, [gameSlug]);
  const requireMember = (action: () => void) => { if (!isAuthenticated) { setNotice(t("games.saveGuest")); return; } action(); };
  return <main className="site-frame multiplayer-page">
    <section className="multiplayer-hero"><div><p className="eyebrow">TOOLS HUB / LIVE PLAY</p><h1>{t("games.lobbyTitle")}</h1><p>{t("games.lobbyCopy")}</p></div><Gamepad2 size={54} aria-hidden="true" /></section>
    <p className="relay-badge" role="note"><LockKeyhole size={17}/>{t("games.privacy")}</p>
    {!loading && !isAuthenticated && <div className="multiplayer-signin"><Users size={20}/><span>{t("games.saveGuest")}</span><Link href="/profile">{t("auth.signin")}</Link></div>}
    <section className="multiplayer-tabs" aria-label={t("games.multiplayer")}>{games.map((game) => <button key={game.slug} className={gameSlug === game.slug ? "active" : ""} onClick={() => setGameSlug(game.slug)}><span>{game.name}</span><small>{game.copy}</small></button>)}</section>
    <section className="lobby-layout"><div className="lobby-create"><h2>{t("games.createRoom")}</h2><p>Create an unguessable room code and invite one player. Open rooms disappear after inactivity.</p><div className="privacy-choice"><button className={privacy === "private" ? "selected" : ""} onClick={() => setPrivacy("private")}><LockKeyhole size={15}/>{t("games.privateRoom")}</button><button className={privacy === "public" ? "selected" : ""} onClick={() => setPrivacy("public")}><Radio size={15}/>{t("games.publicRoom")}</button></div><button className="lobby-primary" disabled={createRoom.isPending} onClick={() => requireMember(() => createRoom.mutate({ gameSlug, displayName, privacy }))}><Plus size={17}/>{t("games.createRoom")}</button></div>
      <div className="lobby-rooms"><div className="lobby-section-head"><h2>{t("games.availableRooms")}</h2><span>{rooms.data?.length ?? 0}</span></div>{rooms.isLoading ? <p>Loading rooms…</p> : rooms.data?.length ? <div className="room-list">{rooms.data.map((room) => <article key={room.roomToken}><div><strong>{room.displayName}</strong><small>{room.memberCount}/2 · {room.gameSlug === "connect-four" ? "Connect Four" : "Tic Tac Toe"}</small></div><button onClick={() => requireMember(() => joinRoom.mutate({ roomToken: room.roomToken, displayName }))}>{t("games.joinRoom")}</button></article>)}</div> : <div className="rooms-empty"><Copy size={21}/><span>{t("games.noRooms")}</span></div>}</div></section>
    {notice && <p className="multiplayer-notice" role="status">{notice}</p>}
  </main>;
}
