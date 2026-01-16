import React, { useCallback, useEffect, useState } from "react";
import { 
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  SelectChangeEvent
} from "@mui/material";
import { 
  getList as getQAList, 
  insertData as insertQAData, 
  update as updateQA, 
  delData as deleteQA,
  downLoadJson,
  downLoadJsonByScore,
  downLoadJsonByContext
} from "@/api/QApairs";
import { getOptions } from "@/api/dataset";
import { getBooksOptions } from "@/api/books";
import { Select, MenuItem, InputLabel } from "@mui/material";
/** ================= 类型定义 =================  getBooksOptions*/
interface QAItem {
  id: number;
  chunk_id: number;
  question: string;
  answer: string;
  order_id: number;
  insert_time: string;
  sole_uuid: string;
  score: number
}

interface QAListApiData {
  total: number;
  items: QAItem[];
}

const extractResponsePayload = (res: unknown): unknown => {
  if (!res || typeof res !== 'object') return res;

  if ('data' in res) {
    const level1 = (res as { data?: unknown }).data;
    if (level1 && typeof level1 === 'object' && 'data' in level1) {
      return (level1 as { data?: unknown }).data;
    }
    return level1;
  }

  return res;
};

/** ================= 页面组件 ================= */
const QApairsManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [downloadType, setDownloadType] = useState<'all' | 'byScore' | 'withContext'>('all');
  const [score, setScore] = useState<string>('0');
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<QAItem[]>([]);
  const [datasets, setDatasets] = useState<Array<{value: number, label: string}>>([]);
  const [selectedDataset, setSelectedDataset] = useState<number>(-1);
  const [books, setBooks] = useState<Array<{ value: number; label: string }>>([]);
  const [selectedBook, setSelectedBook] = useState<number>(-1);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState<QAItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QAItem | null>(null);

  /** ================= 数据获取 ================= */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        pagesize: pagination.pageSize,
        page_num: pagination.page + 1,
        keywords: keyword.trim(),
      };

      if (selectedDataset > 0) {
        payload.dataset_id = selectedDataset;
      }

      if (selectedBook > 0) {
        payload.books_id = selectedBook;
      }
      const res = await getQAList(payload);
      const raw = extractResponsePayload(res) as unknown;
      const apiData = (raw as QAListApiData) ?? ({ total: 0, items: [] } as QAListApiData);
      const items = apiData.items ?? [];
      setTableData(items);

      setPagination(prev => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取Q&A列表失败:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, keyword, selectedDataset, selectedBook]);

  // 获取数据集选项
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await getOptions();
        const raw = extractResponsePayload(response) as unknown;
        setDatasets((raw as Array<{ value: number; label: string }>) || []);
      } catch (error) {
        console.error('获取数据集选项失败:', error);
      }
    };
    
    fetchDatasets();
    fetchData();
  }, [fetchData]);
  
  // 处理数据集选择变化
  const handleDatasetChange = (event: SelectChangeEvent) => {
    const newDatasetId = Number(event.target.value);
    setSelectedDataset(newDatasetId);
    setSelectedBook(-1);
    setBooks([]);
    // 重置分页到第一页并重新加载数据
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleBookChange = (event: SelectChangeEvent) => {
    const newBookId = Number(event.target.value);
    setSelectedBook(newBookId);
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  useEffect(() => {
    const fetchBooks = async () => {
      if (selectedDataset <= 0) {
        setBooks([]);
        setSelectedBook(-1);
        return;
      }
      try {
        const response = await getBooksOptions({ dataset_id: selectedDataset });
        const raw = extractResponsePayload(response) as unknown;
        setBooks((raw as Array<{ value: number; label: string }>) || []);
      } catch (error) {
        console.error('获取书籍选项失败:', error);
        setBooks([]);
      }
    };
    fetchBooks();
  }, [selectedDataset]);

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.pageSize, selectedDataset, selectedBook]);

/** ================= 搜索 & 分页 ================= */

  /** ================= 搜索 & 分页 ================= */
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchData();
  };

  const handleReset = () => {
    setKeyword("");
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchData();
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(0, Math.min(newPage, Math.ceil(prev.total / prev.pageSize) - 1))
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ ...prev, page: 0, pageSize: newSize }));
  };

  /** ================= 弹窗相关 ================= */
  const openAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      id: 0,
      chunk_id: 0,
      question: "",
      answer: "",
      order_id: 0,
      insert_time: "",
      sole_uuid: "",
      score: 0
    });
    setEditDialogOpen(true);
  };

  const openEditDialog = (row: QAItem) => {
    setIsEdit(true);
    setEditForm({ ...row });
    setEditDialogOpen(true);
  };

  const handleEditFieldChange = <K extends keyof QAItem>(field: K, value: QAItem[K]) => {
    setEditForm(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!editForm) return;

    try {
      if (isEdit) {
        await updateQA(editForm);
      } else {
        await insertQAData(editForm);
      }
      setEditDialogOpen(false);
      setEditForm(null);
      fetchData();
    } catch (error) {
      console.error("保存Q&A失败:", error);
    }
  };

  const handleDeleteClick = (item: QAItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await deleteQA({ id: itemToDelete.id });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error("删除Q&A失败:", error);
    }
  };

  /** ================= 下载相关 ================= */
  const handleDownload = async (item: QAItem) => {
    try {
      const requestData = {
        ids: [item.id],
        score: parseFloat(score) || 0
      };

      switch (downloadType) {
        case 'all':
          await downLoadJson({ ids: [item.id] });
          break;
        case 'byScore':
          await downLoadJsonByScore(requestData);
          break;
        case 'withContext':
          await downLoadJsonByContext(requestData);
          break;
      }
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  /** ================= 渲染 ================= */
  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 1 }}>
              <InputLabel id="dataset-select-label">选择数据集</InputLabel>
              <Select
                labelId="dataset-select-label"
                value={String(selectedDataset)}
                onChange={handleDatasetChange}
                label="选择数据集"
                sx={{ height: 40 }}
              >
                <MenuItem value={"-1"}>
                  <em>全部数据集</em>
                </MenuItem>
                {datasets.map((dataset) => (
                  <MenuItem key={dataset.value} value={String(dataset.value)}>
                    {dataset.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 1 }}>
              <InputLabel id="book-select-label">选择书籍</InputLabel>
              <Select
                labelId="book-select-label"
                value={String(selectedBook)}
                onChange={handleBookChange}
                label="选择书籍"
                sx={{ height: 40 }}
                disabled={selectedDataset <= 0}
              >
                <MenuItem value={"-1"}>
                  <em>{selectedDataset <= 0 ? '请先选择数据集' : '全部书籍'}</em>
                </MenuItem>
                {books.map((book) => (
                  <MenuItem key={book.value} value={String(book.value)}>
                    {book.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="问题/答案"
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入问题或答案"
              sx={{ width: 300 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Button variant="contained" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button 
              variant="contained" 
              onClick={openAddDialog}
              sx={{ ml: 'auto' }}
            >
              新增
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 表格区域 */}
      <Card>
        <CardHeader title="Q&A 管理" />
        <TableContainer component={Paper} sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>问题</TableCell>
                <TableCell>答案</TableCell>
                <TableCell>分数</TableCell>
                <TableCell>创建时间</TableCell>
                <TableCell>uuid</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {row.question}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {row.answer}
                    </TableCell>
                    <TableCell>{row.score}</TableCell>
                    <TableCell>{new Date(row.insert_time).toLocaleString()}</TableCell>
                    <TableCell>{row.sole_uuid}</TableCell>
                    <TableCell align="right" sx={{ '& button': { ml: 1 } }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => openEditDialog(row)}
                      >
                        编辑
                      </Button>
                      {/* <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => {
                          setDownloadType('all');
                          handleDownload(row);
                        }}
                      >
                        下载
                      </Button> */}
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleDeleteClick(row)}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={pagination.total}
                rowsPerPage={pagination.pageSize}
                page={pagination.page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                labelRowsPerPage="每页行数:"
                labelDisplayedRows={({ from, to, count }) => {
                  const totalPages = Math.ceil(count / pagination.pageSize);
                  return `第 ${pagination.page + 1} 页 / 共 ${totalPages} 页 （第 ${from} 到 ${to} 条，共 ${count} 条）`;
                }}
                sx={{ flexGrow: 1 }}
              />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>跳至</Typography>
              <TextField
                type="number"
                size="small"
                variant="outlined"
                value={pagination.page + 1}
                onChange={(e) => {
                  const page = parseInt(e.target.value) - 1;
                  if (page >= 0 && page < Math.ceil(pagination.total / pagination.pageSize)) {
                    setPagination(prev => ({ ...prev, page }));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    const page = parseInt(input.value) - 1;
                    if (page >= 0 && page < Math.ceil(pagination.total / pagination.pageSize)) {
                      setPagination(prev => ({ ...prev, page }));
                    } else {
                      // 如果输入的页码超出范围，重置为当前页
                      input.value = (pagination.page + 1).toString();
                    }
                  }
                }}
                inputProps={{
                  min: 1,
                  max: Math.ceil(pagination.total / pagination.pageSize),
                  style: { width: '60px', textAlign: 'center' }
                }}
              />
              <Typography>页</Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* 新增 / 编辑弹窗 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditForm(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEdit ? "编辑 Q&A" : "新增 Q&A"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editForm && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {isEdit && (
                <TextField
                  label="ID"
                  fullWidth
                  margin="normal"
                  value={editForm.id}
                  disabled
                />
              )}
              <TextField
                label="Chunk ID"
                fullWidth
                margin="normal"
                type="number"
                value={editForm.chunk_id}
                onChange={(e) => handleEditFieldChange('chunk_id', parseInt(e.target.value) || 0)}
              />
              <TextField
                label="问题"
                fullWidth
                multiline
                rows={3}
                margin="normal"
                value={editForm.question}
                onChange={(e) => handleEditFieldChange('question', e.target.value)}
              />
              <TextField
                label="答案"
                fullWidth
                multiline
                rows={6}
                margin="normal"
                value={editForm.answer}
                onChange={(e) => handleEditFieldChange('answer', e.target.value)}
              />
              <TextField
                label="排序ID"
                fullWidth
                margin="normal"
                type="number"
                value={editForm.order_id}
                onChange={(e) => handleEditFieldChange('order_id', parseInt(e.target.value) || 0)}
              />
              <TextField
                label="分数"
                fullWidth
                margin="normal"
                type="number"
                value={editForm.score}
                onChange={(e) => handleEditFieldChange('score', parseFloat(e.target.value) || 0)}
              />
              {isEdit && (
                <>
                  <TextField
                    label="UUID"
                    fullWidth
                    margin="normal"
                    value={editForm.sole_uuid}
                    disabled
                  />
                  <TextField
                    label="创建时间"
                    fullWidth
                    margin="normal"
                    value={new Date(editForm.insert_time).toLocaleString()}
                    disabled
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setEditForm(null);
            }}
          >
            取消
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!editForm}>
            确认
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          确定要删除这条Q&A记录吗？此操作不可恢复。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmDelete}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QApairsManagement;