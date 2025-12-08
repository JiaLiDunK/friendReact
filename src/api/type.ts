import request from "@/utils/request";

// 类型实体入参：新增或更新时使用
interface TypePayload {
  id?: string;
  name: string;
}

// 类型列表查询参数：分页可选
interface TypeListQuery {
  page?: number;
  pageSize?: number;
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
  add: (data: TypePayload) => postType("/type/insertType", data),
  list: (data?: TypeListQuery) => postType("/type/getTypeList", data),
  update: (data: TypePayload) => postType("/type/updateType", data),
};