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

/** ================= 类型定义 ================= */
interface QAItem {
  id: number;
  chunk_id: number;
  question: string;
  answer: string;
  order_id: number;
  insert_time: string;
  sole_uuid: string;
  score: number;
}

interface QAListApiData {
  total: number;
  items: QAItem[];
}

/** ================= 页面组件 ================= */
const QApairsManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [downloadType, setDownloadType] = useState<'all' | 'byScore' | 'withContext'>('all');
  const [score, setScore] = useState<string>('0');
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<QAItem[]>([]);

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
  const fetchData = async () => {
    setLoading(true);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page + 1, // 后端从1开始，前端从0开始
        keywords: keyword.trim(),
      };
      const res = await getQAList(payload);

      const apiData = res.data as QAListApiData;
      setTableData(apiData.items || []);
      setPagination(prev => ({
        ...prev,
        total: apiData.total || 0,
      }));
    } catch (error) {
      console.error("获取Q&A列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.pageSize]);

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
    setPagination(prev => ({ ...prev, page: newPage }));
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
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.question}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.answer}
                    </TableCell>
                    <TableCell>{row.score}</TableCell>
                    <TableCell>{new Date(row.insert_time).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ '& button': { ml: 1 } }}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => openEditDialog(row)}
                      >
                        编辑
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        onClick={() => {
                          setDownloadType('all');
                          handleDownload(row);
                        }}
                      >
                        下载
                      </Button>
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