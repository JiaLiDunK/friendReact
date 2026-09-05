import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowRight, ArrowUp, BookOpen, FileSearch, ListFilter, Sparkles, UserRound } from "lucide-react";
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

const suggestions = [
  { icon: FileSearch, title: "查找资料", text: "请帮我查找关于「主题」的相关资料。" },
  { icon: ListFilter, title: "提炼要点", text: "请总结「主题」的核心观点和关键要点。" },
  { icon: BookOpen, title: "理解概念", text: "请解释「概念」的含义，并举例说明。" },
];

const normalizeReplyText = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value == null) return "已收到您的消息";
  if (typeof value === "object") {
    const data = value as Record<string, unknown>;
    const candidates = [data.data, data.answer, data.content, data.result, data.message];
    const matched = candidates.find((item) => typeof item === "string");
    if (matched) return matched;
  }
  return JSON.stringify(value, null, 2);
};

const SearchManagement: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [typeOptions, setTypeOptions] = useState<KnowledgeBaseOption[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typeError, setTypeError] = useState(false);

  const chatWindowRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const selectedLabel = typeOptions.find((item) => item.value === selectedType)?.label;

  const scrollToBottom = () => {
    const el = chatWindowRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // 获取类型选项
  const fetchTypeOptions = async () => {
    setLoadingTypes(true);
    setTypeError(false);
    try {
      const res = await getTypeOptions();
      // 兼容两种结构：直接数组，或 { data: [] }
      const raw = (res.data as { data?: KnowledgeBaseOption[] })?.data ?? res.data;
      const list = (Array.isArray(raw) ? raw : []).map((item: KnowledgeBaseOption) => ({
        label: item.label,
        value: item.value,
      }));
      setTypeOptions(list);
      setSelectedType(list[0]?.value ?? "");
    } catch (error) {
      console.error("获取类型选项失败:", error);
      setTypeError(true);
    } finally {
      setLoadingTypes(false);
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
      inputRef.current?.focus();
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

      const replyText = normalizeReplyText(res?.data);

      // AI 回复（支持 Markdown 渲染）
      setMessages((prev) => [...prev, { from: "ai", text: replyText }]);
    } catch (error) {
      console.error("聊天接口调用失败:", error);
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: "暂时无法获取回答，请检查网络后重新提问。" },
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
        minHeight: 520,
        width: "100%",
        minWidth: 0,
        contain: "inline-size",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        color: "hsl(var(--foreground))",
        "& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiFormLabel-root": {
          fontFamily: "inherit",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
        <Box sx={{ p: 1.25, display: "flex", borderRadius: 3, bgcolor: "hsl(var(--primary) / 0.09)", color: "hsl(var(--primary))" }}>
          <FileSearch size={23} strokeWidth={1.8} />
        </Box>
        <Box>
          <Typography component="h2" sx={{ fontSize: 23, fontWeight: 600, letterSpacing: "-0.5px" }}>
            知识库检索
          </Typography>
          <Typography sx={{ mt: 0.25, fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
            从已有知识中，找到你需要的答案
          </Typography>
        </Box>
      </Box>
      <Card
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          borderRadius: 4,
          borderColor: "hsl(var(--border))",
          bgcolor: "hsl(var(--card))",
          color: "inherit",
          boxShadow: "0 4px 24px rgba(15, 23, 42, 0.025)",
        }}
      >
        {/* 顶部标题栏 + 类型选择 */}
        <Box
          sx={{
            py: 2,
            px: { xs: 2, md: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            flexShrink: 0,
            borderBottom: "1px solid hsl(var(--border))",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BookOpen size={17} color="hsl(var(--muted-foreground))" />
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>检索范围</Typography>
            <Typography sx={{ display: { xs: "none", md: "block" }, ml: 0.5, fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
              选择一个知识库开始提问
            </Typography>
          </Box>
          <FormControl
            size="small"
            disabled={loadingTypes || sending || typeOptions.length === 0}
            sx={{ width: { xs: "100%", sm: 260 }, "& .MuiOutlinedInput-root": { borderRadius: 2.5, fontSize: 13 } }}
          >
            <InputLabel id="kb-type-label" shrink>知识库</InputLabel>
            <Select
              labelId="kb-type-label"
              value={selectedType}
              label="知识库"
              notched
              displayEmpty
              onChange={handleTypeChange}
              renderValue={(value) => value ? selectedLabel : loadingTypes ? "正在加载…" : "暂无可用知识库"}
            >
              {typeOptions.map((item) => (
                <MenuItem key={item.value} value={item.value} sx={{ fontSize: 13, whiteSpace: "normal", overflowWrap: "anywhere" }}>
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
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            p: 0,
            "&:last-child": { pb: 0 },
          }}
        >
          {!loadingTypes && (typeError || typeOptions.length === 0) && (
            <Alert
              severity={typeError ? "error" : "info"}
              action={typeError ? <Button color="inherit" size="small" onClick={fetchTypeOptions}>重试</Button> : undefined}
              sx={{ mx: 2, mt: 2, borderRadius: 2, fontSize: 13, flexShrink: 0 }}
            >
              {typeError ? "知识库加载失败，请重试。" : "暂无可用知识库，请先在知识库管理中添加。"}
            </Alert>
          )}
          {/* 聊天窗口 */}
          <Box
            ref={chatWindowRef}
            role="log"
            aria-label="检索对话"
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
            {messages.length === 0 && (
              <Box sx={{ width: "100%", maxWidth: 680, mx: "auto", my: "auto", py: { xs: 1, md: 3 }, textAlign: "center" }}>
                <Box sx={{ width: 60, height: 60, mx: "auto", mb: 2.5, display: "grid", placeItems: "center", borderRadius: "20px", bgcolor: "hsl(var(--primary) / 0.07)", color: "hsl(var(--primary))" }}>
                  <Sparkles size={28} strokeWidth={1.5} />
                </Box>
                <Typography component="h3" sx={{ fontSize: { xs: 21, md: 25 }, fontWeight: 600, letterSpacing: "-0.5px" }}>
                  让知识，成为答案
                </Typography>
                <Typography sx={{ mt: 1, fontSize: 13, lineHeight: 1.8, color: "hsl(var(--muted-foreground))" }}>
                  查找资料、提炼要点，或探索一个新的问题。<br />
                  选择知识库，用自然语言开始提问。
                </Typography>
                <Box sx={{ mt: 3.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
                  {suggestions.map(({ icon: Icon, title, text }) => (
                    <Button
                      key={title}
                      variant="outlined"
                      disabled={!selectedType || loadingTypes}
                      onClick={() => {
                        setInput(text);
                        inputRef.current?.focus();
                      }}
                      sx={{
                        p: 1.75,
                        gap: 1.25,
                        justifyContent: "flex-start",
                        textTransform: "none",
                        borderColor: "hsl(var(--border))",
                        borderRadius: 3,
                        color: "hsl(var(--muted-foreground))",
                        fontSize: 13,
                        "&:hover": { borderColor: "hsl(var(--primary) / 0.4)", bgcolor: "hsl(var(--primary) / 0.04)", color: "hsl(var(--primary))" },
                      }}
                    >
                      <Icon size={17} strokeWidth={1.7} />
                      {title}
                      <ArrowRight size={14} style={{ marginLeft: "auto" }} />
                    </Button>
                  ))}
                </Box>
                <Typography sx={{ mt: 1.5, fontSize: 11, color: "hsl(var(--muted-foreground))" }}>
                  点击填入提问模板，替换主题后发送
                </Typography>
              </Box>
            )}
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: "flex",
                  flexDirection: msg.from === "user" ? "row-reverse" : "row",
                  alignItems: "flex-start",
                  gap: 1.25,
                  width: "100%",
                  maxWidth: 900,
                  mx: "auto",
                }}
              >
                <Box sx={{ width: 30, height: 30, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 2, color: msg.from === "ai" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))", bgcolor: "hsl(var(--muted))" }}>
                  {msg.from === "ai" ? <Sparkles size={16} /> : <UserRound size={16} />}
                </Box>
                <Box sx={{ minWidth: 0, maxWidth: { xs: "calc(100% - 42px)", md: "85%" } }}>
                  <Typography sx={{ mb: 0.75, fontSize: 11, color: "hsl(var(--muted-foreground))", textAlign: msg.from === "user" ? "right" : "left" }}>
                    {msg.from === "ai" ? "知识助手" : "你"}
                  </Typography>
                  <Box
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      bgcolor: msg.from === "user" ? "hsl(var(--primary) / 0.08)" : "hsl(var(--muted) / 0.65)",
                      fontSize: 14,
                      lineHeight: 1.85,
                      overflowWrap: "anywhere",
                      whiteSpace: msg.from === "user" ? "pre-wrap" : "normal",
                      "& p": { m: 0 }, // markdown 段落收紧
                      "& p + p": { mt: 1.25 },
                      "& ul, & ol": { my: 1, pl: 2.5 },
                      "& ul": { listStyleType: "disc" },
                      "& ol": { listStyleType: "decimal" },
                      "& h1, & h2, & h3, & h4, & h5, & h6": { fontSize: "1.1em", fontWeight: 600, mt: 2, mb: 1 },
                      "& > :first-child": { mt: 0 },
                      "& pre": { my: 1.5, p: 1.5, maxWidth: "100%", overflowX: "auto", borderRadius: 2, bgcolor: "hsl(var(--foreground) / 0.05)", fontSize: 12 },
                      "& code": { fontSize: "0.9em", bgcolor: "hsl(var(--foreground) / 0.05)", borderRadius: 0.75, px: 0.5 },
                      "& pre code": { bgcolor: "transparent", p: 0 },
                      "& blockquote": { my: 1.5, pl: 1.5, borderLeft: "3px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))" },
                      "& a": { color: "hsl(var(--primary))", textDecoration: "underline" },
                      "& img": { maxWidth: "100%", height: "auto", borderRadius: 2 },
                      "& hr": { my: 2 },
                    }}
                  >
                    {msg.from === "ai" ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
            {sending && (
              <Box role="status" sx={{ width: "100%", maxWidth: 900, mx: "auto", display: "flex", alignItems: "center", gap: 1.5, color: "hsl(var(--muted-foreground))" }}>
                <CircularProgress size={16} thickness={3} sx={{ color: "hsl(var(--primary))" }} />
                <Typography sx={{ fontSize: 13 }}>正在检索知识库，整理答案…</Typography>
              </Box>
            )}
          </Box>

          {/* 输入栏 */}
          <Box sx={{ px: { xs: 2, md: 4 }, pt: 1, pb: 2, flexShrink: 0 }}>
            <Box
              sx={{
                maxWidth: 900,
                mx: "auto",
                border: "1px solid hsl(var(--border))",
                borderRadius: 3,
                p: 1.5,
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
                placeholder={selectedType ? "输入你的问题，让知识库帮你找到答案…" : "请先选择可用的知识库"}
                value={input}
                disabled={!selectedType || loadingTypes}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                multiline
                minRows={2}
                maxRows={4}
                slotProps={{ input: { disableUnderline: true }, htmlInput: { "aria-label": "输入检索问题" } }}
                sx={{ "& .MuiInputBase-root": { p: 0.5, fontSize: 14, lineHeight: 1.7, color: "inherit" } }}
              />
              <Box sx={{ mt: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                <Box sx={{ minWidth: 0, display: "flex", alignItems: "center", gap: 0.75, color: "hsl(var(--muted-foreground))" }}>
                  <BookOpen size={13} style={{ flexShrink: 0 }} />
                  <Typography noWrap title={selectedLabel} sx={{ fontSize: 11 }}>
                    {selectedLabel || "未选择知识库"}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={handleSend}
                  disabled={!input.trim() || sending || !selectedType || loadingTypes}
                  endIcon={sending ? <CircularProgress size={14} color="inherit" /> : <ArrowUp size={16} />}
                  sx={{ flexShrink: 0, whiteSpace: "nowrap", borderRadius: 2, px: 2, fontSize: 13, bgcolor: "hsl(var(--primary))", "&:hover": { bgcolor: "hsl(var(--primary) / 0.9)" } }}
                >
                  {sending ? "检索中" : "发送"}
                </Button>
              </Box>
            </Box>
            <Box sx={{ maxWidth: 900, mx: "auto", mt: 1.25, display: "flex", justifyContent: "space-between", gap: 1, color: "hsl(var(--muted-foreground))" }}>
              <Typography sx={{ fontSize: 11 }}>回答由 AI 生成，请结合原始资料核实</Typography>
              <Typography sx={{ fontSize: 11, display: { xs: "none", sm: "block" }, flexShrink: 0 }}>
                Enter 发送 · Shift + Enter 换行
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SearchManagement;
