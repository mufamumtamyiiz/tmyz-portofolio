import { useState, useEffect } from "react";
import { auth, loginWithGoogle, logout, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

const OWNER_EMAIL = "mufamumtamyiz@gmail.com";
const DEFAULT_AVATAR = `${import.meta.env.BASE_URL}assets/yiss1.png`;

const isOwnerEmail = (email) => String(email || "").toLowerCase() === OWNER_EMAIL;

const formatOwnerName = (name, email) => {
  const baseName = name?.trim() || "Mufamum Tamyiz";
  return isOwnerEmail(email) ? baseName : baseName;
};

export default function ChatRoom() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "message_requests"),
      where("status", "==", "approved")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const approvedChatMessages = snapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .filter((messageDoc) => ["chatroom", "contact-form"].includes(messageDoc.source))
          .sort((firstMessage, secondMessage) => {
            const firstTime = firstMessage.createdAt?.toMillis?.() ?? 0;
            const secondTime = secondMessage.createdAt?.toMillis?.() ?? 0;
            return firstTime - secondTime;
          });

        setMessages(approvedChatMessages);
      },
      (error) => {
        console.error("Failed to load approved chat messages:", error);
        setNotice("Pesan chat belum dapat dimuat. Silakan muat ulang halaman.");
      }
    );

    return () => unsub();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const safeDisplayName = formatOwnerName(
      user.displayName || user.providerData?.[0]?.displayName || "Mufamum Tamyiz",
      user.email
    );

    const requestDoc = await addDoc(collection(db, "message_requests"), {
      text: message.trim(),
      uid: user.uid,
      email: user.email || null,
      displayName: safeDisplayName,
      photoURL: user.photoURL || user.providerData?.[0]?.photoURL || DEFAULT_AVATAR,
      createdAt: serverTimestamp(),
      status: "pending",
      source: "chatroom",
    });

    try {
      await fetch("/api/send-approval-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: safeDisplayName,
          email: user.email || "",
          message: message.trim(),
          messageId: requestDoc.id,
          source: "chatroom",
        }),
      });
    } catch (error) {
      console.error("Failed to send approval email for chatroom message:", error);
    }

    setNotice("Pesan Anda sedang menunggu persetujuan owner.");
    setMessage("");
  };

  const handleDeleteMessage = async (msgId) => {
    if (!user || !msgId) return;

    const targetMessage = messages.find((msg) => msg.id === msgId);
    if (!targetMessage || targetMessage.uid !== user.uid) return;

    await deleteDoc(doc(db, "message_requests", msgId));
  };

  return (
    <div className="mx-auto mt-0 w-full max-w-none rounded-xl border border-gray-700 bg-zinc-900 p-4 shadow-lg sm:p-6">
      <h2 className="text-2xl font-bold text-center mb-4 text-white">💬 Chat Room</h2>

      {user && (
        <div className="mb-4 flex items-center justify-between border-b border-gray-700 pb-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <img
              src={user.photoURL || user.providerData?.[0]?.photoURL || DEFAULT_AVATAR}
              alt="avatar"
              className="h-9 w-9 shrink-0 rounded-full sm:h-10 sm:w-10"
            />
            <span
              className={`block min-w-0 truncate font-semibold ${
                isOwnerEmail(user.email)
                  ? "text-slate-200 tracking-wide [text-shadow:0_0_10px_rgba(148,163,184,0.45)]"
                  : "text-white"
              }`}
            >
              {formatOwnerName(user.displayName || user.providerData?.[0]?.displayName || "Mufamum Tamyiz", user.email)}
            </span>
          </div>
          <button
            onClick={logout}
            className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 sm:px-4"
          >
            Logout
          </button>
        </div>
      )}

      {notice && (
        <div className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-200">
          {notice}
        </div>
      )}

      <div className="mb-4 h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-700 bg-zinc-800 p-3 sm:h-72">
        {messages.map((msg) => {
          const isOwnMessage = Boolean(user?.uid && msg.uid === user.uid);
          const messageDisplayName = formatOwnerName(
            msg.displayName || msg.name || "Anonymous",
            msg.email || (isOwnMessage ? user.email : "")
          );
          const ownerMessage = isOwnerEmail(msg.email || (isOwnMessage ? user.email : ""));

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              {!isOwnMessage && (
                <img
                  src={msg.photoURL || DEFAULT_AVATAR}
                  alt="avatar"
                  className="h-8 w-8 shrink-0 rounded-full"
                />
              )}
              <div
                className={`min-w-0 max-w-[78%] break-words rounded-lg p-3 text-sm sm:max-w-[75%] sm:text-base ${
                  isOwnMessage
                    ? ownerMessage
                      ? "bg-slate-700/95 text-slate-100 border border-slate-500 shadow-[0_0_14px_rgba(100,116,139,0.35)]"
                      : "bg-blue-500 text-white"
                    : ownerMessage
                      ? "bg-zinc-700/90 text-zinc-200 border border-zinc-500 shadow-[0_0_14px_rgba(113,113,122,0.25)]"
                      : "bg-gray-700 text-white"
                }`}
              >
                <div className="mb-1">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs ${
                      ownerMessage
                        ? "bg-slate-800/80 text-slate-300 ring-1 ring-slate-500/60"
                        : "bg-white/5 text-gray-200"
                    }`}
                  >
                    {messageDisplayName}
                    {ownerMessage && (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.9)]" />
                    )}
                  </div>
                </div>
                <div>{msg.text || msg.message}</div>
                {isOwnMessage && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="mt-2 text-[10px] underline opacity-80 hover:opacity-100"
                    aria-label="Delete your message"
                  >
                    Delete
                  </button>
                )}
              </div>
              {isOwnMessage && (
                <img
                  src={msg.photoURL || DEFAULT_AVATAR}
                  alt="avatar"
                  className="h-8 w-8 shrink-0 rounded-full"
                />
              )}
            </div>
          );
        })}
      </div>

      {user ? (
        <form onSubmit={sendMessage} className="flex w-full flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="w-full min-w-0 flex-1 rounded-lg border border-gray-600 bg-zinc-700 p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full shrink-0 rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700 sm:w-auto sm:py-2"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[180px] px-2 sm:px-4">
          <button
            onClick={loginWithGoogle}
            className="flex w-full max-w-[260px] items-center justify-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-md transition duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 sm:text-base"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="h-5 w-5 shrink-0"
            />
            <span className="truncate">Login with Google</span>
          </button>
          <p className="text-center text-xs text-gray-400 sm:text-sm">Login untuk mengirim pesan</p>
        </div>
      )}
    </div>
  );
}

