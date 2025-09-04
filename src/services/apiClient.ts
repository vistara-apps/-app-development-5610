// Base API client with error handling and retry logic

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, AppError } from '../types';

export class ApiClient {
  private client: AxiosInstance;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp to prevent caching
        if (config.params) {
          config.params._t = Date.now();
        } else {
          config.params = { _t: Date.now() };
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Retry logic for network errors
        if (
          error.code === 'NETWORK_ERROR' ||
          error.code === 'ECONNABORTED' ||
          (error.response?.status >= 500 && error.response?.status < 600)
        ) {
          if (!originalRequest._retry && originalRequest._retryCount < this.retryAttempts) {
            originalRequest._retry = true;
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

            await this.delay(this.retryDelay * originalRequest._retryCount);
            return this.client(originalRequest);
          }
        }

        return Promise.reject(this.createAppError(error));
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createAppError(error: any): AppError {
    const appError: AppError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error.response?.data || error,
      timestamp: new Date(),
    };

    if (error.response) {
      appError.code = `HTTP_${error.response.status}`;
      appError.message = error.response.data?.message || error.response.statusText;
    }

    return appError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        data: response.data,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return {
        data: response.data,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return {
        data: response.data,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return {
        data: response.data,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  // GraphQL specific method
  async graphql<T>(query: string, variables?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.post<{ data: T; errors?: any[] }>('/graphql', {
        query,
        variables,
      });

      if (response.data.errors && response.data.errors.length > 0) {
        throw new Error(response.data.errors[0].message);
      }

      return {
        data: response.data.data,
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  // Set authorization header
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Remove authorization header
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
  }
}
