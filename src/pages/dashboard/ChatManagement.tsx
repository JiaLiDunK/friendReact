import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { girlfriendChat } from "@/api/chat";

type Message = {
  from: "ai" | "user";
  text: string;
};

const ChatManagement: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { from: "ai", text: "你好呀，我是你的 AI 女朋友~" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const el = chatWindowRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // 先追加用户消息
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const res = await girlfriendChat({ message: text });
      // 根据你的接口，这里直接用 res.data，如果实际是 { reply: 'xxx' } 就改成 res.data.reply
      const replyText = res.data;

      setMessages((prev) => [...prev, { from: "ai", text: replyText }]);
    } catch (error) {
      console.error("聊天接口调用失败:", error);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "抱歉呀，网络似乎有点问题~" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ p: 3, height: "calc(100vh - 80px)" }}>
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f5f7fa",
        }}
      >
        <Box
          sx={{
            background: "#409EFF",
            color: "#fff",
            textAlign: "center",
            py: 1.5,
          }}
        >
          <Typography variant="h6">AI 女友聊天</Typography>
        </Box>

        <CardContent
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            pt: 2,
            pb: 1,
          }}
        >
          {/* 聊天窗口 */}
          <Box
            ref={chatWindowRef}
            className="chat-window"
            sx={{
              flex: 1,
              overflowY: "auto",
              mb: 2,
              px: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  justifyContent: msg.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <Box
                  sx={{
                    maxWidth: "70%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor:
                      msg.from === "user" ? "primary.main" : "grey.200",
                    color: msg.from === "user" ? "#fff" : "text.primary",
                    fontSize: 14,
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            ))}
          </Box>

          {/* 输入栏 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="请输入内容…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={sending}
              sx={{ whiteSpace: "nowrap" }}
            >
              {sending ? "发送中..." : "发送"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatManagement;