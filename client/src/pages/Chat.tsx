import { useEffect, useState } from "react";
import { socket } from "../services/socket";
import { fetchMessages } from "../services/messageService";
import { fetchChats } from "../services/chatService";
import { fetchUsers } from "../services/userService";
import { useRef } from "react";
export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id: string; content: string; chatId: string; senderId: string; status: string; createdAt?: string; User?: { name: string }; sender?: { name: string } }[]>([]);
  const [chats, setChats] = useState<{ id: string; Message?: { content: string }[], user1Id: string; user2Id: string }[]>([]);
  const [activeChat, setActiveChat] = useState<string>("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const senderId = "id_2"; // change per tab

  const loadMessages = (chatId: string) => {
    socket.emit("mark_read", {
      chatId,
      userId: senderId,
    });
    fetchMessages(chatId).then((data) => {
      setMessages(data);
    });
  };

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  useEffect(() => {
    socket.connect();

    socket.emit("user_online", senderId);

    // Load chats
    fetchChats().then((data) => {
      setChats(data);
      if (data.length > 0) {
        setActiveChat(data[0].id);
        loadMessages(data[0].id);
      }
    });

    socket.on("receive_message", (data: { id: string; content: string; chatId: string; senderId: string; status: string; createdAt?: string; User?: { name: string }; sender?: { name: string } }) => {
      // Only add message if it belongs to active chat
      setMessages((prev) => {
        // Fix stale activeChat by relying on the component knowing what chat it's in, or just trust the server.
        // Actually, if we filter here we should use the state. To keep it bug-free from duplicates:
        if (data.chatId !== activeChat) return prev;
        const exists = prev.find((msg) => msg.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    socket.on("online_users", (users: string[]) => {
      setOnlineUsers(users);
    });

    socket.on("typing", (data) => {
      // Note: activeChat might be stale here in standard useEffect closure unless handled correctly, 
      // but keeping logic as requested for standard implementation:
      if (data.chatId === activeChat && data.senderId !== senderId) {
        setTypingUser(data.senderId);
        setTimeout(() => setTypingUser(null), 1000);
      }
    });

    socket.on("messages_read", (chatId) => {
      // It's safe to update all messages for this chat dynamically here 
      // without needing activeChat dependency directly if using prev mapping properly.
      setMessages((prev) =>
        prev.map((msg) =>
          msg.chatId === chatId ? { ...msg, status: "read" } : msg
        )
      );
    });

    return () => {
      socket.off("receive_message");
      socket.off("online_users");
      socket.off("typing");
      socket.off("messages_read");
      socket.disconnect();
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChat = async (userId: string) => {
    const res = await fetch("http://localhost:3000/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user1Id: senderId,
        user2Id: userId,
      }),
    });

    const chat = await res.json();

    setActiveChat(chat.id);
    loadMessages(chat.id);
  };

  const sendMessage = () => {
    if (!message || !activeChat) return;

    socket.emit("send_message", {
      content: message,
      chatId: activeChat,
      senderId: senderId,
    });

    setMessage("");
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* Users Sidebar */}
      <div style={{ width: 200, borderRight: "1px solid gray", overflowY: "auto", padding: "10px 0" }}>
        <h3 style={{ paddingInline: 10 }}>Users</h3>
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => createChat(user.id)}
            style={{ cursor: "pointer", padding: "10px" }}
          >
            {user.name}
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div style={{ width: 200, borderRight: "1px solid gray", overflowY: "auto", padding: "10px 0" }}>
        <h3 style={{ paddingInline: 10 }}>Chats</h3>
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => {
              setActiveChat(chat.id);
              setMessages([]);
              loadMessages(chat.id);
            }}
            style={{
              cursor: "pointer",
              padding: 10,
              background: activeChat === chat.id ? "#ddd" : "transparent"
            }}
          >
            <div><b>Chat</b></div>
            <div style={{ fontSize: 12 }}>
              {chat.Message?.[0]?.content || "No messages"}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
        <h2>Chat {onlineUsers.includes("id_2") ? "🟢 Online" : "⚫ Offline"}</h2>

        <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12, paddingBottom: 10 }}>
          {messages.map((msg) => {
            const isMine = msg.senderId === senderId;

            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    background: isMine ? "#25D366" : "#2a2f32",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: 10,
                    maxWidth: "60%",
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {msg.senderId === senderId ? "You" : (msg.User?.name || msg.sender?.name)}
                  </div>

                  <div>{msg.content}</div>

                  <div style={{ fontSize: 10, textAlign: "right", opacity: 0.6, display: "flex", justifyContent: "flex-end", gap: 5, alignItems: "center" }}>
                    <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}</span>
                    <span>
                      {msg.status === "sent" && "✔️"}
                      {msg.status === "delivered" && "✔️✔️"}
                      {msg.status === "read" && "✔️✔️ (blue)"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {typingUser && <div style={{ fontSize: 12, opacity: 0.7, paddingBottom: 5 }}>Typing...</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input
            style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              socket.emit("typing", {
                chatId: activeChat,
                senderId,
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />
          <button style={{ padding: "10px 20px" }} onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}