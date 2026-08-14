/** Cobalt Workshop design reminder: this is a tactile peer desk, with deep-ink rails, paper work surfaces, and all interaction visibly local to the two connected devices. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Peer, { type DataConnection } from "peerjs";
import QRCode from "qrcode";
import { Check, Clipboard, Copy, Download, FileUp, KeyRound, Link2, Loader2, LockKeyhole, MessageSquareText, QrCode, Send, ShieldCheck, Smartphone, Upload, UsersRound, X } from "lucide-react";
import { useTranslation } from "@/contexts/AppSettingsContext";

type ShareMode = "files" | "text" | "password";
type FileMeta = { name: string; size: number; type: string; path?: string };
type RemoteDevice = { id: string; name: string };
type TransferOffer = { id: string; files: FileMeta[]; totalSize: number };
type ReceivedFile = { name: string; size: number; type: string; url: string };
type PasswordPacket = { id: string; salt: string; iv: string; ciphertext: string; hasPassphrase: boolean; expiresAt: number | null };
type IncomingPassword = PasswordPacket & { plain?: { password: string; username?: string; website?: string } };
type WireMessage =
  | { type: "hello"; device: RemoteDevice }
  | { type: "text"; id: string; text: string; at: number }
  | { type: "file-offer"; offer: TransferOffer }
  | { type: "file-accept"; id: string }
  | { type: "file-reject"; id: string }
  | { type: "file-start"; id: string; index: number; file: FileMeta }
  | { type: "file-end"; id: string; index: number }
  | { type: "file-complete"; id: string }
  | { type: "crypto-key"; publicKey: string }
  | { type: "password-card"; packet: PasswordPacket }
  | { type: "password-copied"; id: string }
  | { type: "password-expired"; id: string }
  | { type: "password-removed"; id: string };

const CHUNK_BYTES = 24 * 1024;
const deviceAdjectives = ["Red", "Blue", "Golden", "Swift", "Quiet", "Bright", "Silver", "Cobalt"];
const deviceAnimals = ["Falcon", "Duck", "Tiger", "Otter", "Fox", "Crane", "Panda", "Lynx"];

function deviceFromId(id: string): RemoteDevice {
  const score = Array.from(id).reduce((total, char) => total + char.charCodeAt(0), 0);
  return { id, name: `${deviceAdjectives[score % deviceAdjectives.length]} ${deviceAnimals[Math.floor(score / deviceAdjectives.length) % deviceAnimals.length]}` };
}

function randomId(prefix: string) {
  return `${prefix}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}-${Date.now().toString(36)}`;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function formatBytes(value: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** unit)).toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function formatSpeed(bytes: number, startedAt: number) {
  const seconds = Math.max((Date.now() - startedAt) / 1000, 0.1);
  return `${formatBytes(bytes / seconds)}/s`;
}

type ConnectionKeys = { privateKey: CryptoKey; publicKey: CryptoKey; remotePublicKey?: CryptoKey };

async function derivePasswordKey(connectionKeys: ConnectionKeys, salt: string, passphrase: string) {
  if (!connectionKeys.remotePublicKey) throw new Error("Secure connection key is not ready");
  const sharedBits = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: connectionKeys.remotePublicKey }, connectionKeys.privateKey, 256));
  const passphraseBytes = new TextEncoder().encode(passphrase);
  const material = new Uint8Array(sharedBits.length + passphraseBytes.length);
  material.set(sharedBits);
  material.set(passphraseBytes, sharedBits.length);
  const base = await crypto.subtle.importKey("raw", material, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: base64ToBytes(salt), iterations: 120000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptPasswordCard(value: { password: string; username?: string; website?: string }, connectionKeys: ConnectionKeys, salt: string, passphrase: string) {
  const key = await derivePasswordKey(connectionKeys, salt, passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(encrypted)) };
}

async function decryptPasswordCard(packet: PasswordPacket, connectionKeys: ConnectionKeys, passphrase: string) {
  const key = await derivePasswordKey(connectionKeys, packet.salt, passphrase);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(packet.iv) }, key, base64ToBytes(packet.ciphertext));
  return JSON.parse(new TextDecoder().decode(decrypted)) as { password: string; username?: string; website?: string };
}

export default function FileShare() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ShareMode>("files");
  const [peerId, setPeerId] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [manualId, setManualId] = useState("");
  const [status, setStatus] = useState<"starting" | "ready" | "connecting" | "connected" | "error">("starting");
  const [statusDetail, setStatusDetail] = useState("");
  const [remote, setRemote] = useState<RemoteDevice | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [incomingOffer, setIncomingOffer] = useState<TransferOffer | null>(null);
  const [outgoingProgress, setOutgoingProgress] = useState({ active: false, done: 0, total: 0, startedAt: 0 });
  const [incomingProgress, setIncomingProgress] = useState({ active: false, done: 0, total: 0, startedAt: 0 });
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [textDraft, setTextDraft] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; text: string; own: boolean; at: number }>>([]);
  const [passwordDraft, setPasswordDraft] = useState({ password: "", username: "", website: "", passphrase: "", expiry: "15" });
  const [outgoingPassword, setOutgoingPassword] = useState<{ id: string; expiresAt: number | null } | null>(null);
  const [incomingPassword, setIncomingPassword] = useState<IncomingPassword | null>(null);
  const [unlockPassphrase, setUnlockPassphrase] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [clipboardNeedsClear, setClipboardNeedsClear] = useState(false);
  const peerRef = useRef<Peer | null>(null);
  const connectionRef = useRef<DataConnection | null>(null);
  const selectedFilesRef = useRef<File[]>([]);
  const outgoingPasswordTimer = useRef<number | undefined>(undefined);
  const incomingPasswordTimer = useRef<number | undefined>(undefined);
  const receiveRef = useRef<{ id: string; current?: { meta: FileMeta; index: number; chunks: Uint8Array[] }; files: ReceivedFile[]; done: number; total: number; startedAt: number } | null>(null);
  const connectionKeysRef = useRef<ConnectionKeys | null>(null);
  const remotePublicKeyRawRef = useRef<string | null>(null);
  const [keyReady, setKeyReady] = useState(false);
  const autoConnectDone = useRef(false);
  const myDevice = useMemo(() => peerId ? deviceFromId(peerId) : { id: "", name: "…" }, [peerId]);

  const send = useCallback((message: WireMessage | ArrayBuffer) => {
    if (connectionRef.current?.open) connectionRef.current.send(message);
  }, []);

  const applyRemotePublicKey = useCallback(async (encoded: string) => {
    remotePublicKeyRawRef.current = encoded;
    if (!connectionKeysRef.current) return;
    const remotePublicKey = await crypto.subtle.importKey("raw", base64ToBytes(encoded), { name: "ECDH", namedCurve: "P-256" }, false, []);
    if (!connectionKeysRef.current) return;
    connectionKeysRef.current.remotePublicKey = remotePublicKey;
    setKeyReady(true);
  }, []);

  const createConnectionKeys = useCallback(async () => {
    const generated = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
    connectionKeysRef.current = { privateKey: generated.privateKey, publicKey: generated.publicKey };
    setKeyReady(false);
    if (remotePublicKeyRawRef.current) await applyRemotePublicKey(remotePublicKeyRawRef.current);
    const rawPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", generated.publicKey));
    send({ type: "crypto-key", publicKey: bytesToBase64(rawPublicKey) });
  }, [applyRemotePublicKey, send]);

  const clearOutgoingPassword = useCallback((id?: string, notifyPeer = false) => {
    if (!outgoingPassword || (id && outgoingPassword.id !== id)) return;
    window.clearTimeout(outgoingPasswordTimer.current);
    if (notifyPeer) send({ type: "password-removed", id: outgoingPassword.id });
    setOutgoingPassword(null);
  }, [outgoingPassword, send]);

  const clearIncomingPassword = useCallback((id?: string, notifyPeer = false) => {
    if (!incomingPassword || (id && incomingPassword.id !== id)) return;
    window.clearTimeout(incomingPasswordTimer.current);
    if (notifyPeer) send({ type: "password-removed", id: incomingPassword.id });
    setIncomingPassword(null);
    setUnlockPassphrase("");
    setPasswordError("");
  }, [incomingPassword, send]);

  const scheduleIncomingPasswordExpiry = useCallback((packet: PasswordPacket) => {
    window.clearTimeout(incomingPasswordTimer.current);
    if (!packet.expiresAt) return;
    const wait = Math.max(packet.expiresAt - Date.now(), 0);
    incomingPasswordTimer.current = window.setTimeout(() => {
      send({ type: "password-expired", id: packet.id });
      setIncomingPassword((current) => current?.id === packet.id ? null : current);
      setPasswordNotice(t("share.passwordExpired"));
    }, wait);
  }, [send, t]);

  const settleConnection = useCallback((connection: DataConnection) => {
    connectionRef.current = connection;
    const connect = () => {
      setStatus("connected");
      setStatusDetail("");
      send({ type: "hello", device: myDevice });
      void createConnectionKeys();
      setRemote(deviceFromId(connection.peer));
    };
    connection.on("open", connect);
    connection.on("close", () => {
      if (connectionRef.current === connection) {
        connectionRef.current = null;
        connectionKeysRef.current = null;
        remotePublicKeyRawRef.current = null;
        setKeyReady(false);
        setRemote(null);
        setStatus("ready");
        setStatusDetail(t("share.disconnected"));
      }
    });
    connection.on("error", () => {
      setStatus("error");
      setStatusDetail(t("share.connectionError"));
    });
    connection.on("data", (raw) => {
      if (raw instanceof ArrayBuffer) {
        const active = receiveRef.current;
        if (!active?.current) return;
        const chunk = new Uint8Array(raw);
        active.current.chunks.push(chunk);
        active.done += chunk.byteLength;
        setIncomingProgress({ active: true, done: active.done, total: active.total, startedAt: active.startedAt });
        return;
      }
      const message = raw as WireMessage;
      if (!message || !("type" in message)) return;
      if (message.type === "hello") {
        setRemote(message.device);
      } else if (message.type === "crypto-key") {
        void applyRemotePublicKey(message.publicKey);
      } else if (message.type === "text") {
        setMessages((current) => [...current, { id: message.id, text: message.text, own: false, at: message.at }]);
      } else if (message.type === "file-offer") {
        setIncomingOffer(message.offer);
      } else if (message.type === "file-accept") {
        void sendSelectedFiles(message.id);
      } else if (message.type === "file-reject") {
        setOutgoingProgress({ active: false, done: 0, total: 0, startedAt: 0 });
        setStatusDetail(t("share.transferDeclined"));
      } else if (message.type === "file-start") {
        const active = receiveRef.current;
        if (active?.id === message.id) active.current = { meta: message.file, index: message.index, chunks: [] };
      } else if (message.type === "file-end") {
        const active = receiveRef.current;
        if (active?.id === message.id && active.current) {
          const blob = new Blob(active.current.chunks, { type: active.current.meta.type || "application/octet-stream" });
          const received = { name: active.current.meta.name, size: blob.size, type: active.current.meta.type, url: URL.createObjectURL(blob) };
          active.files.push(received);
          active.current = undefined;
          setReceivedFiles((current) => [...current, received]);
        }
      } else if (message.type === "file-complete") {
        setIncomingProgress((current) => ({ ...current, active: false }));
        setIncomingOffer(null);
        receiveRef.current = null;
      } else if (message.type === "password-card") {
        setIncomingPassword(message.packet);
        setPasswordError("");
        setPasswordNotice(t("share.passwordArrived"));
        scheduleIncomingPasswordExpiry(message.packet);
      } else if (message.type === "password-copied") {
        setOutgoingPassword((current) => current?.id === message.id ? null : current);
        window.clearTimeout(outgoingPasswordTimer.current);
        setPasswordNotice(t("share.passwordCopiedSender"));
      } else if (message.type === "password-expired") {
        setIncomingPassword((current) => current?.id === message.id ? null : current);
        setOutgoingPassword((current) => current?.id === message.id ? null : current);
        setPasswordNotice(t("share.passwordExpired"));
      } else if (message.type === "password-removed") {
        setIncomingPassword((current) => current?.id === message.id ? null : current);
        setOutgoingPassword((current) => current?.id === message.id ? null : current);
      }
    });
  // sendSelectedFiles is declared later and is stable after component setup; the peer event invokes it only after a transfer request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyRemotePublicKey, createConnectionKeys, myDevice, scheduleIncomingPasswordExpiry, send, t]);

  const connectToPeer = useCallback((targetId: string) => {
    const normalized = targetId.trim();
    if (!peerRef.current || !normalized || normalized === peerId) return;
    if (connectionRef.current?.open && connectionRef.current.peer === normalized) return;
    connectionRef.current?.close();
    setStatus("connecting");
    setStatusDetail(t("share.connecting"));
    settleConnection(peerRef.current.connect(normalized, { reliable: true, serialization: "binary" }));
  }, [peerId, settleConnection, t]);

  const sendSelectedFiles = useCallback(async (transferId: string) => {
    const queue = selectedFilesRef.current;
    const total = queue.reduce((sum, file) => sum + file.size, 0);
    if (!connectionRef.current?.open || !queue.length) return;
    const startedAt = Date.now();
    let done = 0;
    setOutgoingProgress({ active: true, done, total, startedAt });
    for (let fileIndex = 0; fileIndex < queue.length; fileIndex += 1) {
      const file = queue[fileIndex];
      const meta: FileMeta = { name: file.name, size: file.size, type: file.type, path: file.webkitRelativePath || undefined };
      send({ type: "file-start", id: transferId, index: fileIndex, file: meta });
      for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
        const chunk = await file.slice(offset, offset + CHUNK_BYTES).arrayBuffer();
        send(chunk);
        done += chunk.byteLength;
        if (done % (CHUNK_BYTES * 8) === 0 || done === total) setOutgoingProgress({ active: true, done, total, startedAt });
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
      send({ type: "file-end", id: transferId, index: fileIndex });
    }
    send({ type: "file-complete", id: transferId });
    setOutgoingProgress({ active: false, done: total, total, startedAt });
    setFiles([]);
    selectedFilesRef.current = [];
  }, [send]);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;
    peer.on("open", (id) => {
      setPeerId(id);
      setStatus("ready");
      setStatusDetail("");
    });
    peer.on("connection", settleConnection);
    peer.on("error", () => { setStatus("error"); setStatusDetail(t("share.peerError")); });
    const cleanUp = () => peer.destroy();
    window.addEventListener("beforeunload", cleanUp);
    return () => {
      window.removeEventListener("beforeunload", cleanUp);
      window.clearTimeout(outgoingPasswordTimer.current);
      window.clearTimeout(incomingPasswordTimer.current);
      receivedFiles.forEach((file) => URL.revokeObjectURL(file.url));
      cleanUp();
    };
  // Peer lifecycle should start once; all current device details are transmitted after each connection opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!peerId) return;
    const shareUrl = `${window.location.href.split("#")[0]}#/tools/file-share?peer=${encodeURIComponent(peerId)}`;
    void QRCode.toDataURL(shareUrl, { width: 320, margin: 1, errorCorrectionLevel: "M" }).then(setQrDataUrl);
    const target = new URLSearchParams(window.location.hash.split("?")[1] || "").get("peer");
    if (target && target !== peerId && !autoConnectDone.current) {
      autoConnectDone.current = true;
      window.setTimeout(() => connectToPeer(target), 120);
    }
  }, [connectToPeer, peerId]);

  const chooseFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const selected = Array.from(list);
    setFiles(selected);
    selectedFilesRef.current = selected;
  };

  const offerFiles = () => {
    if (!connectionRef.current?.open || !files.length) return;
    const offer: TransferOffer = {
      id: randomId("transfer"),
      files: files.map((file) => ({ name: file.name, size: file.size, type: file.type, path: file.webkitRelativePath || undefined })),
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    };
    send({ type: "file-offer", offer });
    setOutgoingProgress({ active: true, done: 0, total: offer.totalSize, startedAt: Date.now() });
  };

  const acceptFiles = () => {
    if (!incomingOffer) return;
    receiveRef.current = { id: incomingOffer.id, files: [], done: 0, total: incomingOffer.totalSize, startedAt: Date.now() };
    setIncomingProgress({ active: true, done: 0, total: incomingOffer.totalSize, startedAt: Date.now() });
    send({ type: "file-accept", id: incomingOffer.id });
  };

  const sendText = () => {
    const text = textDraft.trim();
    if (!text || !connectionRef.current?.open) return;
    const message = { id: randomId("message"), text, at: Date.now() };
    send({ type: "text", ...message });
    setMessages((current) => [...current, { ...message, own: true }]);
    setTextDraft("");
  };

  const sendPassword = async () => {
    if (!passwordDraft.password || !connectionKeysRef.current?.remotePublicKey || !connectionRef.current?.open) return;
    const id = randomId("password");
    const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(18)));
    const selectedMinutes = Number(passwordDraft.expiry);
    const expiresAt = selectedMinutes ? Date.now() + selectedMinutes * 60 * 1000 : null;
    const encrypted = await encryptPasswordCard(
      { password: passwordDraft.password, username: passwordDraft.username || undefined, website: passwordDraft.website || undefined },
      connectionKeysRef.current,
      salt,
      passwordDraft.passphrase,
    );
    const packet: PasswordPacket = { id, salt, ...encrypted, hasPassphrase: Boolean(passwordDraft.passphrase), expiresAt };
    send({ type: "password-card", packet });
    setOutgoingPassword({ id, expiresAt });
    setPasswordDraft({ password: "", username: "", website: "", passphrase: "", expiry: passwordDraft.expiry });
    setPasswordNotice(t("share.passwordSent"));
    window.clearTimeout(outgoingPasswordTimer.current);
    if (expiresAt) {
      outgoingPasswordTimer.current = window.setTimeout(() => {
        send({ type: "password-expired", id });
        setOutgoingPassword((current) => current?.id === id ? null : current);
        setPasswordNotice(t("share.passwordExpired"));
      }, Math.max(expiresAt - Date.now(), 0));
    }
  };

  const revealAndCopyPassword = async () => {
    if (!incomingPassword || !connectionKeysRef.current?.remotePublicKey) return;
    try {
      const plain = incomingPassword.plain ?? await decryptPasswordCard(incomingPassword, connectionKeysRef.current, unlockPassphrase);
      await navigator.clipboard.writeText(plain.password);
      send({ type: "password-copied", id: incomingPassword.id });
      setIncomingPassword(null);
      window.clearTimeout(incomingPasswordTimer.current);
      setPasswordNotice(t("share.passwordCopiedReceiver"));
      window.setTimeout(async () => {
        try { await navigator.clipboard.writeText(""); setClipboardNeedsClear(false); } catch { setClipboardNeedsClear(true); }
      }, 30000);
    } catch {
      setPasswordError(t("share.passwordUnlockError"));
    }
  };

  const statusLabel = status === "starting" ? t("share.starting") : status === "ready" ? t("share.ready") : status === "connecting" ? t("share.connecting") : status === "connected" ? t("share.connected") : t("share.error");
  const connected = status === "connected" && Boolean(remote);
  const progressPercent = (progress: { done: number; total: number }) => progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;

  return (
    <main className="min-h-[calc(100vh-11rem)] bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="border-l-4 border-[var(--primary)] pl-5">
          <p className="text-xs font-bold tracking-[0.22em] text-[var(--primary)]">{t("share.eyebrow")}</p>
          <h1 className="mt-2 font-[Space_Grotesk] text-4xl font-black tracking-tight sm:text-5xl">{t("share.title")}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">{t("share.copy")}</p>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
          <aside className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)]"><Smartphone size={20} /></span><div><p className="font-bold">{myDevice.name}</p><p className="text-xs text-[var(--muted-foreground)]">{t("share.yourDevice")}</p></div></div>
              <span className={`size-3 rounded-full ${status === "connected" ? "bg-emerald-500" : status === "error" ? "bg-rose-500" : "bg-amber-400"}`} aria-label={statusLabel} />
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--secondary)] p-4 text-center">
              {qrDataUrl ? <img src={qrDataUrl} alt={t("share.qrAlt")} className="mx-auto size-52 rounded-lg bg-white p-2" /> : <Loader2 className="mx-auto my-20 animate-spin text-[var(--primary)]" />}
              <p className="mt-3 text-sm font-bold">{t("share.qrTitle")}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{t("share.qrCopy")}</p>
            </div>
            <div className="mt-5 border-t border-[var(--border)] pt-5">
              <label className="text-xs font-bold tracking-wide text-[var(--muted-foreground)]">{t("share.manualTitle")}</label>
              <div className="mt-2 flex gap-2"><input value={manualId} onChange={(event) => setManualId(event.target.value)} placeholder={t("share.manualPlaceholder")} className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none ring-[var(--primary)] focus:ring-2" /><button onClick={() => connectToPeer(manualId)} disabled={!manualId || !peerId} className="rounded-lg bg-[var(--primary)] px-3 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-40"><Link2 size={17} /></button></div>
              <button onClick={() => navigator.clipboard.writeText(peerId)} disabled={!peerId} className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--primary)]"><Copy size={14} />{t("share.copyId")}</button>
            </div>
            <div className="mt-5 rounded-xl bg-[var(--foreground)] p-4 text-[var(--background)]">
              <div className="flex items-center gap-2 font-bold"><ShieldCheck size={18} />{t("share.privateTitle")}</div>
              <p className="mt-2 text-xs leading-5 opacity-80">{t("share.privateCopy")}</p>
            </div>
          </aside>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]"><UsersRound size={20} /></span><div><p className="font-bold">{remote ? remote.name : t("share.noDevice")}</p><p className="text-xs text-[var(--muted-foreground)]">{statusDetail || statusLabel}</p></div></div>
              {connected && <button onClick={() => connectionRef.current?.close()} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-bold"><X size={15} />{t("share.disconnect")}</button>}
            </div>

            {!connected ? <div className="p-8 sm:p-12"><div className="max-w-xl"><span className="grid size-14 place-items-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]"><QrCode size={28} /></span><h2 className="mt-6 font-[Space_Grotesk] text-2xl font-bold">{t("share.waitingTitle")}</h2><p className="mt-3 leading-7 text-[var(--muted-foreground)]">{t("share.waitingCopy")}</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{[t("share.step1"), t("share.step2"), t("share.step3")].map((step, index) => <div key={step} className="rounded-xl border border-[var(--border)] p-3"><span className="text-xs font-black text-[var(--primary)]">0{index + 1}</span><p className="mt-1 text-sm font-semibold">{step}</p></div>)}</div></div></div> : <>
              <div className="flex border-b border-[var(--border)] px-5 pt-4">
                {([{ id: "files", icon: FileUp, label: t("share.files") }, { id: "text", icon: MessageSquareText, label: t("share.text") }, { id: "password", icon: KeyRound, label: t("share.password") }] as Array<{ id: ShareMode; icon: typeof FileUp; label: string }>).map((tab) => <button key={tab.id} onClick={() => setMode(tab.id)} className={`mr-5 inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-bold ${mode === tab.id ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)]"}`}><tab.icon size={16} />{tab.label}</button>)}
              </div>
              <div className="p-5 sm:p-7">
                {mode === "files" && <div>
                  <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); chooseFiles(event.dataTransfer.files); }} className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--secondary)] p-8 text-center">
                    <Upload className="mx-auto text-[var(--primary)]" size={28} /><h2 className="mt-4 font-[Space_Grotesk] text-xl font-bold">{t("share.dropTitle")}</h2><p className="mt-2 text-sm text-[var(--muted-foreground)]">{t("share.dropCopy")}</p>
                    <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)]"><FileUp size={16} />{t("share.pickFiles")}<input type="file" multiple className="hidden" onChange={(event) => chooseFiles(event.target.files)} /></label>
                    <label className="ml-2 mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-bold"><Upload size={16} />{t("share.pickFolder")}<input type="file" multiple className="hidden" {...({ webkitdirectory: "" } as Record<string, string>)} onChange={(event) => chooseFiles(event.target.files)} /></label>
                  </div>
                  {files.length > 0 && <div className="mt-5 rounded-xl border border-[var(--border)] p-4"><div className="flex items-center justify-between"><div><p className="font-bold">{t("share.readyFiles", { count: files.length })}</p><p className="text-sm text-[var(--muted-foreground)]">{formatBytes(files.reduce((sum, file) => sum + file.size, 0))}</p></div><button onClick={offerFiles} className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)]"><Send size={16} />{t("share.requestSend")}</button></div><div className="mt-3 max-h-24 space-y-1 overflow-auto text-xs text-[var(--muted-foreground)]">{files.map((file, index) => <p key={`${file.name}-${index}`}>{file.webkitRelativePath || file.name} · {formatBytes(file.size)}</p>)}</div></div>}
                  {incomingOffer && <div className="mt-5 rounded-xl border border-[var(--primary)] bg-[var(--secondary)] p-4"><p className="font-bold">{t("share.requestReceived")}</p><p className="mt-1 text-sm text-[var(--muted-foreground)]">{t("share.receiveSummary", { count: incomingOffer.files.length, size: formatBytes(incomingOffer.totalSize) })}</p><div className="mt-4 flex gap-2"><button onClick={acceptFiles} className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-[var(--primary-foreground)]"><Check size={16} />{t("share.accept")}</button><button onClick={() => { send({ type: "file-reject", id: incomingOffer.id }); setIncomingOffer(null); }} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-bold">{t("share.decline")}</button></div></div>}
                  {(outgoingProgress.active || incomingProgress.active) && <div className="mt-5 rounded-xl border border-[var(--border)] p-4">{[outgoingProgress, incomingProgress].filter((progress) => progress.active).map((progress, index) => <div key={index}><div className="flex justify-between text-sm"><span className="font-bold">{index === 0 ? t("share.sending") : t("share.receiving")}</span><span>{progressPercent(progress)}% · {formatSpeed(progress.done, progress.startedAt)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--secondary)]"><div className="h-full bg-[var(--primary)] transition-[width]" style={{ width: `${progressPercent(progress)}%` }} /></div></div>)}</div>}
                  {receivedFiles.length > 0 && <div className="mt-5"><h3 className="font-bold">{t("share.receivedFiles")}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{receivedFiles.map((file) => <a href={file.url} download={file.name} key={file.url} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3"><span className="min-w-0"><span className="block truncate text-sm font-bold">{file.name}</span><span className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</span></span><Download className="text-[var(--primary)]" size={18} /></a>)}</div></div>}
                </div>}

                {mode === "text" && <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr]"><div className="min-h-80 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-4">{messages.length ? messages.map((message) => <div key={message.id} className={`mb-3 flex ${message.own ? "justify-end" : "justify-start"}`}><p className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.own ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--card)]"}`}>{message.text}</p></div>) : <p className="pt-24 text-center text-sm text-[var(--muted-foreground)]">{t("share.noMessages")}</p>}</div><div className="rounded-2xl border border-[var(--border)] p-4"><h2 className="font-[Space_Grotesk] text-xl font-bold">{t("share.textTitle")}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{t("share.textCopy")}</p><textarea value={textDraft} onChange={(event) => setTextDraft(event.target.value)} placeholder={t("share.textPlaceholder")} className="mt-5 h-32 w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none ring-[var(--primary)] focus:ring-2" /><button onClick={sendText} disabled={!textDraft.trim()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-40"><Send size={16} />{t("share.sendText")}</button></div></div>}

                {mode === "password" && <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className="rounded-2xl border border-[var(--border)] p-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]"><KeyRound size={21} /></span><div><h2 className="font-[Space_Grotesk] text-xl font-bold">{t("share.passwordTitle")}</h2><p className="text-sm text-[var(--muted-foreground)]">{t("share.passwordCopy")}</p></div></div><div className="mt-5 grid gap-3"><input value={passwordDraft.username} onChange={(event) => setPasswordDraft((current) => ({ ...current, username: event.target.value }))} placeholder={t("share.username")} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none ring-[var(--primary)] focus:ring-2" /><input value={passwordDraft.website} onChange={(event) => setPasswordDraft((current) => ({ ...current, website: event.target.value }))} placeholder={t("share.website")} className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none ring-[var(--primary)] focus:ring-2" /><input type="password" value={passwordDraft.password} onChange={(event) => setPasswordDraft((current) => ({ ...current, password: event.target.value }))} placeholder={t("share.passwordField")} autoComplete="off" className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none ring-[var(--primary)] focus:ring-2" /><input type="password" value={passwordDraft.passphrase} onChange={(event) => setPasswordDraft((current) => ({ ...current, passphrase: event.target.value }))} placeholder={t("share.extraPassphrase")} autoComplete="off" className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none ring-[var(--primary)] focus:ring-2" /><label className="text-sm font-semibold">{t("share.expiry")}<select value={passwordDraft.expiry} onChange={(event) => setPasswordDraft((current) => ({ ...current, expiry: event.target.value }))} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"><option value="5">{t("share.expiry5")}</option><option value="15">{t("share.expiry15")}</option><option value="30">{t("share.expiry30")}</option><option value="0">{t("share.expiryCopy")}</option></select></label></div><button onClick={() => void sendPassword()} disabled={!passwordDraft.password || Boolean(outgoingPassword) || !keyReady} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)] disabled:opacity-40"><LockKeyhole size={16} />{outgoingPassword ? t("share.passwordWaiting") : t("share.sendPassword")}</button></div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--secondary)] p-5"><h3 className="font-bold">{t("share.passwordReceiver")}</h3>{incomingPassword ? <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"><p className="font-semibold">{t("share.passwordArrived")}</p><p className="mt-2 select-none rounded-lg bg-[var(--foreground)] px-3 py-2 font-mono tracking-[0.35em] text-[var(--background)] blur-[3px]">••••••••••••</p>{incomingPassword.hasPassphrase && <input type="password" value={unlockPassphrase} onChange={(event) => setUnlockPassphrase(event.target.value)} placeholder={t("share.enterPassphrase")} autoComplete="off" className="mt-3 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm" />}{passwordError && <p className="mt-2 text-xs font-semibold text-rose-600">{passwordError}</p>}<button onClick={() => void revealAndCopyPassword()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-[var(--primary-foreground)]"><Clipboard size={16} />{t("share.revealCopy")}</button><button onClick={() => clearIncomingPassword(undefined, true)} className="ml-2 mt-4 rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm font-bold">{t("share.removePassword")}</button></div> : <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{t("share.passwordWaitingReceiver")}</p>}{passwordNotice && <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-sm font-semibold">{passwordNotice}</p>}{clipboardNeedsClear && <button onClick={() => void navigator.clipboard.writeText("").then(() => setClipboardNeedsClear(false))} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary)]"><Clipboard size={15} />{t("share.clearClipboard")}</button>}<p className="mt-5 text-xs leading-5 text-[var(--muted-foreground)]">{t("share.passwordSafety")}</p></div></div>}
              </div>
            </>}
          </section>
        </div>
        <p className="mx-auto mt-6 max-w-5xl rounded-xl border border-[var(--border)] bg-[var(--secondary)] p-4 text-center text-xs leading-6 text-[var(--muted-foreground)]">{t("share.webRtcNote")}</p>
      </section>
    </main>
  );
}
