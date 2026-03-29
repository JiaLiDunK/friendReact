import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import { getList, addData, updateData, delData,scoringData,extractData,clearChunk } from "@/api/dataset";
import { downLoadJson, downLoadJsonByScore, downLoadJsonByContext, vectorAllQA } from "@/api/QApairs"
/** ================= 类型定义 ================= */

interface DatasetItem {
  id: number | string;
  description: string;
  sole_uuid: string;
  create_time: string;
}

interface DatasetListApiData {
  total: number;
  items: DatasetItem[];
}

/** ================= 页面组件 ================= */

const DatasetManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [downloadType, setDownloadType] = useState<'all' | 'byScore' | 'withContext'>('all');
  const [score, setScore] = useState<string>('90');
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);

  const buildDownloadFilename = () => {
    const d = new Date();
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    const ss = pad2(d.getSeconds());
    return `${y}-${m}-${day}_${hh}-${mm}-${ss}.json`;
  };

  const downloadTextAsJsonFile = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadBlobFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toIntScore = (raw: string) => {
    const num = Number(raw);
    if (!Number.isFinite(num)) {
      throw new Error('分数必须是数字');
    }
    return Math.trunc(num);
  };

  const toIdList = (ids: (number | string)[]): number[] => {
    const idList = ids.map((id) => {
      const n = typeof id === 'number' ? id : Number(id);
      if (!Number.isFinite(n)) {
        throw new Error(`非法ID: ${String(id)}`);
      }
      return Math.trunc(n);
    });
    return idList;
  };

  const normalizeJsonText = (raw: string): string => {
    const trimmed = raw.trim();
    try {
      const first = JSON.parse(trimmed);
      if (typeof first === 'string') {
        const second = JSON.parse(first);
        return JSON.stringify(second, null, 2);
      }
      return JSON.stringify(first, null, 2);
    } catch {
      return trimmed
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t');
    }
  };

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

  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<DatasetItem[]>([]);

  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editForm, setEditForm] = useState<DatasetItem | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<DatasetItem | null>(null);

  /** ================= 数据获取 ================= */

  const fetchData = async () => {
    setLoading(true);
    try {
      const payload = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: keyword.trim(),
      };
      const res = await getList(payload);

      // 兼容 { data: { total, items } } / { total, items }
      const apiData =
        (res.data as { data?: DatasetListApiData }).data ??
        (res.data as DatasetListApiData);

      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取 Dataset 列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  /** ================= 搜索 & 分页 ================= */

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

  /** ================= 弹窗 ================= */

  const openAddDialog = () => {
    setIsEdit(false);
    setEditForm({
      id: "",
      description: "",
      sole_uuid: "",
      create_time: "",
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const openEditDialog = (row: DatasetItem) => {
    setIsEdit(true);
    setEditForm({ ...row });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditFieldChange = (
    field: keyof DatasetItem,
    value: string,
  ) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    if (!editForm) return false;
    const errors: { [key: string]: string } = {};
    if (!editForm.description?.trim()) {
      errors.description = "请输入 Dataset 描述";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editForm) return;
    if (!validateForm()) return;

    try {
      if (isEdit) {
        await updateData({
          id: editForm.id,
          description: editForm.description,
        });
      } else {
        await addData({
          description: editForm.description,
        });
      }
      setEditDialogOpen(false);
      setEditForm(null);
      fetchData();
    } catch (error) {
      console.error("保存 Dataset 失败:", error);
    }
  };

  const handleDeleteClick = (item: DatasetItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      await delData({ id: itemToDelete.id });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error("删除 Dataset 失败:", error);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // 处理勾选
  const handleSelect = (id: number | string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(event.target.checked ? tableData.map(item => item.id) : []);
  };

  // 处理下载
  const handleDownload = () => {
    if (selectedIds.length === 0) {
      alert('请至少选择一条记录');
      return;
    }
    setDownloadDialogOpen(true);
  };

  const handleConfirmDownload = async () => {
    if ((downloadType === 'byScore' || downloadType === 'withContext') && !score) {
      alert('请输入分数');
      return;
    }

    try {
      const filename = buildDownloadFilename();
      const id_list = toIdList(selectedIds);

      switch (downloadType) {
        case 'all':
          {
            const res = await downLoadJson(id_list);
            const blob = (res as unknown as { data?: unknown })?.data;
            if (blob instanceof Blob) {
              const raw = await blob.text();
              downloadTextAsJsonFile(normalizeJsonText(raw), filename);
            } else {
              const payload = extractResponsePayload(res);
              const jsonText = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}, null, 2);
              downloadTextAsJsonFile(jsonText, filename);
            }
          }
          break;
        case 'byScore':
          {
            const requestData = {
              id_list,
              score: toIntScore(score),
            };
            const res = await downLoadJsonByScore(requestData);
            const blob = (res as unknown as { data?: unknown })?.data;
            if (blob instanceof Blob) {
              const raw = await blob.text();
              downloadTextAsJsonFile(normalizeJsonText(raw), filename);
            } else {
              const payload = extractResponsePayload(res);
              const jsonText = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}, null, 2);
              downloadTextAsJsonFile(jsonText, filename);
            }
          }
          break;
        case 'withContext':
          {
            const requestData = {
              id_list,
              score: toIntScore(score),
            };
            const res = await downLoadJsonByContext(requestData);
            const blob = (res as unknown as { data?: unknown })?.data;
            if (blob instanceof Blob) {
              const raw = await blob.text();
              downloadTextAsJsonFile(normalizeJsonText(raw), filename);
            } else {
              const payload = extractResponsePayload(res);
              const jsonText = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {}, null, 2);
              downloadTextAsJsonFile(jsonText, filename);
            }
          }
          break;
      }
      setDownloadDialogOpen(false);
    } catch (error) {
      console.error('下载失败:', error);
      alert(`下载失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleDownloadTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDownloadType(event.target.value as 'all' | 'byScore' | 'withContext');
  };

  const handleVectorize = async (row: DatasetItem) => {
    setLoading(true);
    try {
      await vectorAllQA(row );
      alert('向量化成功');
    } catch (error) {
      alert(`向量化失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async (row: DatasetItem) => {
    setLoading(true);
    try {
      await extractData(row);
      fetchData();
    } catch (error) {
      alert(`提取失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScoring = async (row: DatasetItem) => {
    setLoading(true);
    try {
      await scoringData(row);
      fetchData();
    } catch (error) {
      alert(`打分失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async (row: DatasetItem) => {
    setLoading(true);
    try {
      await clearChunk(row);
      fetchData();
    } catch (error) {
      alert(`清除失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
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
              label="Dataset 描述"
              variant="outlined"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="请输入 Dataset 描述"
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
          title="Dataset 管理"
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert('请至少选择一条记录');
                    return;
                  }
                  setDownloadType('all');
                  handleConfirmDownload();
                }}
                disabled={selectedIds.length === 0}
                size="small"
              >
                全部下载
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert('请至少选择一条记录');
                    return;
                  }
                  setDownloadType('byScore');
                  setDownloadDialogOpen(true);
                }}
                disabled={selectedIds.length === 0}
                size="small"
              >
                按分数下载
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert('请至少选择一条记录');
                    return;
                  }
                  setDownloadType('withContext');
                  setDownloadDialogOpen(true);
                }}
                disabled={selectedIds.length === 0}
                size="small"
              >
                下载带文本块
              </Button>
              <Button 
                variant="contained" 
                onClick={openAddDialog}
                size="small"
              >
                新增
              </Button>
            </Box>
          }
        />
        <TableContainer component={Paper} sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < tableData.length}
                    checked={tableData.length > 0 && selectedIds.length === tableData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>UUID</TableCell>
                <TableCell>创建时间</TableCell>
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
                  <TableRow key={row.id} hover selected={selectedIds.includes(row.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelect(row.id)}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 80 }}>{row.id}</TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.sole_uuid}</TableCell>
                    <TableCell>{row.create_time}</TableCell>
                    <TableCell align="right" sx={{ '& button': { ml: 1 } }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleVectorize(row)}
                      >
                        向量化
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleExtract(row)}
                      >
                        提取
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => handleClear(row)}
                      >
                        清除
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleScoring(row)}
                      >
                        打分
                      </Button>
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEdit ? "编辑 Dataset" : "新增 Dataset"}</DialogTitle>
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
                label="描述"
                fullWidth
                margin="normal"
                value={editForm.description}
                onChange={(e) =>
                  handleEditFieldChange("description", e.target.value)
                }
                error={Boolean(formErrors.description)}
                helperText={formErrors.description}
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
                    value={editForm.create_time}
                    disabled
                  />
                </>
              )}
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

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          确定要删除数据集 "{itemToDelete?.description}" 吗？此操作不可恢复。
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelDelete}>取消</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmDelete}
          >
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 下载弹窗 */}
      <Dialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {downloadType === 'byScore'
            ? '按分数下载'
            : downloadType === 'withContext'
              ? '下载带文本块'
              : '下载'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup value={downloadType} onChange={handleDownloadTypeChange}>
              <FormControlLabel value="byScore" control={<Radio />} label="按分数下载" />
              <FormControlLabel value="withContext" control={<Radio />} label="下载带文本块" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="分数"
            fullWidth
            margin="normal"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">{'>'}=</InputAdornment>,
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDownloadDialogOpen(false)}>取消</Button>
          <Button variant="contained" onClick={handleConfirmDownload}>
            确认下载
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DatasetManagement;
