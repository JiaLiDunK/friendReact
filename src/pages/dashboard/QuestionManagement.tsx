import React, { useMemo, useState, useEffect, ChangeEvent } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TableContainer,
  Pagination,
} from "@mui/material";
import { addData } from "@/api/question";

type Question = {
  id: number;
  question: string;
  uuid: string;
};

type Answer = {
  question_id: number;
  order: number;
  answer: string;
};

type PaginationState = {
  page: number; // 1-based
  pageSize: number;
  total: number;
};

const QuestionManagement: React.FC = () => {
  const [keyword, setKeyword] = useState("");

  // mock 问题数据（等价于 Vue 示例）
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, question: "什么是人工智能？", uuid: "Q-001" },
    { id: 2, question: "Vue3 与 Vue2 的区别是什么？", uuid: "Q-002" },
    { id: 3, question: "什么是微服务架构？", uuid: "Q-003" },
  ]);

  // mock 答案数据（等价于 Vue 示例）
  const [answers] = useState<Answer[]>([
    { question_id: 1, order: 1, answer: "人工智能是研究智能行为的科学。" },
    { question_id: 1, order: 2, answer: "AI模拟人类的思维与行为。" },
    { question_id: 2, order: 1, answer: "Vue3 使用 Composition API。" },
    { question_id: 3, order: 1, answer: "微服务是一种将应用拆分成多个服务的架构风格。" },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 3,
  });

  // 过滤 + 分页
  const filteredQuestions = useMemo(() => {
    const kw = keyword.trim();
    let data = questions;
    if (kw) {
      data = data.filter((q) => q.question.includes(kw));
    }
    return data;
  }, [keyword, questions]);

  const pagedQuestions = useMemo(() => {
    const total = filteredQuestions.length;
    const { page, pageSize } = pagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      total,
      data: filteredQuestions.slice(start, end),
    };
  }, [filteredQuestions, pagination]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, total: filteredQuestions.length }));
  }, [filteredQuestions]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setKeyword("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (_: ChangeEvent<unknown>, page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (event: SelectChangeEvent<string>) => {
    const size = Number(event.target.value) || 10;
    setPagination((prev) => ({ ...prev, pageSize: size, page: 1 }));
  };

  // =============== 查看答案 ===============
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [answerPagination, setAnswerPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 5,
    total: 0,
  });

  const currentAnswers = useMemo(() => {
    if (!detailQuestion) return { total: 0, data: [] as Answer[] };
    const all = answers.filter((a) => a.question_id === detailQuestion.id);
    const total = all.length;
    const { page, pageSize } = answerPagination;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return { total, data: all.slice(start, end) };
  }, [answers, detailQuestion, answerPagination]);

  useEffect(() => {
    setAnswerPagination((prev) => ({ ...prev, total: currentAnswers.total }));
  }, [currentAnswers.total]);

  const openDetail = (row: Question) => {
    setDetailQuestion(row);
    setAnswerPagination((prev) => ({ ...prev, page: 1 }));
    setDetailOpen(true);
  };

  const handleAnswerPageChange = (_: ChangeEvent<unknown>, page: number) => {
    setAnswerPagination((prev) => ({ ...prev, page }));
  };

  const handleAnswerPageSizeChange = (event: SelectChangeEvent<string>) => {
    const size = Number(event.target.value) || 5;
    setAnswerPagination((prev) => ({ ...prev, pageSize: size, page: 1 }));
  };

  // =============== 编辑问题 ===============
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ id: number | null; question: string }>({
    id: null,
    question: "",
  });

  const openEdit = (row: Question) => {
    setEditForm({ id: row.id, question: row.question });
    setEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (editForm.id == null) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === editForm.id
          ? {
              ...q,
              question: editForm.question,
            }
          : q
      )
    );
    setEditOpen(false);
  };

  // =============== 新增问题 ===============
  type AddAnswerRow = { answer: string };

  const [addOpen, setAddOpen] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm, setAddForm] = useState<{
    language: string;
    category: string;
    power_id: string;
    question: string;
    answers: AddAnswerRow[];
  }>({
    language: "19",
    category: "23",
    power_id: "21",
    question: "",
    answers: [],
  });

  const openAddDialog = () => {
    setAddForm({
      language: "19",
      category: "23",
      power_id: "21",
      question: "",
      answers: [],
    });
    setAddOpen(true);
  };

  const addAnswerRow = () => {
    setAddForm((prev) => ({
      ...prev,
      answers: [...prev.answers, { answer: "" }],
    }));
  };

  const removeAnswerRow = (index: number) => {
    setAddForm((prev) => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index),
    }));
  };

  const handleChangeAddField = (
    field: "language" | "category" | "power_id" | "question",
    value: string
  ) => {
    setAddForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeAnswer = (index: number, value: string) => {
    setAddForm((prev) => ({
      ...prev,
      answers: prev.answers.map((row, i) =>
        i === index
          ? {
              ...row,
              answer: value,
            }
          : row
      ),
    }));
  };

  const handleSaveAdd = async () => {
    if (!addForm.question.trim()) {
      window.alert("问题不能为空");
      return;
    }

    const answersArr: string[] = [];
    for (const ans of addForm.answers) {
      if (!ans.answer.trim()) {
        window.alert("答案内容不能为空");
        return;
      }
      answersArr.push(ans.answer.trim());
    }

    const payload = {
      language: addForm.language,
      category: addForm.category,
      power_id: addForm.power_id,
      question: addForm.question,
      answers: answersArr,
    };

    try {
      setSavingAdd(true);
      // 这里直接用 any，避免和你现有的 request 封装类型冲突
      await addData(payload );
      setAddOpen(false);
      // 如需保存后刷新列表，可以在这里调用后台再拉一次问题列表
    } catch (error) {
      console.error("新增问题失败", error);
    } finally {
      setSavingAdd(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <TextField
            label="问题"
            placeholder="请输入关键词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            size="small"
            sx={{ minWidth: 240 }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="contained" onClick={handleSearch}>
              查询
            </Button>
            <Button color="success" variant="contained" onClick={openAddDialog}>
              新增
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              重置
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 问题表格 */}
      <Card>
        <CardContent>
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={60}>ID</TableCell>
                  <TableCell>问题内容</TableCell>
                  <TableCell width={220}>UUID</TableCell>
                  <TableCell width={200} align="center">
                    操作
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedQuestions.data.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.question}</TableCell>
                    <TableCell>{row.uuid}</TableCell>
                    <TableCell align="center">
                      <Button size="small" onClick={() => openDetail(row)}>
                        查看答案
                      </Button>
                      <Button size="small" onClick={() => openEdit(row)}>
                        修改
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pagedQuestions.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 分页 */}
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2">
              共 {pagedQuestions.total} 条
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel id="page-size-label">每页</InputLabel>
                <Select
                  labelId="page-size-label"
                  label="每页"
                  value={String(pagination.pageSize)}
                  onChange={handlePageSizeChange}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>
              <Pagination
                color="primary"
                count={Math.max(
                  1,
                  Math.ceil(pagedQuestions.total / pagination.pageSize)
                )}
                page={pagination.page}
                onChange={handlePageChange}
                showFirstButton
                showLastButton
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 查看答案弹窗 */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>查看答案</DialogTitle>
        <DialogContent dividers>
          {detailQuestion && (
            <Box
              sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}
            >
              <TextField
                label="问题ID"
                value={detailQuestion.id}
                size="small"
                InputProps={{ readOnly: true }}
              />
              <TextField
                label="问题内容"
                value={detailQuestion.question}
                size="small"
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}

          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={80}>序号</TableCell>
                  <TableCell>答案内容</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentAnswers.data.map((row) => (
                  <TableRow key={row.order} hover>
                    <TableCell>{row.order}</TableCell>
                    <TableCell>{row.answer}</TableCell>
                  </TableRow>
                ))}
                {currentAnswers.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      暂无答案
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Typography variant="body2">
              共 {currentAnswers.total} 条
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel id="answer-page-size-label">每页</InputLabel>
                <Select
                  labelId="answer-page-size-label"
                  label="每页"
                  value={String(answerPagination.pageSize)}
                  onChange={handleAnswerPageSizeChange}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                </Select>
              </FormControl>
              <Pagination
                color="primary"
                count={Math.max(
                  1,
                  Math.ceil(currentAnswers.total / answerPagination.pageSize)
                )}
                page={answerPagination.page}
                onChange={handleAnswerPageChange}
                showFirstButton
                showLastButton
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>修改问题</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="问题内容"
            fullWidth
            multiline
            minRows={2}
            value={editForm.question}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, question: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新增弹窗 */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>新增问题</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="lang-label">编程语言</InputLabel>
                <Select
                  labelId="lang-label"
                  label="编程语言"
                  value={addForm.language}
                  onChange={(e) =>
                    handleChangeAddField("language", e.target.value)
                  }
                >
                  <MenuItem value="19">Java</MenuItem>
                  <MenuItem value="20">Python</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="category-label">类别</InputLabel>
                <Select
                  labelId="category-label"
                  label="类别"
                  value={addForm.category}
                  onChange={(e) =>
                    handleChangeAddField("category", e.target.value)
                  }
                >
                  <MenuItem value="23">语法</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="power-label">优先度</InputLabel>
                <Select
                  labelId="power-label"
                  label="优先度"
                  value={addForm.power_id}
                  onChange={(e) =>
                    handleChangeAddField("power_id", e.target.value)
                  }
                >
                  <MenuItem value="21">普通</MenuItem>
                  <MenuItem value="22">重点</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="问题内容"
              fullWidth
              value={addForm.question}
              onChange={(e) => handleChangeAddField("question", e.target.value)}
            />

            <Box>
              <Box
                sx={{
                  mb: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1">回答列表</Typography>
                <Button size="small" variant="contained" onClick={addAnswerRow}>
                  新增回答
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width={60}>#</TableCell>
                      <TableCell>答案内容</TableCell>
                      <TableCell width={100}>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addForm.answers.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <TextField
                            multiline
                            minRows={2}
                            fullWidth
                            value={row.answer}
                            onChange={(e) =>
                              handleChangeAnswer(index, e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeAnswerRow(index)}
                          >
                            删除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {addForm.answers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          暂无回答，请点击“新增回答”添加
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSaveAdd}
            disabled={savingAdd}
          >
            {savingAdd ? "保存中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionManagement;