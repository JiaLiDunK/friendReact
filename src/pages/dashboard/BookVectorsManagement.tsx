import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { BookOpen, Database, Inbox, Layers, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { getBookVectorsList, delBooksVectors, updateBooksVectors } from "@/api/books";
import { getTypeOptions } from "@/api/database";

interface BookVector {
  id: number | string;
  tittle: string;
  uuid: string;
  type_id: number;
  knowledge_base_id: string;
}

interface BookVectorListApiData {
  total: number;
  items: BookVector[];
}

interface KnowledgeBaseOption {
  label: string;
  value: string;
}

const border = "1px solid hsl(var(--border))";
const mutedText = "hsl(var(--muted-foreground))";
const paperSx = {
  border,
  borderRadius: 3,
  bgcolor: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
};
const statusStyles: Record<number, { color: string; background: string }> = {
  8: { color: "#b45309", background: "rgba(245, 158, 11, 0.12)" },
  9: { color: "#2563eb", background: "rgba(59, 130, 246, 0.10)" },
  11: { color: "#15803d", background: "rgba(34, 197, 94, 0.10)" },
};

const BookVectorsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BookVector | null>(null);
  const requestId = useRef(0);

  // 查询参数
  const [keyword, setKeyword] = useState("");
  const appliedKeyword = useRef("");

  // 表格数据
  const [tableData, setTableData] = useState<BookVector[]>([]);

  // 分页信息（MUI 使用 0 基索引）
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // 编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<BookVector | null>(null);

  // 知识库选项
  const [knowledgeBaseOptions, setKnowledgeBaseOptions] = useState<KnowledgeBaseOption[]>([]);

  const fetchData = async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError(false);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: appliedKeyword.current,
      };
      const res = await getBookVectorsList(payload);
      if (currentRequest !== requestId.current) return;
      const apiData = (res.data as { data?: BookVectorListApiData }).data ?? (res.data as BookVectorListApiData);
      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取列表失败:", error);
      if (currentRequest === requestId.current) setLoadError(true);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  const fetchKnowledgeBaseOptions = async () => {
    try {
      const res = await getTypeOptions();
      const list = (res.data.data || []).map((item: KnowledgeBaseOption) => ({
        label: item.label,
        value: String(item.value),
      }));
      setKnowledgeBaseOptions(list);
    } catch (error) {
      console.error("获取知识库列表失败:", error);
    }
  };

  useEffect(() => {
    fetchData();
    return () => { requestId.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchKnowledgeBaseOptions();
  }, []);

  // 关键字搜索
  const handleSearch = () => {
    appliedKeyword.current = keyword.trim();
    if (pagination.page === 0) fetchData();
    else setPagination((prev) => ({ ...prev, page: 0 }));
  };

  // 重置
  const handleReset = () => {
    setKeyword("");
    appliedKeyword.current = "";
    if (pagination.page === 0) fetchData();
    else setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, page: 0, pageSize: newSize }));
  };

  // 进度显示
  const renderProgress = (type_id: number) => {
    const label = type_id === 8 ? "待选择知识库" : type_id === 9 ? "待向量化" : type_id === 11 ? "已向量化" : "未知状态";
    const style = statusStyles[type_id] ?? { color: mutedText, background: "hsl(var(--muted))" };
    return (
      <Chip
        size="small"
        label={label}
        icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "currentColor" }} />}
        sx={{ color: style.color, bgcolor: style.background, fontSize: 12, fontWeight: 500, height: 26, "& .MuiChip-icon": { color: "inherit", ml: 1.25 }, "& .MuiChip-label": { px: 1.25 } }}
      />
    );
  };

  // 知识库格式化
  const formatKnowledgeBase = (knowledge_base_id: string) => {
    const item = knowledgeBaseOptions.find((opt) => opt.value === String(knowledge_base_id));
    return item ? item.label : knowledge_base_id || "未分配";
  };

  // 打开编辑弹窗
  const openEditDialog = (row: BookVector) => {
    setEditForm({ ...row, knowledge_base_id: String(row.knowledge_base_id ?? "") });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    if (saving) return;
    setEditDialogOpen(false);
    setEditForm(null);
  };

  const handleEditKnowledgeBaseChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    setEditForm((prev) => (prev ? { ...prev, knowledge_base_id: value } : prev));
  };

  const handleSaveEdit = async () => {
    if (!editForm || saving) return;
    setSaving(true);
    try {
      await updateBooksVectors({ ...editForm, knowledge_base_id: Number(editForm.knowledge_base_id) });
      setEditDialogOpen(false);
      setEditForm(null);
      fetchData();
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await delBooksVectors(deleteTarget);
      setDeleteTarget(null);
      if (tableData.length === 1 && pagination.page > 0) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      } else {
        fetchData();
      }
    } catch (error) {
      console.error("删除失败:", error);
    } finally {
      setDeleting(false);
    }
  };

  const renderBook = (row: BookVector) => (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 44, flexShrink: 0, borderRadius: 2, bgcolor: "hsl(var(--muted))", color: mutedText }}>
        <BookOpen size={18} strokeWidth={1.6} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 500, overflowWrap: "anywhere", lineHeight: 1.6 }}>{row.tittle || "未命名书籍"}</Typography>
        <Typography sx={{ mt: 0.35, fontSize: 11, color: mutedText, fontFamily: "monospace", overflowWrap: "anywhere" }}>UUID · {row.uuid || "—"}</Typography>
      </Box>
    </Stack>
  );

  const renderActions = (row: BookVector) => (
    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
      <Button size="small" startIcon={<Pencil size={14} />} onClick={() => openEditDialog(row)} sx={{ fontSize: 12, px: 1.25 }}>编辑</Button>
      <Tooltip title="删除记录">
        <IconButton size="small" aria-label={`删除 ${row.tittle}`} onClick={() => setDeleteTarget(row)} sx={{ color: mutedText, "&:hover": { color: "error.main", bgcolor: "rgba(239, 68, 68, 0.08)" } }}>
          <Trash2 size={16} />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <Box sx={{ width: "100%", maxWidth: 1440, mx: "auto", display: "flex", flexDirection: "column", gap: 3, color: "hsl(var(--foreground))", "& .MuiButton-root": { textTransform: "none", borderRadius: 2, boxShadow: "none" } }}>
      <Stack direction="row" spacing={1.75} alignItems="center">
        <Box sx={{ width: 46, height: 46, borderRadius: 3, bgcolor: "rgba(59, 130, 246, 0.10)", color: "#2563eb", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Layers size={23} strokeWidth={1.7} />
        </Box>
        <Box>
          <Typography component="h1" sx={{ fontSize: { xs: 21, md: 24 }, fontWeight: 600, letterSpacing: "-0.5px" }}>书籍向量管理</Typography>
          <Typography sx={{ mt: 0.5, color: mutedText, fontSize: 13 }}>查看向量化进度，管理书籍与知识库的关联</Typography>
        </Box>
      </Stack>

      <Card variant="outlined" sx={{ ...paperSx, boxShadow: "0 4px 24px rgba(15, 23, 42, 0.025)", overflow: "hidden" }}>
        <Box component="form" onSubmit={(event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); handleSearch(); }} sx={{ p: { xs: 2, md: 2.5 }, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, borderBottom: border }}>
          <TextField
            size="small"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索书名关键词…"
            inputProps={{ "aria-label": "书名关键词" }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search size={17} color="hsl(var(--muted-foreground))" /></InputAdornment> }}
            sx={{ width: { xs: "100%", sm: 320 }, "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, color: "inherit", bgcolor: "hsl(var(--background))" }, "& fieldset": { borderColor: "hsl(var(--border))" } }}
          />
          <Button type="submit" variant="contained" disabled={loading} sx={{ px: 2.5, height: 38 }}>查询</Button>
          <Button onClick={handleReset} disabled={loading} startIcon={<RotateCcw size={14} />} sx={{ color: mutedText, height: 38 }}>重置</Button>
          <Typography sx={{ ml: { xs: 0, sm: "auto" }, fontSize: 12, color: mutedText }}>按书名检索向量记录</Typography>
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography component="h2" sx={{ fontSize: 14, fontWeight: 600 }}>向量记录</Typography>
            <Chip size="small" label={loadError ? "—" : `${pagination.total} 条`} sx={{ height: 23, fontSize: 11, bgcolor: "hsl(var(--muted))", color: mutedText }} />
          </Stack>
          <Tooltip title="刷新列表">
            <span><IconButton size="small" aria-label="刷新列表" disabled={loading} onClick={() => fetchData()} sx={{ color: mutedText }}><RotateCcw size={16} /></IconButton></span>
          </Tooltip>
        </Stack>

        {loading ? (
          <Stack spacing={2.5} sx={{ px: 2.5, pb: 3 }} aria-label="正在加载向量记录" role="status">
            {Array.from({ length: 5 }, (_, index) => (
              <Stack key={index} direction="row" spacing={2} alignItems="center">
                <Skeleton variant="rounded" width={38} height={44} />
                <Box sx={{ flex: 1 }}><Skeleton width="55%" height={22} /><Skeleton width="75%" height={16} /></Box>
                <Skeleton variant="rounded" width={80} height={24} sx={{ display: { xs: "none", sm: "block" } }} />
              </Stack>
            ))}
          </Stack>
        ) : loadError ? (
          <Box sx={{ px: 2.5, pb: 3 }}><Alert severity="error" action={<Button color="inherit" size="small" onClick={() => fetchData()}>重试</Button>}>列表加载失败，请稍后重试。</Alert></Box>
        ) : tableData.length === 0 ? (
          <Stack alignItems="center" spacing={1.25} sx={{ py: 8, px: 2, textAlign: "center" }}>
            <Box sx={{ width: 60, height: 60, display: "grid", placeItems: "center", bgcolor: "hsl(var(--muted))", borderRadius: "50%", color: mutedText, mb: 0.75 }}><Inbox size={27} strokeWidth={1.4} /></Box>
            <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{appliedKeyword.current ? "未找到匹配的书籍" : "暂无向量记录"}</Typography>
            <Typography sx={{ fontSize: 13, color: mutedText }}>{appliedKeyword.current ? "试试其他关键词，或重置查看全部记录" : "书籍提交向量化后，将在这里显示"}</Typography>
            {appliedKeyword.current && <Button size="small" onClick={handleReset}>清除搜索</Button>}
          </Stack>
        ) : (
          <>
            <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
              <Table aria-label="书籍向量记录" sx={{ tableLayout: "fixed", "& .MuiTableCell-root": { borderBottom: border, color: "inherit", px: 2.5, py: 2 }, "& .MuiTableCell-head": { bgcolor: "hsl(var(--background))", color: mutedText, fontSize: 12, fontWeight: 500, py: 1.25 }, "& .MuiTableRow-root:last-child td": { borderBottom: 0 } }}>
                <TableHead><TableRow>
                  <TableCell sx={{ width: "9%" }}>ID</TableCell>
                  <TableCell sx={{ width: "40%" }}>书籍信息</TableCell>
                  <TableCell sx={{ width: "17%" }}>向量化状态</TableCell>
                  <TableCell sx={{ width: "20%" }}>所属知识库</TableCell>
                  <TableCell align="right" sx={{ width: "14%" }}>操作</TableCell>
                </TableRow></TableHead>
                <TableBody>{tableData.map((row) => (
                  <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "hsl(var(--muted) / 0.45)" } }}>
                    <TableCell><Typography sx={{ fontSize: 12, color: mutedText, overflowWrap: "anywhere" }}>#{row.id}</Typography></TableCell>
                    <TableCell>{renderBook(row)}</TableCell>
                    <TableCell>{renderProgress(row.type_id)}</TableCell>
                    <TableCell><Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: mutedText }}><Database size={14} style={{ flexShrink: 0 }} /><Typography sx={{ fontSize: 13, overflowWrap: "anywhere" }}>{formatKnowledgeBase(row.knowledge_base_id)}</Typography></Stack></TableCell>
                    <TableCell align="right">{renderActions(row)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: { xs: "block", md: "none" } }}>
              {tableData.map((row) => (
                <Box key={row.id} sx={{ px: 2, py: 2, borderTop: border }}>
                  {renderBook(row)}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.75 }}>
                    {renderProgress(row.type_id)}
                    <Typography sx={{ fontSize: 11, color: mutedText, overflowWrap: "anywhere" }}>#{row.id}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: 12, color: mutedText, overflowWrap: "anywhere", minWidth: 0 }}>知识库 · {formatKnowledgeBase(row.knowledge_base_id)}</Typography>
                    <Box sx={{ flexShrink: 0 }}>{renderActions(row)}</Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 20, 50]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.pageSize}
          page={pagination.page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          disabled={loading}
          labelRowsPerPage="每页"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} / 共 ${count} 条`}
          getItemAriaLabel={(type) => ({ first: "第一页", last: "最后一页", next: "下一页", previous: "上一页" })[type]}
          sx={{ borderTop: border, color: mutedText, "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 }, minHeight: 60, flexWrap: "wrap", justifyContent: "flex-end" }, "& .MuiTablePagination-spacer": { display: { xs: "none", sm: "block" } }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 }, "& .MuiTablePagination-input": { mr: { xs: 1, sm: 3 }, ml: 0.5 }, "& .MuiTablePagination-actions": { ml: { xs: 0, sm: 2 } } }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Dialog open={editDialogOpen} onClose={closeEditDialog} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }} aria-labelledby="edit-vector-title">
        <DialogTitle id="edit-vector-title" sx={{ px: 3, pt: 2.5, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 17, fontWeight: 600 }}>
          编辑知识库关联
          <IconButton size="small" aria-label="关闭编辑" onClick={closeEditDialog} disabled={saving}><X size={18} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          {editForm && (
            <Stack spacing={2.5}>
              <Box sx={{ p: 2, bgcolor: "hsl(var(--muted) / 0.6)", borderRadius: 2, border }}>
                {renderBook(editForm)}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
                  <Typography sx={{ fontSize: 12, color: mutedText }}>ID · {editForm.id}</Typography>
                  {renderProgress(editForm.type_id)}
                </Stack>
              </Box>
              <FormControl fullWidth size="small" disabled={saving}>
                <InputLabel id="kb-select-label">所属知识库</InputLabel>
                <Select labelId="kb-select-label" value={editForm.knowledge_base_id ?? ""} label="所属知识库" onChange={handleEditKnowledgeBaseChange} sx={{ borderRadius: 2, color: "inherit" }}>
                  <MenuItem value="" disabled>请选择知识库</MenuItem>
                  {editForm.knowledge_base_id && !knowledgeBaseOptions.some((item) => item.value === editForm.knowledge_base_id) && (
                    <MenuItem value={editForm.knowledge_base_id}>{editForm.knowledge_base_id}</MenuItem>
                  )}
                  {knowledgeBaseOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                </Select>
                <Typography sx={{ mt: 1.25, fontSize: 12, color: mutedText }}>保存后，该书籍向量将关联到所选知识库。</Typography>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: border }}>
          <Button onClick={closeEditDialog} disabled={saving} sx={{ color: mutedText }}>取消</Button>
          <Button variant="contained" disableElevation onClick={handleSaveEdit} disabled={!editForm?.knowledge_base_id || saving} sx={{ borderRadius: 2 }}>{saving ? "保存中…" : "保存修改"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => { if (!deleting) setDeleteTarget(null); }} maxWidth="xs" fullWidth PaperProps={{ sx: paperSx }} aria-labelledby="delete-vector-title" aria-describedby="delete-vector-description">
        <DialogTitle id="delete-vector-title" sx={{ px: 3, pt: 3, fontSize: 17, fontWeight: 600 }}>删除这条向量记录？</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500, mb: 1, overflowWrap: "anywhere" }}>{deleteTarget?.tittle}</Typography>
          <Typography id="delete-vector-description" sx={{ fontSize: 13, color: mutedText }}>删除后无法恢复，请确认是否继续。</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: border }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: mutedText }}>取消</Button>
          <Button variant="contained" color="error" disableElevation onClick={handleDelete} disabled={deleting} sx={{ borderRadius: 2 }}>{deleting ? "删除中…" : "确认删除"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookVectorsManagement;
