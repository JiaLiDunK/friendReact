import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, TextField, Typography } from "@mui/material";
import { ArrowUp, Coffee, Heart, MessageCircle, Moon, Sparkles, UserRound } from "lucide-react";
import { girlfriendChat } from "@/api/chat";

type Message = {
  from: "ai" | "user";
  text: string;
};

const suggestions = [
  { icon: Coffee, title: "分享日常", text: "想和你分享一下今天发生的事。" },
  { icon: Heart, title: "聊聊心事", text: "今天有一点小情绪，想找你聊聊。" },
  { icon: Moon, title: "轻松一刻", text: "陪我随便聊聊，放松一下吧。" },
];

const ChatManagement: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { from: "ai", text: "你好呀，我是你的 AI 女朋友~" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const hasConversation = messages.length > 1;

  const scrollToBottom = () => {
    const el = chatWindowRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    if (hasConversation) scrollToBottom();
  }, [messages, sending, hasConversation]);

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
        { from: "ai", text: "抱歉呀，网络似乎有点问题，请稍后再试。" },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        height: "calc(100dvh - 104px)",
        minHeight: 320,
        width: "100%",
        minWidth: 0,
        contain: "inline-size",
        color: "hsl(var(--foreground))",
        "& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root": { fontFamily: "inherit" },
      }}
    >
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: 4,
          borderColor: "hsl(var(--border))",
          bgcolor: "hsl(var(--card))",
          color: "inherit",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.025)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: { xs: 2, md: 3 },
            py: 2,
            flexShrink: 0,
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <Box sx={{ display: "grid", placeItems: "center", width: 42, height: 42, flexShrink: 0, borderRadius: 3, bgcolor: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
            <MessageCircle size={22} strokeWidth={1.7} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" sx={{ fontSize: { xs: 17, sm: 19 }, fontWeight: 600, letterSpacing: "-0.4px" }}>
              AI 女友聊天
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              分享日常，也聊聊心事
            </Typography>
          </Box>
          <Box sx={{ ml: "auto", px: 1.25, py: 0.5, borderRadius: 2, bgcolor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", fontSize: 11, whiteSpace: "nowrap" }}>
            AI 陪伴
          </Box>
        </Box>

        <CardContent
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            p: 0,
            "&:last-child": { pb: 0 },
          }}
        >
          {/* 聊天窗口 */}
          <Box
            ref={chatWindowRef}
            className="chat-window"
            role="log"
            aria-label="聊天记录"
            aria-live="polite"
            tabIndex={0}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overscrollBehavior: "contain",
              scrollbarWidth: "thin",
              scrollbarColor: "hsl(var(--border)) transparent",
              px: { xs: 2, md: 4 },
              py: 3,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {!hasConversation ? (
              <Box sx={{ width: "100%", maxWidth: 620, mx: "auto", my: "auto", py: 2, textAlign: "center", flexShrink: 0 }}>
                <Box sx={{ width: 64, height: 64, display: "grid", placeItems: "center", mx: "auto", mb: 2.5, borderRadius: "22px", bgcolor: "hsl(var(--primary) / 0.07)", color: "hsl(var(--primary))" }}>
                  <Heart size={29} strokeWidth={1.5} />
                </Box>
                <Typography component="h3" sx={{ fontSize: { xs: 22, md: 28 }, fontWeight: 600, letterSpacing: "-0.7px" }}>
                  今天，想聊些什么？
                </Typography>
                <Typography sx={{ mt: 1.5, fontSize: 13, lineHeight: 1.9, color: "hsl(var(--muted-foreground))" }}>
                  {messages[0].text}<br />
                  开心的小事、偶尔的烦恼，都可以慢慢说。
                </Typography>
                <Box sx={{ mt: 3.5, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1.25 }}>
                  {suggestions.map(({ icon: Icon, title, text }) => (
                    <Button
                      key={title}
                      variant="outlined"
                      startIcon={<Icon size={16} strokeWidth={1.7} />}
                      onClick={() => {
                        setInput(text);
                        inputRef.current?.focus();
                      }}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: 3,
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--muted-foreground))",
                        fontSize: 13,
                        "&:hover": { borderColor: "hsl(var(--primary) / 0.4)", bgcolor: "hsl(var(--primary) / 0.04)", color: "hsl(var(--primary))" },
                      }}
                    >
                      {title}
                    </Button>
                  ))}
                </Box>
              </Box>
            ) : messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  flexDirection: msg.from === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 1.25,
                  width: "100%",
                  maxWidth: 860,
                  mx: "auto",
                  flexShrink: 0,
                }}
              >
                <Box sx={{ width: 32, height: 32, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 2.5, bgcolor: "hsl(var(--muted))", color: msg.from === "ai" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
                  {msg.from === "ai" ? <Heart size={16} strokeWidth={1.8} /> : <UserRound size={16} strokeWidth={1.8} />}
                </Box>
                <Box sx={{ minWidth: 0, maxWidth: { xs: "calc(100% - 42px)", md: "78%" } }}>
                  <Typography sx={{ mb: 0.75, fontSize: 11, color: "hsl(var(--muted-foreground))", textAlign: msg.from === "user" ? "right" : "left" }}>
                    {msg.from === "ai" ? "AI 女友" : "你"}
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      borderTopLeftRadius: msg.from === "ai" ? "4px" : undefined,
                      borderTopRightRadius: msg.from === "user" ? "4px" : undefined,
                      bgcolor: msg.from === "user" ? "hsl(var(--primary) / 0.09)" : "hsl(var(--muted) / 0.7)",
                      fontSize: 14,
                      lineHeight: 1.85,
                      overflowWrap: "anywhere",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.text}
                  </Box>
                </Box>
              </Box>
            ))}
            {sending && (
              <Box role="status" sx={{ width: "100%", maxWidth: 860, mx: "auto", display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0, color: "hsl(var(--muted-foreground))" }}>
                <CircularProgress size={16} thickness={3} sx={{ color: "hsl(var(--primary))" }} />
                <Typography sx={{ fontSize: 12 }}>正在回复，稍等一下…</Typography>
              </Box>
            )}
          </Box>

          {/* 输入栏 */}
          <Box sx={{ px: { xs: 2, md: 4 }, pt: 1, pb: 2, flexShrink: 0 }}>
            <Box
              sx={{
                maxWidth: 860,
                mx: "auto",
                p: 1.5,
                border: "1px solid hsl(var(--border))",
                borderRadius: 3,
                bgcolor: "hsl(var(--card))",
                boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                transition: "border-color 150ms, box-shadow 150ms",
                "&:focus-within": { borderColor: "hsl(var(--primary) / 0.55)", boxShadow: "0 0 0 3px hsl(var(--primary) / 0.07)" },
              }}
            >
              <TextField
                inputRef={inputRef}
                fullWidth
                variant="standard"
                placeholder="说点什么吧，我在听…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                multiline
                minRows={2}
                maxRows={4}
                slotProps={{ input: { disableUnderline: true }, htmlInput: { "aria-label": "输入聊天内容" } }}
                sx={{ "& .MuiInputBase-root": { p: 0.5, fontSize: 14, lineHeight: 1.7, color: "inherit" } }}
              />
              <Box sx={{ mt: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Enter 发送 · Shift + Enter 换行</Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>慢慢说，不着急</Box>
                </Typography>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  endIcon={sending ? <CircularProgress size={14} color="inherit" /> : <ArrowUp size={16} />}
                  sx={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                    borderRadius: 2,
                    px: 2,
                    fontSize: 13,
                    bgcolor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                    "&:hover": { bgcolor: "hsl(var(--primary) / 0.9)" },
                    "&.Mui-disabled": { bgcolor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" },
                  }}
                >
                  {sending ? "回复中" : "发送"}
                </Button>
              </Box>
            </Box>
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, color: "hsl(var(--muted-foreground))" }}>
              <Sparkles size={12} />
              <Typography sx={{ fontSize: 11 }}>内容由 AI 生成，仅供交流参考</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ChatManagement;
