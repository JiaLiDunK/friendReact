import request from "@/utils/request";

// 类型实体入参：新增或更新时使用
interface TypePayload {
  id?: number;
  type_name: string;
}

// 类型列表查询参数：分页与关键字可选（与后端字段保持一致）
interface TypeListQuery {
  pagesize?: number;
  page_num?: number;
  keywords?: string;
}

// 统一 POST 请求辅助函数，避免重复配置
const postType = <T,>(url: string, data?: unknown) =>
  request<T>({
    url,
    method: "post",
    data,
  });

// 对外暴露的类型管理 API
export const typeApi = {
  add: <T = unknown>(data: TypePayload) => postType<T>("/type/insertType", data),
  list: <T = unknown>(data?: TypeListQuery) => postType<T>("/type/getTypeList", data),
  update: <T = unknown>(data: TypePayload) => postType<T>("/type/updateType", data),
};