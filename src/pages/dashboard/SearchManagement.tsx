import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import { getTypeOptions } from "@/api/database";
import { sendMessage } from "@/api/search";

type Message = {
  from: "ai" | "user";
  text: string;
};

type KnowledgeBaseOption = {
  label: string;
  value: string;
};

const SearchManagement: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [typeOptions, setTypeOptions] = useState<KnowledgeBaseOption[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");

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

  // 获取类型选项
  const fetchTypeOptions = async () => {
    try {
      const res = await getTypeOptions();
      // 兼容两种结构：直接数组，或 { data: [] }
      const raw = (res.data as { data?: KnowledgeBaseOption[] }).data ?? res.data;
      const list = (raw || []).map((item: KnowledgeBaseOption) => ({
        label: item.label,
        value: item.value,
      }));
      setTypeOptions(list);
      if (list.length > 0) {
        setSelectedType(list[0].value);
      }
    } catch (error) {
      console.error("获取类型选项失败:", error);
    }
  };

  useEffect(() => {
    fetchTypeOptions();
  }, []);

  const handleTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedType(event.target.value as string);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // 没有选择知识库则不给发
    if (!selectedType) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "请先选择一个知识库再提问哦～" },
      ]);
      return;
    }

    // 用户消息
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const data = {
        question: text,
        knowledge_base_id: selectedType,
      };
      const res = await sendMessage(data);

      const replyText = res && res.data ? res.data : "已收到您的消息";

      // AI 回复（支持 Markdown 渲染）
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
        {/* 顶部标题栏 + 类型选择 */}
        <Box
          sx={{
            background: "#409EFF",
            color: "#fff",
            py: 1.5,
            px: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h6" sx={{ flexShrink: 0 }}>
            知识库检索
          </Typography>
          <FormControl
            size="small"
            sx={{ minWidth: 220, background: "#fff", borderRadius: 1 }}
          >
            <InputLabel id="kb-type-label">请选择类型</InputLabel>
            <Select
              labelId="kb-type-label"
              value={selectedType}
              label="请选择类型"
              onChange={handleTypeChange}
            >
              {typeOptions.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 主体 */}
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
            sx={{
              flex: 1,
              overflowY: "auto",
              mb: 2,
              px: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
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
                    maxWidth: "75%",
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor:
                      msg.from === "user" ? "primary.main" : "grey.200",
                    color: msg.from === "user" ? "#fff" : "text.primary",
                    fontSize: 14,
                    wordBreak: "break-word",
                    "& p": { m: 0 }, // markdown 段落收紧
                  }}
                >
                  {msg.from === "ai" ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
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
              multiline
              maxRows={4}
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

export default SearchManagement;