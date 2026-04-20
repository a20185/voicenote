import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import i18n from 'i18next';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add auth token if available
        // const token = await AsyncStorage.getItem('authToken');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and redirect to login
          // await AsyncStorage.removeItem('authToken');
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as { message?: string };
      return {
        message: data.message || i18n.t('errors:apiError'),
        code: error.code,
        status: error.response.status,
      };
    }
    if (error.request) {
      return {
        message: i18n.t('errors:noServerResponse'),
        code: error.code,
      };
    }
    return {
      message: error.message || i18n.t('errors:unexpectedError'),
      code: error.code,
    };
  }

  get instance() {
    return this.client;
  }

  async get<T>(url: string, params?: object) {
    return this.client.get<T>(url, { params });
  }

  async post<T>(url: string, data?: object) {
    return this.client.post<T>(url, data);
  }

  async put<T>(url: string, data?: object) {
    return this.client.put<T>(url, data);
  }

  async patch<T>(url: string, data?: object) {
    return this.client.patch<T>(url, data);
  }

  async delete<T>(url: string) {
    return this.client.delete<T>(url);
  }
}

export const apiClient = new ApiClient();
export type { ApiError };
