import React, { useEffect, useState } from "react";
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
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { getBookVectorsList, delBooksVectors, updateBooksVectors } from "@/api/books";
import { getTypeOptions } from "@/api/database";
import { log } from "console";

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

const BookVectorsManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 查询参数
  const [keyword, setKeyword] = useState("");

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
    setLoading(true);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: keyword.trim(),
      };
      const res = await getBookVectorsList(payload);
      const apiData = (res.data as { data?: BookVectorListApiData }).data ?? (res.data as BookVectorListApiData);
      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchKnowledgeBaseOptions = async () => {
    try {
      const res = await getTypeOptions();
      const list = (res.data.data || []).map((item: KnowledgeBaseOption) => ({
        label: item.label,
        value: item.value,
      }));
      setKnowledgeBaseOptions(list);
    } catch (error) {
      console.error("获取知识库列表失败:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchKnowledgeBaseOptions();
  }, []);

  // 关键字搜索
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  // 重置
  const handleReset = () => {
    setKeyword("");
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
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
    if (type_id === 8) return "书籍选择存放的知识库";
    if (type_id === 9) return "已准备向量化";
    if (type_id === 11) return "已向量化";
    return "未知状态";
  };

  // 知识库格式化
  const formatKnowledgeBase = (knowledge_base_id: string) => {
    const item = knowledgeBaseOptions.find((opt) => opt.value === knowledge_base_id);
    return item ? item.label : knowledge_base_id || "-";
  };

  // 打开编辑弹窗
  const openEditDialog = (row: BookVector) => {
    setEditForm({ ...row });
    setEditDialogOpen(true);
  };

  const handleEditKnowledgeBaseChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    setEditForm((prev) => (prev ? { ...prev, knowledge_base_id: value } : prev));
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;
    try {
      await updateBooksVectors(editForm);
      setEditDialogOpen(false);
      setEditForm(null);
      fetchData();
    } catch (error) {
      console.error("保存失败:", error);
    }
  };

  const handleDelete = async (row: BookVector) => {
    const confirmed = window.confirm(`确认删除该记录？\n书名：${row.tittle}`);
    if (!confirmed) return;
    try {
      await delBooksVectors(row);
      fetchData();
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="书名关键词"
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入书名关键词"
              sx={{ width: 300 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <Button variant="contained" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="书籍向量管理" />
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>书名</TableCell>
                <TableCell>UUID</TableCell>
                <TableCell>进度</TableCell>
                <TableCell>知识库选择</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.tittle}</TableCell>
                    <TableCell sx={{ maxWidth: 260, wordBreak: "break-all" }}>{row.uuid}</TableCell>
                    <TableCell>{renderProgress(row.type_id)}</TableCell>
                    <TableCell>{formatKnowledgeBase(row.knowledge_base_id)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEditDialog(row)} sx={{ mr: 1 }}>
                        编辑
                      </Button>
                      <Button size="small" color="error" onClick={() => handleDelete(row)}>
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 20, 50]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Box>
      </Card>

      {/* 编辑弹窗 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditForm(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑记录</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editForm && (
            <>
              <TextField
                label="ID"
                fullWidth
                margin="normal"
                value={editForm.id}
                disabled
              />
              <TextField
                label="书名"
                fullWidth
                margin="normal"
                value={editForm.tittle}
                disabled
              />
              <TextField
                label="UUID"
                fullWidth
                margin="normal"
                value={editForm.uuid}
                disabled
              />
              <TextField
                label="类型ID"
                fullWidth
                margin="normal"
                value={editForm.type_id}
                disabled
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="kb-select-label">知识库</InputLabel>
                <Select
                  labelId="kb-select-label"
                  value={editForm.knowledge_base_id ?? ""}
                  label="知识库"
                  onChange={handleEditKnowledgeBaseChange}
                >
                  {knowledgeBaseOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                修改知识库后，将更新该书籍向量所属的知识库。
              </Typography>
            </>
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
          <Button variant="contained" onClick={handleSaveEdit} disabled={!editForm}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookVectorsManagement;