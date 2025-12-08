import axios, { AxiosError, AxiosResponse } from "axios";

import { toast } from "@/components/ui/use-toast";

// 通用接口返回格式，确保所有请求都遵循统一结构
interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
  [key: string]: unknown;
}

const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 3_600_000,
});

// 成功提示：在需要时展示友好通知
const showSuccess = (message?: string) => {
  if (!message) return;
  toast({
    title: "操作成功",
    description: message,
  });
};

// 错误提示：统一在拦截器里处理失败信息
const showError = (message?: string) => {
  toast({
    title: "操作失败",
    description: message ?? "请稍后再试",
    variant: "destructive",
  });
};

// 响应拦截器：统一处理业务状态码与 toast 提示
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data;
    if (res?.code === 200) {
      showSuccess(res.message);
      return response;
    }

    showError(res?.message as string | undefined);
    return Promise.reject(response);
  },
  (error: AxiosError) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const description = error.response
      ? (error.response.data as ApiResponse)?.message
      : error.message;

    showError(description);
    return Promise.reject(error);
  },
);

export default service;
