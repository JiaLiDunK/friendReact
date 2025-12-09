import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import {
  getKnowledgeBooks,
  del_knowledge_books,
  vectorAllBooks,
  // 如果有单条向量化接口，也可以在这里引入（例如 vectorBook）
} from "@/api/books";

interface KnowledgeBookItem {
  id: number | string;
  tittle: string;
  uuid: string;
  data_base_remark: string;
  collection_remark: string;
  type_id: number;
}

interface KnowledgeBookListApiData {
  total: number;
  items: KnowledgeBookItem[];
}

const KnowledgeBooksManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState<KnowledgeBookItem[]>([]);

  // MUI 分页从 0 开始，后端是 (page-1)*pageSize，所以这里直接用偏移量的写法
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        pagesize: pagination.pageSize,
        page_num: pagination.page * pagination.pageSize,
        keywords: keyword.trim(),
      };

      const res = await getKnowledgeBooks(params);

      // 兼容两种结构：{ data: { total, items } } 或 { total, items }
      const apiData =
        (res.data as { data?: KnowledgeBookListApiData }).data ??
        (res.data as KnowledgeBookListApiData);

      const items = apiData.items ?? [];
      setTableData(items);
      setPagination((prev) => ({
        ...prev,
        total: apiData.total ?? items.length,
      }));
    } catch (error) {
      console.error("获取知识库书籍列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
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

  // 全部向量化
  const handleVectorAll = async () => {
    try {
      await vectorAllBooks();
      fetchData();
    } catch (error) {
      console.error("全部向量化失败:", error);
    }
  };

  // 单条向量化（如果只有全部向量化接口，可以暂时不实现）
  const handleVectorOne = async (row: KnowledgeBookItem) => {
    // 如果后端有单条向量化接口，可以在这里调用：
    // await vectorBook(row);
    // 暂时用全部向量化占位或只打印：
    console.log("向量化单条书籍:", row);
  };

  // 删除
  const handleDelete = async (row: KnowledgeBookItem) => {
    try {
      await del_knowledge_books(row);
      fetchData();
    } catch (error) {
      console.error("删除失败:", error);
    }
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

  const renderProgress = (type_id: number) => {
    if (type_id === 8) return "书籍选择存放的知识库";
    if (type_id === 9) return "已准备向量化";
    if (type_id === 11) return "已向量化";
    return "未知状态";
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 搜索区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              label="关键词"
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
            <Button variant="contained" color="success" onClick={handleVectorAll}>
              全部向量化
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 表格区域 */}
      <Card>
        <CardHeader title="知识库书籍管理" />
        <TableContainer component={Paper} sx={{ maxHeight: 480 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>书名</TableCell>
                <TableCell>UUID</TableCell>
                <TableCell>知识库选择</TableCell>
                <TableCell>集合选择</TableCell>
                <TableCell>进度</TableCell>
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
                    <TableCell>{row.tittle}</TableCell>
                    <TableCell sx={{ maxWidth: 260, wordBreak: "break-all" }}>
                      {row.uuid}
                    </TableCell>
                    <TableCell>{row.data_base_remark}</TableCell>
                    <TableCell>{row.collection_remark}</TableCell>
                    <TableCell>{renderProgress(row.type_id)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        onClick={() => handleVectorOne(row)}
                        sx={{ mr: 1 }}
                      >
                        向量化
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(row)}
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
    </Box>
  );
};

export default KnowledgeBooksManagement;