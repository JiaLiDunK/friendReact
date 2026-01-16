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
  Paper,
  Stack,
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
import { Add } from "@mui/icons-material";

import { addData, delData, getList, createLoraData,scoringLoraData } from "@/api/joinLink";

/** ================= 类型定义 ================= */

interface JoinLinkItem {
  id: number;
  master_id: number;
  slave_id: number;
  order_id: number;
  sun_num: number;
  scoring_completed: number; // 0: 未打分, 1: 正在打分, 2: 打分完毕
  tittle:string;
  description:string;
}

/** ================= 页面组件 ================= */

const JoinLinkManagement: React.FC = () => {
  // ================= 状态管理 =================
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<JoinLinkItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // 编辑对话框相关状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<JoinLinkItem>>({
    master_id: 0,
    slave_id: 0,
    order_id: 0,
    sun_num: 0,
    scoring_completed: 0, // 默认未打分
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<JoinLinkItem | null>(null);

  // ================= 数据获取 =================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { page, pageSize } = pagination;
      const params = {
        pagesize: pageSize,
        page_num: page * pageSize,
        keywords: undefined,
        key_num: Number(keyword.trim()),
      };
      console.log(params)
      const response = await getList(params);
      const responseData = response.data?.data || {};
      const items = Array.isArray(responseData.items) ? responseData.items : [];
      const total = typeof responseData.total === 'number' ? responseData.total : items.length;
      
      setTableData(items);
      setPagination(prev => ({
        ...prev,
        total,
      }));
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, keyword]);

  // 初始化加载数据
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= 事件处理 =================
  const handleSearch = useCallback(() => {
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchData();
  }, [fetchData]);

  const handleReset = useCallback(() => {
    setKeyword("");
    setPagination(prev => ({ ...prev, page: 0 }));
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      page: 0,
      pageSize: parseInt(event.target.value, 10),
    }));
  }, []);

  // 弹窗操作
  const openAddDialog = useCallback(() => {
    setIsEdit(false);
    setEditForm({
      master_id: 0,
      slave_id: 0,
      order_id: 0,
      sun_num: 0,
      scoring_completed: 0, // 新增时默认未打分
    });
    setFormErrors({});
    setEditDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((row: JoinLinkItem) => {
    setIsEdit(true);
    setEditForm({ ...row });
    setFormErrors({});
    setEditDialogOpen(true);
  }, []);

  const handleEditFieldChange = useCallback((field: keyof JoinLinkItem, value: string | number) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) || 0 : value;
    setEditForm(prev => ({ ...prev, [field]: numValue }));
    setFormErrors(prev => ({ ...prev, [field]: "" }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: { [key: string]: string } = {};
    if (!editForm.master_id) {
      errors.master_id = "请输入主ID";
    }
    if (!editForm.slave_id) {
      errors.slave_id = "请输入从ID";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [editForm.master_id, editForm.slave_id]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    try {
      if (isEdit && editForm.id) {
        await addData(editForm);
      } else {
        await addData(editForm);
      }
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("保存失败:", error);
    }
  }, [editForm, fetchData, isEdit, validateForm]);

  const handleDeleteClick = useCallback((item: JoinLinkItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;
    try {
      await delData({ id: itemToDelete.id });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("删除失败:", error);
    }
  }, [fetchData, itemToDelete]);

  const handleCreateLora = useCallback(async (item: JoinLinkItem) => {
    try {
      await createLoraData({ 
          id: item.id,
          master_id:item.master_id,
          slave_id:item.slave_id,
          order_id:item.order_id,
          sun_num:item.sun_num,

       });
      console.log('生成成功');
      // 刷新数据
      // fetchData();
    } catch (error) {
      console.error('生成失败:', error);
    }
  }, [fetchData]);

  const handleScoringLora = useCallback(async (item: JoinLinkItem) => {
    try {
      await scoringLoraData({
          master_id: item.master_id,
          slave_id: item.slave_id,
          order_id: item.order_id,
          sun_num: item.sun_num,
       });
      console.log('开始打分');
      // 刷新数据
      fetchData();
    } catch (error) {
      console.error('打分失败:', error);
    }
  }, [fetchData]);

  // ================= 渲染 =================
  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="主ID"
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="请输入主ID"
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
              color="primary"
              startIcon={<Add />}
              onClick={openAddDialog}
              sx={{ ml: "auto" }}
            >
              新增
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="关联关系管理" />
        <TableContainer component={Paper} sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>主ID</TableCell>
                <TableCell>数据集名称</TableCell>
                <TableCell>从ID</TableCell>
                <TableCell>书籍名称</TableCell>
                <TableCell>排序</TableCell>
                <TableCell>数量</TableCell>
                <TableCell>打分状态</TableCell>
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
              ) : tableData.length > 0 ? (
                tableData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.master_id}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.slave_id}</TableCell>
                    <TableCell>{row.tittle}</TableCell>
                    <TableCell>{row.order_id}</TableCell>
                    <TableCell>{row.sun_num}</TableCell>
                    <TableCell>{row.scoring_completed}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => openEditDialog(row)}>
                          编辑
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteClick(row)}>
                          删除
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handleCreateLora(row)}>
                          生成
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handleScoringLora(row)}>
                          打分
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.total > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2 }}>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={pagination.total}
              rowsPerPage={pagination.pageSize}
              page={pagination.page}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              labelRowsPerPage="每页行数:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count !== -1 ? count : `超过 ${to}`}`}
            />
          </Box>
        )}
      </Card>

      {/* 编辑/新增弹窗 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEdit ? "编辑关联关系" : "新增关联关系"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              size="small"
              type="number"
              label="主ID"
              value={editForm.master_id || ''}
              onChange={(e) => handleEditFieldChange("master_id", e.target.value)}
              error={!!formErrors.master_id}
              helperText={formErrors.master_id}
              inputProps={{ min: 1 }}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              type="number"
              label="从ID"
              value={editForm.slave_id || ''}
              onChange={(e) => handleEditFieldChange("slave_id", e.target.value)}
              error={!!formErrors.slave_id}
              helperText={formErrors.slave_id}
              inputProps={{ min: 1 }}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              type="number"
              label="排序"
              value={editForm.order_id || ''}
              onChange={(e) => handleEditFieldChange("order_id", e.target.value)}
              inputProps={{ min: 0 }}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              type="number"
              label="数量"
              value={editForm.sun_num || ''}
              onChange={(e) => handleEditFieldChange("sun_num", e.target.value)}
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这条记录吗？此操作不可逆。
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            {loading ? '删除中...' : '删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JoinLinkManagement;