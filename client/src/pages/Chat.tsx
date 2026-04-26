import { useEffect, useState } from "react";
import { socket } from "../services/socket";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    socket.connect();

    socket.on("receive_message", (data: any) => {
      console.log("Received:", data);
      // Backend returns a full message object, we extract the content
      setMessages((prev) => [...prev, data.content || JSON.stringify(data)]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!message) return;

    // Backend expects { content, chatId, senderId }
    socket.emit("send_message", {
      content: message,
      chatId: "default-chat",     // Dummy ID for now
      senderId: "default-user"    // Dummy ID for now
    });
    setMessage("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat</h2>

      <div>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}