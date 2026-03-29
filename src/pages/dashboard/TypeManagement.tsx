import React, { useState, useEffect } from 'react';
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
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { typeApi } from '@/api/type';

interface TypeItem {
  id: number;
  type_name: string;
}

interface RawTypeItem {
  id?: number;
  typeId?: number;
  type_name?: string;
  name?: string;
}

interface TypeListApiData {
  total: number;
  items: RawTypeItem[];
}

const TypeManagement: React.FC = () => {
  // 查询参数
  const [queryParams, setQueryParams] = useState({
    keyword: '',
  });
  // 表格数据
  const [tableData, setTableData] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(false);
  // 分页（组件内部仍然使用 page / pageSize，只有请求时映射为 pagesize / page_num）
  const [pagination, setPagination] = useState({
    page: 0, 
    pageSize: 10,
    total: 0,
  });
  const [pageInput, setPageInput] = useState('');

  // 编辑表单
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    id: undefined,
    type_name: '',
  });

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      // 这里应该是API调用
      const res = await typeApi.list<{ data: TypeListApiData }>({
        // 后端需要的字段：pagesize / page_num / keywords
        page_num: pagination.page * pagination.pageSize,
        pagesize: pagination.pageSize,
        keywords: queryParams.keyword,
      });
      // 后端返回固定结构
      const apiData = res.data.data;
      const list: RawTypeItem[] = apiData.items ?? [];
      const total: number = apiData.total ?? list.length;
      const normalized: TypeItem[] = list.map((item) => ({
        id: Number(item.id ?? item.typeId ?? ''),
        type_name: String(item.type_name ?? item.name ?? ''),
      }));
      setTableData(normalized);
      setPagination(prev => ({
        ...prev,
        total,
      }));
    } catch (error) {
      console.error('获取类型列表失败:', error);
    } finally {
      setLoading(false);
    }
  };
  // 初始化加载数据
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 0 })); // 重置到第一页
  };

  // 重置
  const handleReset = () => {
    setQueryParams({ keyword: '' });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // 分页变化
  const handlePageChange = (event: unknown, newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 每页条数变化
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination(prev => ({
      ...prev,
      page: 0, // 重置到第一页
      pageSize: parseInt(event.target.value, 10),
    }));
  };

  const handlePageJump = () => {
    const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
    const target = Number(pageInput);
    if (!Number.isFinite(target) || target < 1) return;
    const clamped = Math.min(target, totalPages);
    setPagination(prev => ({ ...prev, page: clamped - 1 }));
  };

  // 打开新增弹窗
  const handleOpenAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      id: undefined,
      type_name: '',
    });
    setEditDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleOpenEditDialog = (row: TypeItem) => {
    setIsEdit(true);
    setEditForm({
      id: row.id,
      type_name: row.type_name,
    });
    setEditDialogOpen(true);
  };

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 确认保存
  const handleConfirm = async () => {
    if (!editForm.type_name.trim()) {
      alert('请输入类型名称');
      return;
    }

    // 这里应该是API调用
    try {
      if (isEdit) {
        // 更新
        await typeApi.update({
          id: editForm.id,
          type_name: editForm.type_name,
        });
      } else {
        // 新增
        await typeApi.add({
          type_name: editForm.type_name,
        });
      }

      setEditDialogOpen(false);
      fetchData(); // 重新加载数据
    } catch (error) {
      console.error('保存类型失败:', error);
    }
  };
  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="类型名称"
              variant="outlined"
              size="small"
              value={queryParams.keyword}
              onChange={(e) => setQueryParams({ ...queryParams, keyword: e.target.value })}
              placeholder="请输入类型名称"
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
          title="类型管理"
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
                <TableCell>名称</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.type_name}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenEditDialog(row)}
                      >修改
                        <EditIcon fontSize="small" />
                      </IconButton>

                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={pagination.total}
            rowsPerPage={pagination.pageSize}
            page={pagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              label="跳转页"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
              sx={{ width: 90 }}
            />
            <Button variant="outlined" size="small" onClick={handlePageJump}>
              跳转
            </Button>
          </Box>
        </Box>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>{isEdit ? '编辑类型' : '新增类型'}</DialogTitle>
        <DialogContent sx={{ minWidth: 400, pt: 2 }}>
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
            label="名称"
            fullWidth
            margin="normal"
            name="type_name"
            value={editForm.type_name}
            onChange={handleInputChange}
            placeholder="请输入名称"
            required
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

export default TypeManagement;