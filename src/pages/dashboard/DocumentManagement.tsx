import React, { useCallback, useEffect, useRef, useState } from "react";

// Extend the Window interface to include showDirectoryPicker
declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Skeleton,
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
  Switch,
  Stack,
} from "@mui/material";
import {
  Boxes,
  Eye,
  FileText,
  Inbox,
  Languages,
  Layers,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Scissors,
  Search,
  Upload,
} from "lucide-react";
import { getBookList, getChunkList, updateBook, updateChunkList, putBookVectors, translateBook } from "@/api/books";
import { getOptions } from "@/api/dataset";
import { addList } from "@/api/joinLink";
import { readBooks } from "@/api/read";
interface BookItem {
  id: number;
  tittle: string;
  uuid: string;
  type_id: number;
}

interface DatasetOption {
  value: number;
  label: string;
}

interface BookListApiData {
  total: number;
  items: BookItem[];
}

interface ChunkItem {
  order_id: number;
  content: string;
  type_id: number;
}

interface ChunkListApiData {
  total: number;
  items: ChunkItem[];
}

const statusLabelMap: Record<number, string> = {
  4: "解析成功",
  5: "解析失败",
  6: "内容较少",
  9: "已准备向量化",
  10: "重复书籍",
};

const statusStyleMap: Record<number, { color: string; bg: string }> = {
  4: { color: "#15803d", bg: "rgba(34, 197, 94, 0.12)" },
  5: { color: "#b91c1c", bg: "rgba(239, 68, 68, 0.12)" },
  6: { color: "#b45309", bg: "rgba(245, 158, 11, 0.14)" },
  9: { color: "#1d4ed8", bg: "rgba(59, 130, 246, 0.12)" },
  10: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted))" },
};

const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({ value: Number(value), label }));

const border = "1px solid hsl(var(--border))";
const mutedText = "hsl(var(--muted-foreground))";
const cardSx = {
  borderRadius: 3,
  border,
  bgcolor: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 4px 24px rgba(15, 23, 42, 0.025)",
} as const;
const dialogPaperSx = {
  borderRadius: 3,
  border,
  bgcolor: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  "& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiFormLabel-root": { fontFamily: "inherit" },
  "& .MuiButton-root": { borderRadius: 2, boxShadow: "none", textTransform: "none" },
  "& .MuiButton-containedPrimary": { bgcolor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" },
  "& .MuiOutlinedInput-root": { borderRadius: 2, color: "inherit", "& fieldset": { borderColor: "hsl(var(--border))" } },
  "& .MuiInputLabel-root": { color: mutedText },
} as const;
const dialogTitleSx = { px: 3, pt: 2.5, pb: 1, fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" } as const;
const dialogActionsSx = { px: 3, py: 2, borderTop: border } as const;

const DocumentManagement: React.FC = () => {
  const [queryParams, setQueryParams] = useState({
    keyword: "",
  });

  const [tableData, setTableData] = useState<BookItem[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [activeKeyword, setActiveKeyword] = useState("");
  const tableRequestRef = useRef(0);
  const [contentLoading, setContentLoading] = useState(false);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailForm, setDetailForm] = useState({
    id: undefined,
    tittle: "",
    uuid: "",
  });

  const [contentData, setContentData] = useState<ChunkItem[]>([]);
  const [contentPagination, setContentPagination] = useState({
    page: -1,
    total: 0,
  });
  const [contentHasMore, setContentHasMore] = useState(true);
  const [contentError, setContentError] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState(20);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [contentSentinel, setContentSentinel] = useState<HTMLTableRowElement | null>(null);
  const contentSessionRef = useRef(0);
  const contentLoadingRef = useRef(false);

  const [content, setContent] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [fineTuneDialogOpen, setFineTuneDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<number | "">("");
  const [datasetOptions, setDatasetOptions] = useState<DatasetOption[]>([]);
  const [fineTuneTargetBook, setFineTuneTargetBook] = useState<BookItem | null>(null);
  const [fineTuneSubmitting, setFineTuneSubmitting] = useState(false);

  const [pageInputMain, setPageInputMain] = useState("");
  const [rowMenu, setRowMenu] = useState<{ anchor: HTMLElement; row: BookItem } | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState('');
  const [selectedEncoding, setSelectedEncoding] = useState('utf-8');
  const [directoryPath, setDirectoryPath] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [editForm, setEditForm] = useState({
    id: undefined,
    tittle: "",
    type_id: 0,
  });

  const fetchData = async () => {
    const request = ++tableRequestRef.current;
    setTableLoading(true);
    setTableError(false);
    setSelectedRows([]);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: activeKeyword,
      };
      const res = await getBookList(payload);
      if (request !== tableRequestRef.current) return;
      const apiData = (res.data as { data: BookListApiData }).data;
      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      if (request !== tableRequestRef.current) return;
      setTableError(true);
      setTableData([]);
      console.error("获取书籍列表失败:", error);
    } finally {
      if (request === tableRequestRef.current) setTableLoading(false);
    }
  };

  const fetchContentData = useCallback(async (uuid: string, page: number) => {
    if (contentLoadingRef.current) return;
    const session = contentSessionRef.current;
    const pageSize = 5;
    contentLoadingRef.current = true;
    setContentLoading(true);
    setContentError(false);
    try {
      const payload = {
        pagesize: pageSize,
        page_num: page * pageSize,
        keywords: uuid,
      };
      const res = await getChunkList(payload);
      if (session !== contentSessionRef.current) return;
      const apiData = (res.data as { data: ChunkListApiData }).data;
      const items = apiData.items ?? [];
      const loadedCount = page * pageSize + items.length;
      setContentData((prev) => page === 0 ? items : [...prev, ...items]);
      setContentPagination({ page, total: apiData.total ?? loadedCount });
      setContentHasMore(items.length > 0 && (
        apiData.total != null ? loadedCount < apiData.total : items.length === pageSize
      ));
    } catch (error) {
      if (session !== contentSessionRef.current) return;
      console.error("获取文档内容失败:", error);
      setContentError(true);
    } finally {
      if (session === contentSessionRef.current) {
        contentLoadingRef.current = false;
        setContentLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!detailDialogOpen || !contentSentinel || !contentContainerRef.current ||
      contentLoading || contentError || !contentHasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        fetchContentData(detailForm.uuid, contentPagination.page + 1);
      }
    }, { root: contentContainerRef.current, rootMargin: "0px 0px 120px 0px" });
    observer.observe(contentSentinel);
    return () => observer.disconnect();
  }, [detailDialogOpen, contentSentinel, contentLoading, contentError, contentHasMore,
    detailForm.uuid, contentPagination.page, fetchContentData]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize, activeKeyword]);

  useEffect(() => {
    const fetchDatasetOptions = async () => {
      try {
        const response = await getOptions();
        setDatasetOptions(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch dataset options:', error);
      }
    };
    fetchDatasetOptions();
  }, []);

  const applySearch = (keyword: string) => {
    setSelectedRows([]);
    setActiveKeyword(keyword);
    setPagination((prev) => ({ ...prev, page: 0 }));
    if (pagination.page === 0 && activeKeyword === keyword) fetchData();
  };

  const handleSearch = () => applySearch(queryParams.keyword.trim());

  const handleReset = () => {
    setQueryParams({ keyword: "" });
    applySearch("");
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = tableData.map((row) => row.id);
      setSelectedRows(newSelected);
      return;
    }
    setSelectedRows([]);
  };

  const handleRowSelect = (id: number) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleFineTuneDataset = async () => {
    if (!selectedDataset) return;
    if (fineTuneSubmitting) return;

    try {
      setFineTuneSubmitting(true);

      const selectedBooks = fineTuneTargetBook
        ? [fineTuneTargetBook]
        : tableData.filter((book) => selectedRows.includes(book.id));

      const payload = selectedBooks.map((book) => ({
        master_id: selectedDataset,
        slave_id: book.id,
        uuid: book.uuid,
      }));

      await addList(payload);

      setFineTuneDialogOpen(false);
      setSelectedDataset("");
      setFineTuneTargetBook(null);
      setSelectedRows([]);
    } catch (error) {
      console.error("Failed to add books to dataset:", error);
    } finally {
      setFineTuneSubmitting(false);
    }
  };
  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, page: 0, pageSize: newSize }));
  };

  const handleMainPageJump = () => {
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
    const target = Number(pageInputMain);
    if (!Number.isFinite(target) || target < 1) return;
    const clamped = Math.min(target, totalPages);
    setPagination((prev) => ({ ...prev, page: clamped - 1 }));
  };

  const sendBook = async (row: BookItem) => {
    try {
      await putBookVectors(row);
      fetchData();
    } catch (error) {
      console.error("准备向量失败:", error);
    }
  };

  const handleTranslateBook = async (row: BookItem) => {
    try {
      await translateBook(row);
      fetchData();
    } catch (error) {
      console.error("翻译失败:", error);
    }
  };

  const closeDetail = () => {
    contentSessionRef.current += 1;
    contentLoadingRef.current = false;
    setContentLoading(false);
    setDetailDialogOpen(false);
  };

  const openDetail = (row: BookItem) => {
    contentSessionRef.current += 1;
    contentLoadingRef.current = false;
    setDetailForm({
      id: Number(row.id),
      tittle: row.tittle,
      uuid: row.uuid,
    });
    setContentData([]);
    setContentPagination({ page: -1, total: 0 });
    setContentHasMore(true);
    setContentError(false);
    if (contentContainerRef.current) contentContainerRef.current.scrollTop = 0;
    setDetailDialogOpen(true);
    fetchContentData(row.uuid, 0);
  };

  const openFineTuneDialogForBook = (row: BookItem) => {
    setFineTuneTargetBook(row);
    setSelectedDataset("");
    setFineTuneDialogOpen(true);
  };

  const closeFineTuneDialog = () => {
    setFineTuneDialogOpen(false);
    setFineTuneTargetBook(null);
    setSelectedDataset("");
  };

  const openEditDialog = (row: BookItem) => {
    setEditForm({
      id: Number(row.id),
      tittle: row.tittle,
      type_id: row.type_id,
    });
    setEditDialogOpen(true);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditStatusChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value);
    setEditForm((prev) => ({ ...prev, type_id: value }));
  };

  const handleSaveEdit = async () => {
    try {
      await updateBook(editForm);
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("保存书籍失败:", error);
    }
  };
  const handleImportText = async () => { 
    try {
      const data = {
        path: directoryPath,
        encode: selectedEncoding,
        use: purpose || '',
        remark: notes || ''
      };
      await readBooks(data);
      setSelectedDirectory('');
      setPurpose('');
      setNotes('');
      setImportDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error importing books:', error);
    }
  };

  const handleChunkContentChange = (index: number, value: string) => {
    setContentData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], content: value };
      return next;
    });
  };

  const handleChunkSwitchChange = (index: number, value: boolean) => {
    setContentData((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], type_id: value ? 3 : 2 };
      return next;
    });
  };

  const handleSaveDetail = async () => {
    try {
      await updateChunkList(contentData);
      closeDetail();
    } catch (error) {
      console.error("保存详情失败:", error);
    }
  };

  const handleClearLineBreaks = () => {
    setContentData((prev) =>
      prev.map((item) => ({
        ...item,
        content: item.content.replace(/\r?\n/g, " "),
      })),
    );
  };

  const handleDeleteContent = () => {
    contentSessionRef.current += 1;
    contentLoadingRef.current = false;
    setContentLoading(false);
    setContentError(false);
    setContentHasMore(false);
    setContentData([]);
  };

  const runRowMenuAction = (action: (row: BookItem) => void) => {
    if (rowMenu) action(rowMenu.row);
    setRowMenu(null);
  };

  const rowMenuActions = [
    { label: "修改文档", icon: Pencil, onClick: openEditDialog },
    { label: "加入微调数据集", icon: Layers, onClick: openFineTuneDialogForBook },
    { label: "重新切割", icon: Scissors, onClick: openEditDialog },
    { label: "准备向量", icon: Boxes, onClick: sendBook },
    { label: "翻译", icon: Languages, onClick: handleTranslateBook },
  ];

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const isAllSelected = tableData.length > 0 && selectedRows.length === tableData.length;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        minWidth: 0,
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        contain: "inline-size",
        color: "hsl(var(--foreground))",
        "& .MuiTypography-root, & .MuiButton-root, & .MuiInputBase-root, & .MuiTableCell-root, & .MuiChip-root, & .MuiMenuItem-root": { fontFamily: "inherit" },
        "& .MuiButton-root": { textTransform: "none", borderRadius: 2, boxShadow: "none", fontSize: 13, fontWeight: 500 },
        "& .MuiButton-containedPrimary": { bgcolor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", "&:hover": { bgcolor: "hsl(var(--primary) / 0.9)", boxShadow: "none" } },
        "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: 13, color: "inherit", "& fieldset": { borderColor: "hsl(var(--border))" } },
        "& .MuiCheckbox-root": { color: "hsl(var(--muted-foreground) / 0.5)", "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "hsl(var(--primary))" } },
      }}
    >
      {/* 页头 */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography component="h2" sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 650, letterSpacing: "-0.8px" }}>
            文档管理
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: 13, color: mutedText }}>
            集中管理文本，让知识井然有序。
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Upload size={16} />} onClick={() => setImportDialogOpen(true)} sx={{ px: 2.25, height: 40 }}>
          导入文本
        </Button>
      </Box>

      {/* 工具栏 */}
      <Card variant="outlined" sx={{ ...cardSx, overflow: "hidden" }}>
        <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600 }}>{activeKeyword ? "搜索结果" : "全部文档"}</Typography>
            <Chip label={pagination.total.toLocaleString()} size="small" sx={{ height: 22, fontSize: 12, fontWeight: 600, bgcolor: "hsl(var(--muted))", color: mutedText }} />
          </Stack>
          <Typography sx={{ fontSize: 12, color: mutedText, display: { xs: "none", sm: "block" } }}>查看内容 · 整理文档 · 构建数据集</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", px: { xs: 2, md: 3 }, pb: 2.5 }}>
          <Box component="form" onSubmit={(event) => { event.preventDefault(); handleSearch(); }} sx={{ display: "flex", gap: 1, flex: "1 1 320px", maxWidth: { xs: "100%", md: 480 }, minWidth: 0 }}>
            <TextField
              size="small"
              fullWidth
              value={queryParams.keyword}
              onChange={(e) => setQueryParams({ ...queryParams, keyword: e.target.value })}
              placeholder="搜索文档名称…"
              slotProps={{
                htmlInput: { "aria-label": "搜索文档名称" },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={17} style={{ color: mutedText }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ minWidth: 0, "& .MuiOutlinedInput-root": { bgcolor: "hsl(var(--background))" } }}
            />
            <Button type="submit" variant="outlined" disabled={tableLoading} sx={{ flexShrink: 0 }}>搜索</Button>
            <Tooltip title="重置搜索">
              <span><IconButton aria-label="重置搜索" onClick={handleReset} disabled={tableLoading} sx={{ width: 40, height: 40, color: mutedText }}><RotateCcw size={17} /></IconButton></span>
            </Tooltip>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Layers size={16} />}
            onClick={() => {
              setFineTuneTargetBook(null);
              setFineTuneDialogOpen(true);
            }}
            disabled={selectedRows.length === 0 || tableLoading}
            sx={{ ml: { md: "auto" }, width: { xs: "100%", sm: "auto" }, borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", height: 40 }}
          >
            加入微调数据集{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
          </Button>
        </Box>
        {selectedRows.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, px: { xs: 2, md: 3 }, py: 0.75, borderTop: border, bgcolor: "hsl(var(--primary) / 0.05)" }}>
            <Typography role="status" sx={{ fontSize: 12, color: "hsl(var(--primary))" }}>已选择 {selectedRows.length} 篇文档</Typography>
            <Button size="small" onClick={() => setSelectedRows([])}>取消选择</Button>
          </Box>
        )}

      {/* 列表 */}
        <TableContainer sx={{ maxHeight: { xs: "none", md: "calc(100dvh - 350px)" }, minHeight: 280 }}>
          <Table stickyHeader size="medium" aria-label="文档列表" sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow
                sx={{
                  "& .MuiTableCell-head": {
                    bgcolor: "hsl(var(--muted))",
                    color: mutedText,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    borderBottom: border,
                    py: 1.25,
                  },
                }}
              >
                <TableCell padding="checkbox" sx={{ width: { xs: 38, sm: 52 } }}>
                  <Checkbox
                    size="small"
                    indeterminate={selectedRows.length > 0 && !isAllSelected}
                    checked={isAllSelected}
                    onChange={handleSelectAllClick}
                    disabled={tableLoading || tableData.length === 0}
                    slotProps={{ input: { "aria-label": "选择本页全部文档" } }}
                  />
                </TableCell>
                <TableCell sx={{ pl: { xs: 0.5, sm: 1 } }}>文档名称</TableCell>
                <TableCell sx={{ width: 160, display: { xs: "none", md: "table-cell" } }}>处理状态</TableCell>
                <TableCell align="right" sx={{ width: { xs: 80, sm: 124 }, pr: { xs: 1, md: 3 } }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ "& .MuiTableCell-body": { borderBottom: border, py: 2, color: "inherit" } }}>
              {tableLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell padding="checkbox"><Skeleton variant="circular" width={18} height={18} sx={{ mx: "auto" }} /></TableCell>
                    <TableCell><Skeleton width="60%" height={24} /><Skeleton width="80%" height={18} /></TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}><Skeleton variant="rounded" width={88} height={24} /></TableCell>
                    <TableCell align="right"><Skeleton width="80%" sx={{ ml: "auto" }} /></TableCell>
                  </TableRow>
                ))
              ) : tableError || tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ borderBottom: "none !important" }}>
                    <Box sx={{ py: 7, px: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, textAlign: "center" }}>
                      <Box sx={{ display: "grid", placeItems: "center", width: 64, height: 64, borderRadius: 4, bgcolor: "hsl(var(--muted))", color: mutedText, mb: 1 }}>
                        <Inbox size={28} strokeWidth={1.5} />
                      </Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{tableError ? "文档加载失败" : activeKeyword ? "未找到匹配的文档" : "还没有文档"}</Typography>
                      <Typography sx={{ fontSize: 13, color: mutedText }}>{tableError ? "请检查网络连接后重试" : activeKeyword ? "换个关键词，或清除搜索条件后重试" : "导入第一份文本，开始整理你的知识库"}</Typography>
                      <Button variant="outlined" size="small" sx={{ mt: 1 }} onClick={tableError ? () => fetchData() : activeKeyword ? handleReset : () => setImportDialogOpen(true)}>
                        {tableError ? "重新加载" : activeKeyword ? "清除搜索" : "导入文本"}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => {
                  const selected = selectedRows.includes(row.id);
                  const status = statusStyleMap[row.type_id];
                  const statusChip = (
                    <Chip
                      size="small"
                      label={statusLabelMap[row.type_id] ?? `状态 ${row.type_id}`}
                      sx={{ height: 24, fontSize: 11, fontWeight: 500, borderRadius: 1.5, color: status?.color ?? mutedText, bgcolor: status?.bg ?? "hsl(var(--muted))" }}
                    />
                  );
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      selected={selected}
                      sx={{
                        "&.Mui-selected, &.Mui-selected:hover": { bgcolor: "hsl(var(--primary) / 0.06)" },
                        "&:hover": { bgcolor: "hsl(var(--muted) / 0.45)" },
                        "&:last-child .MuiTableCell-body": { borderBottom: "none" },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={selected} onChange={() => handleRowSelect(row.id)} slotProps={{ input: { "aria-label": `选择文档 ${row.tittle}` } }} />
                      </TableCell>
                      <TableCell sx={{ pl: { xs: 0.5, sm: 1 }, pr: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                          <Box sx={{ display: { xs: "none", sm: "grid" }, placeItems: "center", width: 40, height: 46, flexShrink: 0, borderRadius: 2, border: "1px solid hsl(var(--primary) / 0.1)", bgcolor: "hsl(var(--primary) / 0.05)", color: "hsl(var(--primary))" }}>
                            <FileText size={20} strokeWidth={1.5} />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography component="button" onClick={() => openDetail(row)} title={row.tittle} sx={{ display: "block", maxWidth: "100%", textAlign: "left", fontSize: 14, fontWeight: 500, lineHeight: 1.6, color: "inherit", overflowWrap: "anywhere", cursor: "pointer", "&:hover": { color: "hsl(var(--primary))" }, "&:focus-visible": { outline: "2px solid hsl(var(--primary))", outlineOffset: 3, borderRadius: 0.5 } }}>
                              {row.tittle || "未命名文档"}
                            </Typography>
                            <Typography noWrap title={`ID: ${row.id} · UUID: ${row.uuid}`} sx={{ mt: 0.5, fontSize: 11, color: mutedText, fontVariantNumeric: "tabular-nums" }}>
                              ID: {row.id} <Box component="span" sx={{ mx: 0.75, opacity: 0.5 }}> / </Box> UUID: {row.uuid}
                            </Typography>
                            <Box sx={{ display: { xs: "block", md: "none" }, mt: 1 }}>{statusChip}</Box>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{statusChip}</TableCell>
                      <TableCell align="right" sx={{ px: { xs: 0.5, sm: 1 }, pr: { xs: 1, md: 3 } }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} alignItems="center" justifyContent="flex-end" sx={{ "& .MuiIconButton-root": { width: 32, height: 32, color: mutedText, "&:hover": { color: "hsl(var(--primary))", bgcolor: "hsl(var(--primary) / 0.08)" } } }}>
                          <Tooltip title="查看内容">
                            <IconButton size="small" onClick={() => openDetail(row)} aria-label={`查看 ${row.tittle}`}><Eye size={17} /></IconButton>
                          </Tooltip>
                          <Tooltip title="更多操作">
                            <IconButton size="small" onClick={(e) => setRowMenu({ anchor: e.currentTarget, row })} aria-label={`更多操作：${row.tittle}`} aria-haspopup="menu" aria-expanded={rowMenu?.row.id === row.id}><MoreHorizontal size={18} /></IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, px: { xs: 1, md: 2 }, py: 0.5, borderTop: border }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelRowsPerPage="每页"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count} 篇`}
            getItemAriaLabel={(type) => type === "previous" ? "上一页" : type === "next" ? "下一页" : type === "first" ? "首页" : "末页"}
            disabled={tableLoading || tableError}
            sx={{ color: mutedText, width: { xs: "100%", sm: "auto" }, "& .MuiTablePagination-toolbar": { px: 0, minHeight: 56, flexWrap: "wrap", justifyContent: "center" }, "& .MuiTablePagination-spacer": { display: "none" }, "& .MuiTablePagination-selectLabel": { display: { xs: "none", sm: "block" } }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: 12 }, "& .MuiTablePagination-input": { ml: 0.5, mr: 1.5 }, "& .MuiTablePagination-actions": { ml: 1 } }}
          />
          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, pr: 1 }}>
            <Typography sx={{ fontSize: 13, color: mutedText }}>跳至</Typography>
            <TextField
              size="small"
              value={pageInputMain}
              onChange={(e) => setPageInputMain(e.target.value.replace(/[^0-9]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleMainPageJump()}
              slotProps={{ htmlInput: { "aria-label": "跳转页码", inputMode: "numeric", style: { textAlign: "center", padding: "6px 8px" } } }}
              sx={{ width: 64, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <Typography sx={{ fontSize: 13, color: mutedText }}>/ {totalPages} 页</Typography>
            <Button size="small" color="inherit" onClick={handleMainPageJump} disabled={tableLoading || tableError}>跳转</Button>
          </Box>
        </Box>
      </Card>

      <Menu
        anchorEl={rowMenu?.anchor}
        open={Boolean(rowMenu)}
        onClose={() => setRowMenu(null)}
        slotProps={{ paper: { sx: { borderRadius: 2.5, border, minWidth: 190, mt: 0.75, p: 0.5, bgcolor: "hsl(var(--card))", color: "hsl(var(--card-foreground))", "& .MuiMenuItem-root": { borderRadius: 1.5 }, "& .MuiTypography-root": { fontFamily: "inherit", fontSize: 13 }, boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)" } } }}
      >
        {rowMenuActions.map(({ label, icon: Icon, onClick }) => (
          <MenuItem key={label} onClick={() => runRowMenuAction(onClick)} sx={{ fontSize: 14, py: 1 }}>
            <ListItemIcon sx={{ color: mutedText, minWidth: 32 }}><Icon size={16} /></ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      <Dialog
        open={detailDialogOpen}
        onClose={closeDetail}
        maxWidth="xl"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              ...dialogPaperSx,
              m: { xs: 1, md: 3 },
              width: { xs: "calc(100% - 16px)", md: "calc(100% - 48px)" },
              height: { xs: "calc(100dvh - 16px)", md: "calc(100dvh - 48px)" },
              maxHeight: { xs: "calc(100dvh - 16px)", md: "calc(100dvh - 48px)" },
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ px: { xs: 2, md: 3 }, py: 1.5, borderBottom: border }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="h2" noWrap title={detailForm.tittle} sx={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>
                {detailForm.tittle || "书籍详情"}
              </Typography>
              <Typography noWrap component="div" title={`ID: ${detailForm.id} · UUID: ${detailForm.uuid}`} sx={{ fontSize: 12, color: mutedText, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                ID: {detailForm.id} · UUID: {detailForm.uuid}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <Button size="small" variant="outlined" aria-label="缩小正文字号" disabled={readerFontSize <= 16} onClick={() => setReaderFontSize((size) => Math.max(16, size - 2))}>
                字号－
              </Button>
              <Typography sx={{ fontSize: 13, minWidth: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }} aria-live="polite">{readerFontSize}px</Typography>
              <Button size="small" variant="outlined" aria-label="放大正文字号" disabled={readerFontSize >= 28} onClick={() => setReaderFontSize((size) => Math.min(28, size + 2))}>
                字号＋
              </Button>
            </Stack>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", px: { xs: 1, md: 3 }, pt: 2, pb: 1 }}>
          <TableContainer
            ref={contentContainerRef}
            component={Paper}
            variant="outlined"
            sx={{ flex: 1, minHeight: 0, overflow: "auto", overscrollBehavior: "contain", borderRadius: 2, borderColor: "hsl(var(--border))" }}
          >
            <Table size="small" stickyHeader sx={{ tableLayout: "fixed", maxWidth: 1200, mx: "auto" }}>
              <TableHead>
                <TableRow sx={{ "& .MuiTableCell-head": { bgcolor: "hsl(var(--muted))", color: mutedText, fontSize: 12, fontWeight: 600 } }}>
                  <TableCell sx={{ width: { xs: 44, sm: 64 }, px: 1 }}>序号</TableCell>
                  <TableCell>文档内容</TableCell>
                  <TableCell sx={{ width: { xs: 64, sm: 100 }, px: 1 }}>是否需要</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contentData.map((row, index) => (
                  <TableRow key={row.order_id}>
                    <TableCell sx={{ verticalAlign: "top", pt: 3, px: 1, color: mutedText, overflowWrap: "anywhere" }}>{row.order_id}</TableCell>
                    <TableCell sx={{ py: 1.5, px: { xs: 0, sm: 1 } }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        value={row.content}
                        onChange={(e) => handleChunkContentChange(index, e.target.value)}
                        slotProps={{ htmlInput: { "aria-label": `第 ${row.order_id} 段内容` } }}
                        sx={{
                          "& .MuiInputBase-root": {
                            fontSize: `${readerFontSize}px`,
                            lineHeight: 1.9,
                            p: { xs: 1, sm: 2 },
                          },
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: "top", pt: 2, px: 1 }}>
                      <Switch
                        size="small"
                        checked={row.type_id === 3}
                        onChange={(e) => handleChunkSwitchChange(index, e.target.checked)}
                        slotProps={{ input: { "aria-label": `是否需要第 ${row.order_id} 段` } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow ref={setContentSentinel}>
                  <TableCell colSpan={3} align="center" aria-live="polite" sx={{ color: mutedText, fontSize: 13, py: 2 }}>
                    {contentLoading ? "加载中..." : contentError ? (
                      <>
                        加载失败，请重试
                        <Button size="small" onClick={() => fetchContentData(detailForm.uuid, contentPagination.page + 1)}>
                          重试
                        </Button>
                      </>
                    ) : contentHasMore ? "向下滚动加载更多" : contentData.length === 0 ? "暂无内容" : "已加载全部内容"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 1.5, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
            <Typography sx={{ fontSize: 12, color: mutedText, mr: "auto" }}>
              已加载 {contentData.length} 条 / 共 {contentPagination.total} 条
            </Typography>
            <TextField
              label="内容操作备注"
              size="small"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ flex: { xs: "1 1 100%", sm: "0 1 260px" }, minWidth: 160 }}
            />
            <Button variant="outlined" size="small" onClick={handleClearLineBreaks}>
              清除换行符
            </Button>
            <Button variant="outlined" color="error" size="small" onClick={handleDeleteContent}>
              删除内容
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ ...dialogActionsSx, py: 1.5 }}>
          <Button color="inherit" onClick={closeDetail}>关闭</Button>
          <Button variant="contained" onClick={handleSaveDetail} disabled={contentLoading || contentPagination.page < 0}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={dialogTitleSx}>修改书籍</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
          <TextField
            label="书籍ID"
            fullWidth
            margin="normal"
            value={editForm.id ?? ""}
            disabled
          />
          <TextField
            label="书籍名称"
            fullWidth
            margin="normal"
            name="tittle"
            value={editForm.tittle}
            onChange={handleEditInputChange}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="book-status-label">状态</InputLabel>
            <Select
              labelId="book-status-label"
              value={editForm.type_id}
              label="状态"
              onChange={handleEditStatusChange}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button color="inherit" onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={fineTuneDialogOpen}
        onClose={closeFineTuneDialog}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx } }}
      >
        <DialogTitle sx={dialogTitleSx}>加入微调数据集</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
          <Typography sx={{ fontSize: 13, color: mutedText, mb: 1 }}>
            {fineTuneTargetBook
              ? <>将「{fineTuneTargetBook.tittle}」加入所选数据集</>
              : <>将已选的 {selectedRows.length} 本书籍加入所选数据集</>}
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel>选择数据集</InputLabel>
            <Select
              value={selectedDataset}
              label="选择数据集"
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              {datasetOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button color="inherit" onClick={closeFineTuneDialog}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handleFineTuneDataset}
            disabled={!selectedDataset || fineTuneSubmitting}
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>

      {/* 导入文本对话框 */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: dialogPaperSx } }}>
        <DialogTitle sx={dialogTitleSx}>导入文档</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
          <Typography sx={{ fontSize: 13, color: mutedText, mb: 2 }}>填写服务端可访问的文本目录，并选择对应的文件编码。</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'flex-start', mt: 1 }}>
            <TextField
              label="目录路径"
              variant="outlined"
              fullWidth
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
              placeholder="请输入目录路径"
            />
            <FormControl variant="outlined" sx={{ minWidth: 130, width: { xs: '100%', sm: 130 }, flexShrink: 0 }}>
              <InputLabel>编码格式</InputLabel>
              <Select
                value={selectedEncoding}
                onChange={(e) => setSelectedEncoding(e.target.value)}
                label="编码格式"
              >
                <MenuItem value="utf-8">UTF-8</MenuItem>
                <MenuItem value="gbk">GBK</MenuItem>
                <MenuItem value="utf-16">UTF-16</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TextField
            fullWidth
            label="用途 (可选)"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            fullWidth
            label="备注 (可选)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            variant="outlined"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={dialogActionsSx}>
          <Button color="inherit" onClick={() => setImportDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleImportText} 
            variant="contained" 
            disabled={!directoryPath.trim()}
          >
            导入
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;
