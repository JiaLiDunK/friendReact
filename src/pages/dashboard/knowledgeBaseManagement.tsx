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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { getList, addData, updateData } from "@/api/database";

interface KnowledgeBaseItem {
  id: number | string;
  data_base: string;
  collection: string;
  data_base_remark: string;
  collection_remark: string;
  type_id: number | string;
}

interface KnowledgeBaseListApiData {
  total: number;
  items: KnowledgeBaseItem[];
}

const KnowledgeBaseManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<KnowledgeBaseItem[]>([]);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState<KnowledgeBaseItem | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: keyword.trim(),
      };
      const res = await getList(payload);

      // 兼容两种返回结构：{ data: { total, items } } 或 { total, items }
      const apiData =
        (res.data as { data?: KnowledgeBaseListApiData }).data ??
        (res.data as KnowledgeBaseListApiData);

      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取数据库列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

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

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newSize = parseInt(event.target.value, 10);
    setPagination((prev) => ({ ...prev, page: 0, pageSize: newSize }));
  };

  const openEditDialog = (row: KnowledgeBaseItem) => {
    setIsEdit(true);
    setEditForm({ ...row });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const openAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      id: "",
      data_base: "",
      collection: "",
      data_base_remark: "",
      collection_remark: "",
      type_id: "",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditFieldChange = (
    field: keyof KnowledgeBaseItem,
    value: string | number,
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    if (!editForm) return false;
    const errors: { [key: string]: string } = {};
    if (!editForm.data_base?.toString().trim()) {
      errors.data_base = "请输入数据库名称";
    }
    if (!editForm.collection?.toString().trim()) {
      errors.collection = "请输入集合名称";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editForm) return;
    if (!validateForm()) return;

    try {
      if (isEdit) {
        await updateData(editForm);
      } else {
        await addData(editForm);
      }
      setEditDialogOpen(false);
      setEditForm(null);
      fetchData();
    } catch (error) {
      console.error("保存数据库信息失败:", error);
    }
  };

  const renderTypeLabel = (type_id: number | string) => {
    const value = Number(type_id);
    if (value === 7) return "生活/个人知识库";
    if (value === 8) return "企业知识库";
    return value || "-";
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="数据库名称"
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入数据库名称"
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

      {/* 表格区域 */}
      <Card>
        <CardHeader
          title="知识库管理"
          action={
            <Button variant="contained" onClick={openAddDialog}>
              新增
            </Button>
          }
        />
        <TableContainer component={Paper} sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>数据库名称</TableCell>
                <TableCell>集合名称</TableCell>
                <TableCell>数据库备注</TableCell>
                <TableCell>集合备注</TableCell>
                <TableCell>数据库类型</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ width: 80 }}>{row.id}</TableCell>
                    <TableCell>{row.data_base}</TableCell>
                    <TableCell>{row.collection}</TableCell>
                    <TableCell>{row.data_base_remark}</TableCell>
                    <TableCell>{row.collection_remark}</TableCell>
                    <TableCell>{renderTypeLabel(row.type_id)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEditDialog(row)}>
                        编辑
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

      {/* 新增/编辑弹窗 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditForm(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEdit ? "编辑数据库" : "新增数据库"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editForm && (
            <>
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
                label="数据库名称"
                fullWidth
                margin="normal"
                value={editForm.data_base}
                onChange={(e) =>
                  handleEditFieldChange("data_base", e.target.value)
                }
                error={Boolean(formErrors.data_base)}
                helperText={formErrors.data_base}
              />
              <TextField
                label="集合名称"
                fullWidth
                margin="normal"
                value={editForm.collection}
                onChange={(e) =>
                  handleEditFieldChange("collection", e.target.value)
                }
                error={Boolean(formErrors.collection)}
                helperText={formErrors.collection}
              />
              <TextField
                label="数据库备注"
                fullWidth
                margin="normal"
                value={editForm.data_base_remark}
                onChange={(e) =>
                  handleEditFieldChange("data_base_remark", e.target.value)
                }
              />
              <TextField
                label="集合备注"
                fullWidth
                margin="normal"
                value={editForm.collection_remark}
                onChange={(e) =>
                  handleEditFieldChange("collection_remark", e.target.value)
                }
              />
              <FormControl fullWidth margin="normal">
                <InputLabel id="db-type-label">数据库类型</InputLabel>
                <Select
                  labelId="db-type-label"
                  value={editForm.type_id?.toString() ?? ""}
                  label="数据库类型"
                  onChange={(e) =>
                    handleEditFieldChange("type_id", Number(e.target.value))
                  }
                >
                  <MenuItem value={7}>生活/个人知识库</MenuItem>
                  <MenuItem value={8}>企业知识库</MenuItem>
                </Select>
              </FormControl>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                数据库类型用于区分不同场景下的知识库，可在后端进行差异化处理。
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
          <Button variant="contained" onClick={handleSave} disabled={!editForm}>
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KnowledgeBaseManagement;