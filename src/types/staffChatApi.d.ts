import "axios";
import type { AxiosRequestConfig, AxiosResponse } from "axios";

declare module "axios" {
  interface AxiosInstance {
    get(
      url: "/api/transactions/staff-chat/unread-count",
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<{ unread_count?: number }>>;
    get<T = any, R = AxiosResponse<T>, D = any>(
      url: string,
      config?: AxiosRequestConfig<D>
    ): Promise<R>;
  }
}

export {};
