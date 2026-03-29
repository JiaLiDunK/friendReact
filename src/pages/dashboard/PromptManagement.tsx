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
} from "@mui/material";
import { Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import { getList, addData, updateData } from "@/api/prompt";

interface PromptItem {
  id: number;
  system_message: string;
  description: string;
  type_id: number;
}

interface RawPromptItem {
  id?: number;
  system_message?: string;
  description?: string;
  type_id?: number;
}

interface PromptListApiData {
  total: number;
  items: RawPromptItem[];
}

const PromptManagement: React.FC = () => {
  // 查询参数
  const [queryParams, setQueryParams] = useState({
    keyword: "",
  });

  // 表格数据
  const [tableData, setTableData] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 分页（内部用 0 开始；发请求时映射为 page_num / pagesize）
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [pageInput, setPageInput] = useState("");

  // 新增 / 编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState<{
    id?: number;
    system_message: string;
    description: string;
    type_id: number;
  }>({
    id: undefined,
    system_message: "",
    description: "",
    type_id: 2,
  });

  const typeIdOptions: Array<{ value: number; label: string }> = [
    { value: 2, label: "可用" },
    { value: 3, label: "不可用" },
    { value: 31, label: "用于生成移除拒绝回答层" },
  ];

  const getTypeIdLabel = (value: number) => {
    return typeIdOptions.find((x) => x.value === value)?.label ?? String(value);
  };

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      // 和 Vue 版保持一致：page_num = offset，pagesize = 每页条数
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: queryParams.keyword.trim(),
      };

      const res = await getList(payload);
      // 后端约定：res.data.data = { total, items }
      const apiData = (res.data as { data: PromptListApiData }).data;

      const rawItems = apiData.items ?? [];
      const items: PromptItem[] = rawItems.map((item) => ({
        id: Number(item.id ?? ""),
        system_message: String(item.system_message ?? ""),
        description: String(item.description ?? ""),
        type_id: Number( item.type_id ?? 2),
      }));
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取提示词列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化 + 分页变化时重新加载
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 查询
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  // 重置
  const handleReset = () => {
    setQueryParams({ keyword: "" });
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  // 分页变化（页码）
  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  // 分页变化（每页条数）
  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPagination((prev) => ({
      ...prev,
      page: 0,
      pageSize: parseInt(event.target.value, 10),
    }));
  };

  const handlePageJump = () => {
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
    const target = Number(pageInput);
    if (!Number.isFinite(target) || target < 1) return;
    const clamped = Math.min(target, totalPages);
    setPagination((prev) => ({ ...prev, page: clamped - 1 }));
  };

  // 打开新增弹窗
  const handleOpenAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      id: undefined,
      system_message: "",
      description: "",
      type_id: 2,
    });
    setEditDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleOpenEditDialog = (row: PromptItem) => {
    setIsEdit(true);
    setEditForm({
      id: row.id,
      system_message: row.system_message,
      description: row.description,
      type_id: row.type_id,
    });
    setEditDialogOpen(true);
  };

  // 编辑表单输入
  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTypeIdChange = (e: SelectChangeEvent) => {
    const value = Number(e.target.value);
    setEditForm((prev) => ({
      ...prev,
      type_id: value,
    }));
  };

  // 确认保存
  const handleConfirm = async () => {
    if (!editForm.system_message.trim() || !editForm.description.trim()) {
      alert("请输入系统消息和描述");
      return;
    }

    try {
      const submitPayload = {
        ...editForm,
        type_id: editForm.type_id,
      };
      if (isEdit && editForm.id !== undefined) {
        await updateData(submitPayload);
      } else {
        await addData(submitPayload);
      }
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("保存提示词失败:", error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="描述"
              variant="outlined"
              size="small"
              value={queryParams.keyword}
              onChange={(e) =>
                setQueryParams({ ...queryParams, keyword: e.target.value })
              }
              placeholder="请输入描述"
              sx={{ width: 300 }}
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
          title="角色提示词管理"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              新增
            </Button>
          }
        />
        <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>系统消息</TableCell>
                <TableCell>描述</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                tableData
                  .slice(
                    pagination.page * pagination.pageSize,
                    (pagination.page + 1) * pagination.pageSize
                  )
                  .map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{getTypeIdLabel(row.type_id)}</TableCell>
                      <TableCell sx={{ maxWidth: 400 }}>
                        {row.system_message}
                      </TableCell>
                      <TableCell>{row.description}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<EditIcon fontSize="small" />}
                          onClick={() => handleOpenEditDialog(row)}
                        >
                          编辑
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              size="small"
              label="跳转页"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
              sx={{ width: 90 }}
            />
            <Button variant="outlined" size="small" onClick={handlePageJump}>
              跳转
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{isEdit ? "编辑记录" : "新增记录"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {isEdit && (
            <TextField
              label="ID"
              fullWidth
              margin="normal"
              value={editForm.id}
              disabled
            />
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel id="prompt-typeid-label">类型</InputLabel>
            <Select
              labelId="prompt-typeid-label"
              label="类型"
              value={String(editForm.type_id)}
              onChange={handleTypeIdChange}
            >
              {typeIdOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="系统消息"
            name="system_message"
            fullWidth
            multiline
            minRows={4}
            margin="normal"
            value={editForm.system_message}
            onChange={handleEditInputChange}
            placeholder="请输入系统消息"
          />
          <TextField
            label="描述"
            name="description"
            fullWidth
            margin="normal"
            value={editForm.description}
            onChange={handleEditInputChange}
            placeholder="请输入描述"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleConfirm}>
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromptManagement;