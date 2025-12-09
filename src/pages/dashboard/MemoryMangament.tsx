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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { getMemoryList, delByIds, recover } from "@/api/memory";

interface MemoryItem {
  id: number | string;
  user_name: string;
  type_id: number; // 16 AI, 17 人类
  content: string;
  power: number; // 24 短期, 25 中期, 26 长期
  create_time: string;
  del_flag: number; // 2 正常, 其他为已删除
}

interface MemoryListApiData {
  total: number;
  items: MemoryItem[];
}

const MemoryMangament: React.FC = () => {
  const [loading, setLoading] = useState(false);

  // 查询参数（目前和 Vue 一样，后端暂时只用 keywords，可按需接到接口）
  const [queryParams, setQueryParams] = useState({
    user_name: "",
    type_name: "",
    power: "",
  });

  const [tableData, setTableData] = useState<MemoryItem[]>([]);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // 新增/编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    user_name: "",
    type_name: "human", // human / ai
    content: "",
    power: "short_term", // short_term / middle_term / long_term (示意)
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: "", // 与原 Vue 代码保持一致
      };
      const res = await getMemoryList(data);

      // 兼容 { data: { total, items } } 或 { total, items }
      const apiData =
        (res.data as { data?: MemoryListApiData }).data ??
        (res.data as MemoryListApiData);

      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取记忆列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索（目前只是刷新列表，和 Vue 行为一致）
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 0 }));
    fetchData();
  };

  // 重置搜索条件
  const handleReset = () => {
    setQueryParams({
      user_name: "",
      type_name: "",
      power: "",
    });
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

  // 打开编辑弹窗
  const openEditDialog = (row: MemoryItem) => {
    setIsEdit(true);
    setEditForm({
      id: String(row.id),
      user_name: row.user_name,
      type_name: row.type_id === 16 ? "ai" : "human",
      content: row.content,
      power:
        row.power === 26
          ? "long_term"
          : row.power === 25
          ? "middle_term"
          : "short_term",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  // 打开新增弹窗
  const openAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      id: "",
      user_name: "",
      type_name: "human",
      content: "",
      power: "short_term",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditFieldChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!editForm.user_name.trim()) {
      errors.user_name = "请输入用户名";
    }
    if (!editForm.type_name) {
      errors.type_name = "请选择类型";
    }
    if (!editForm.content.trim()) {
      errors.content = "请输入记忆内容";
    }
    if (!editForm.power) {
      errors.power = "请选择记忆类型";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 删除记忆
  const handleDelete = async (row: MemoryItem) => {
    try {
      const ids = [row.id];
      await delByIds(ids);
      console.log("删除成功");
      fetchData();
    } catch (error) {
      console.error("删除失败:", error);
    }
  };

  // 恢复记忆
  const handleRecover = async (row: MemoryItem) => {
    try {
      const ids = [row.id];
      await recover(ids);
      console.log("恢复成功");
      fetchData();
    } catch (error) {
      console.error("恢复失败:", error);
    }
  };

  // 确认保存（和 Vue 一样，暂时只本地提示，未接真实新增/更新接口）
  const handleConfirm = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isEdit) {
        // 这里可以接 updateMemory(editForm) 之类的接口
        console.log("更新成功: ", editForm);
      } else {
        // 这里可以接 addMemory(editForm) 之类的接口
        console.log("添加成功: ", editForm);
      }
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("操作失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTypeChip = (row: MemoryItem) => {
    const isAI = row.type_id === 16;
    return (
      <Chip
        size="small"
        label={isAI ? "AI" : "人类"}
        color={isAI ? "success" : "primary"}
        variant="outlined"
      />
    );
  };

  const renderPowerChip = (row: MemoryItem) => {
    if (row.power === 26) {
      return <Chip size="small" label="长期" color="success" variant="outlined" />;
    }
    if (row.power === 25) {
      return <Chip size="small" label="中期" color="warning" variant="outlined" />;
    }
    return <Chip size="small" label="短期" color="info" variant="outlined" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              label="用户名"
              variant="outlined"
              size="small"
              value={queryParams.user_name}
              onChange={(e) =>
                setQueryParams((prev) => ({ ...prev, user_name: e.target.value }))
              }
              placeholder="请输入用户名"
              sx={{ width: 220 }}
            />
            <FormControl size="small" sx={{ width: 160 }}>
              <InputLabel id="type-select-label">类型</InputLabel>
              <Select
                labelId="type-select-label"
                label="类型"
                value={queryParams.type_name}
                onChange={(e) =>
                  setQueryParams((prev) => ({ ...prev, type_name: e.target.value }))
                }
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="16">AI</MenuItem>
                <MenuItem value="17">人类</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: 180 }}>
              <InputLabel id="power-select-label">记忆类型</InputLabel>
              <Select
                labelId="power-select-label"
                label="记忆类型"
                value={queryParams.power}
                onChange={(e) =>
                  setQueryParams((prev) => ({ ...prev, power: e.target.value }))
                }
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value="24">短期记忆</MenuItem>
                <MenuItem value="25">中期记忆</MenuItem>
                <MenuItem value="26">长期记忆</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="contained" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 表格区域 */}
      <Card>
        <CardHeader
          title="记忆管理"
          action={
            <Button variant="contained" onClick={openAddDialog}>
              新增记忆
            </Button>
          }
        />
        <TableContainer component={Paper} sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>用户名</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>内容</TableCell>
                <TableCell>记忆类型</TableCell>
                <TableCell>创建时间</TableCell>
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
                    <TableCell sx={{ width: 140 }}>{row.user_name}</TableCell>
                    <TableCell sx={{ width: 120 }}>{renderTypeChip(row)}</TableCell>
                    <TableCell>{row.content}</TableCell>
                    <TableCell sx={{ width: 120 }}>{renderPowerChip(row)}</TableCell>
                    <TableCell sx={{ width: 180 }}>{row.create_time}</TableCell>
                    <TableCell align="right" sx={{ width: 180 }}>
                      {row.del_flag === 2 ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(row)}
                        >
                          删除
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleRecover(row)}
                        >
                          恢复
                        </Button>
                      )}
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
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEdit ? "编辑记忆" : "新增记忆"}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="用户名"
            fullWidth
            margin="normal"
            value={editForm.user_name}
            onChange={(e) => handleEditFieldChange("user_name", e.target.value)}
            error={Boolean(formErrors.user_name)}
            helperText={formErrors.user_name}
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel id="edit-type-label">类型</InputLabel>
            <Select
              labelId="edit-type-label"
              label="类型"
              value={editForm.type_name}
              onChange={(e) => handleEditFieldChange("type_name", e.target.value)}
            >
              <MenuItem value="ai">AI</MenuItem>
              <MenuItem value="human">人类</MenuItem>
            </Select>
          </FormControl>
          {formErrors.type_name && (
            <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
              {formErrors.type_name}
            </Box>
          )}
          <TextField
            label="内容"
            fullWidth
            margin="normal"
            multiline
            minRows={3}
            value={editForm.content}
            onChange={(e) => handleEditFieldChange("content", e.target.value)}
            error={Boolean(formErrors.content)}
            helperText={formErrors.content}
          />
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel id="edit-power-label">记忆类型</InputLabel>
            <Select
              labelId="edit-power-label"
              label="记忆类型"
              value={editForm.power}
              onChange={(e) => handleEditFieldChange("power", e.target.value)}
            >
              <MenuItem value="short_term">短期记忆</MenuItem>
              <MenuItem value="middle_term">中期记忆</MenuItem>
              <MenuItem value="long_term">长期记忆</MenuItem>
            </Select>
          </FormControl>
          {formErrors.power && (
            <Box sx={{ color: "error.main", fontSize: 12, mt: 0.5 }}>
              {formErrors.power}
            </Box>
          )}
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

export default MemoryMangament;