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
  IconButton,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Search, Refresh } from "@mui/icons-material";
import { getList, addData, delData } from "@/api/joinLink";

interface RelationItem {
  id: number;
  master_name: string;
  slave_name: string;
  order_id: number;
  sun_num: number;
}

const RelationManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<RelationItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState<Partial<RelationItem>>({
    master_name: "",
    slave_name: "",
    order_id: 0,
    sun_num: 0,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RelationItem | null>(null);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: keyword.trim(),
      };
      const res = await getList(payload);
      const items = Array.isArray(res.data) ? res.data : [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: items.length,
      }));
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, pagination.pageSize]);

  // 搜索和分页
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  const handleReset = () => {
    setKeyword("");
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination((prev) => ({
      ...prev,
      page: 0,
      pageSize: parseInt(event.target.value, 10),
    }));
  };

  // 弹窗操作
  const openAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      master_name: "",
      slave_name: "",
      order_id: 0,
      sun_num: 0,
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const openEditDialog = (row: RelationItem) => {
    setIsEdit(true);
    setEditForm({ ...row });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditFieldChange = (field: keyof RelationItem, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!editForm.master_name?.trim()) {
      errors.master_name = "请输入主名称";
    }
    if (!editForm.slave_name?.trim()) {
      errors.slave_name = "请输入从名称";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
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
  };

  const handleDeleteClick = (item: RelationItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await delData({ id: itemToDelete.id });
      setDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="关系管理"
          action={
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
              onClick={openAddDialog}
            >
              新增
            </Button>
          }
        />
        <CardContent>
          <Box display="flex" gap={2} mb={3}>
            <TextField
              size="small"
              placeholder="搜索主名称/从名称"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: <Search color="action" sx={{ mr: 1 }} />,
              }}
            />
            <Button variant="outlined" onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>
              <Refresh />
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>主名称</TableCell>
                  <TableCell>从名称</TableCell>
                  <TableCell>排序</TableCell>
                  <TableCell>数量</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.master_name}</TableCell>
                    <TableCell>{row.slave_name}</TableCell>
                    <TableCell>{row.order_id}</TableCell>
                    <TableCell>{row.sun_num}</TableCell>
                    <TableCell>
                      <Tooltip title="编辑">
                        <IconButton onClick={() => openEditDialog(row)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="删除">
                        <IconButton onClick={() => handleDeleteClick(row)}>
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </CardContent>
      </Card>

      {/* 编辑/新增弹窗 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>{isEdit ? "编辑关系" : "新增关系"}</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 400, pt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              size="small"
              label="主名称"
              value={editForm.master_name || ""}
              onChange={(e) => handleEditFieldChange("master_name", e.target.value)}
              error={!!formErrors.master_name}
              helperText={formErrors.master_name}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              label="从名称"
              value={editForm.slave_name || ""}
              onChange={(e) => handleEditFieldChange("slave_name", e.target.value)}
              error={!!formErrors.slave_name}
              helperText={formErrors.slave_name}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              type="number"
              label="排序"
              value={editForm.order_id || 0}
              onChange={(e) => handleEditFieldChange("order_id", parseInt(e.target.value) || 0)}
            />
            <TextField
              fullWidth
              margin="normal"
              size="small"
              type="number"
              label="数量"
              value={editForm.sun_num || 0}
              onChange={(e) => handleEditFieldChange("sun_num", parseInt(e.target.value) || 0)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这条记录吗？此操作不可逆。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RelationManagement;