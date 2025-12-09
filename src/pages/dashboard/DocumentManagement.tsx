import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
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
  Switch,
  Stack,
} from "@mui/material";
import { getBookList, getChunkList, updateBook, updateChunkList, putBookVectors } from "@/api/books";

interface BookItem {
  id: number;
  tittle: string;
  uuid: string;
  type_id: number;
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

const statusColorMap: Record<number, "default" | "success" | "error" | "warning" | "info"> = {
  4: "success",
  5: "error",
  6: "warning",
  9: "info",
  10: "default",
};

const DocumentManagement: React.FC = () => {
  const [queryParams, setQueryParams] = useState({
    keyword: "",
  });

  const [tableData, setTableData] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(false);

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
    page: 0,
    pageSize: 5,
    total: 0,
  });

  const [content, setContent] = useState("");

  const [pageInputMain, setPageInputMain] = useState("");
  const [pageInputContent, setPageInputContent] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: undefined,
    tittle: "",
    type_id: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: queryParams.keyword.trim(),
      };
      const res = await getBookList(payload);
      const apiData = (res.data as { data: BookListApiData }).data;
      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取书籍列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContentData = async (overridePage?: number, overridePageSize?: number) => {
    setLoading(true);
    try {
      const page = overridePage ?? contentPagination.page;
      const pageSize = overridePageSize ?? contentPagination.pageSize;
      const payload = {
        pagesize: pageSize,
        page_num: page * pageSize,
        keywords: detailForm.uuid,
      };
      const res = await getChunkList(payload);
      const apiData = (res.data as { data: ChunkListApiData }).data;
      const items = apiData.items ?? [];
      setContentData(items);
      setContentPagination((prev) => ({
        ...prev,
        page,
        pageSize,
        total: apiData.total ?? items.length,
      }));
      setDetailDialogOpen(true);
    } catch (error) {
      console.error("获取文档内容失败:", error);
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
    setQueryParams({ keyword: "" });
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

  const openDetail = (row: BookItem) => {
    setDetailForm({
      id: Number(row.id),
      tittle: row.tittle,
      uuid: row.uuid,
    });
    setContentPagination((prev) => ({ ...prev, page: 0 }));
    fetchContentData(0, contentPagination.pageSize);
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

  const handleContentPageChange = (_: unknown, newPage: number) => {
    fetchContentData(newPage, contentPagination.pageSize);
  };

  const handleContentRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    fetchContentData(0, newSize);
  };

  const handleContentPageJump = () => {
    const totalPages = Math.max(1, Math.ceil(contentPagination.total / contentPagination.pageSize));
    const target = Number(pageInputContent);
    if (!Number.isFinite(target) || target < 1) return;
    const clamped = Math.min(target, totalPages);
    fetchContentData(clamped - 1, contentPagination.pageSize);
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
      setDetailDialogOpen(false);
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
    setContentData([]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="书名"
              variant="outlined"
              size="small"
              value={queryParams.keyword}
              onChange={(e) => setQueryParams({ ...queryParams, keyword: e.target.value })}
              placeholder="请输入书名"
              sx={{ width: 300 }}
            />
            <Button variant="contained" onClick={handleSearch}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="文档管理" />
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>书名</TableCell>
                <TableCell>UUID</TableCell>
                <TableCell>状态</TableCell>
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
                tableData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.tittle}</TableCell>
                    <TableCell sx={{ maxWidth: 260, wordBreak: "break-all" }}>{row.uuid}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={statusLabelMap[row.type_id] ?? row.type_id}
                        color={statusColorMap[row.type_id] ?? "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => openDetail(row)}>
                          详情
                        </Button>
                        <Button size="small" onClick={() => openEditDialog(row)}>
                          修改
                        </Button>
                        <Button size="small" onClick={() => openEditDialog(row)}>
                          重新切割
                        </Button>
                        <Button size="small" onClick={() => sendBook(row)}>
                          准备向量
                        </Button>
                      </Stack>
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
              value={pageInputMain}
              onChange={(e) => setPageInputMain(e.target.value.replace(/[^0-9]/g, ""))}
              sx={{ width: 90 }}
            />
            <Button variant="outlined" size="small" onClick={handleMainPageJump}>
              跳转
            </Button>
          </Box>
        </Box>
      </Card>

      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>书籍详情</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="书籍ID"
              fullWidth
              margin="normal"
              value={detailForm.id}
              disabled
            />
            <TextField
              label="书名"
              fullWidth
              margin="normal"
              value={detailForm.tittle}
              disabled
            />
            <TextField
              label="UUID"
              fullWidth
              margin="normal"
              value={detailForm.uuid}
              disabled
            />
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            文档内容
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={80}>序号</TableCell>
                  <TableCell>内容</TableCell>
                  <TableCell width={140}>是否需要</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      暂无内容
                    </TableCell>
                  </TableRow>
                ) : (
                  contentData.map((row, index) => (
                    <TableRow key={row.order_id} hover>
                      <TableCell>{row.order_id}</TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          value={row.content}
                          onChange={(e) => handleChunkContentChange(index, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={row.type_id === 3}
                          onChange={(e) => handleChunkSwitchChange(index, e.target.checked)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
            <TablePagination
              rowsPerPageOptions={[5, 10, 20]}
              component="div"
              count={contentPagination.total}
              rowsPerPage={contentPagination.pageSize}
              page={contentPagination.page}
              onPageChange={handleContentPageChange}
              onRowsPerPageChange={handleContentRowsPerPageChange}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                size="small"
                label="跳转页"
                value={pageInputContent}
                onChange={(e) => setPageInputContent(e.target.value.replace(/[^0-9]/g, ""))}
                sx={{ width: 90 }}
              />
              <Button variant="outlined" size="small" onClick={handleContentPageJump}>
                跳转
              </Button>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              label="内容操作备注"
              size="small"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" size="small" onClick={handleClearLineBreaks}>
              清除换行符
            </Button>
            <Button variant="outlined" color="error" size="small" onClick={handleDeleteContent}>
              删除内容
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveDetail}>
            保存
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>修改书籍</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="书籍ID"
            fullWidth
            margin="normal"
            value={editForm.id}
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
              <MenuItem value={4}>解析成功</MenuItem>
              <MenuItem value={5}>解析失败</MenuItem>
              <MenuItem value={6}>内容较少</MenuItem>
              <MenuItem value={9}>已准备向量化</MenuItem>
              <MenuItem value={10}>重复书籍</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManagement;

