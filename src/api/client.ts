/**
 * API 클라이언트 유틸리티
 * 공통 fetch 로직 및 에러 처리를 담당합니다.
 */

import { API_BASE_URL, API_TIMEOUT, DEFAULT_REQUEST_CONFIG } from './config';
import type { ApiError } from '../types';

/**
 * API 요청을 수행하는 기본 클라이언트 함수
 * @param endpoint - API 엔드포인트 경로
 * @param config - fetch RequestInit 설정
 * @returns Promise<T> - 파싱된 응답 데이터
 * @throws ApiError - API 요청 실패 시
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 타임아웃 처리를 위한 AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...DEFAULT_REQUEST_CONFIG,
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP error! status: ${response.status}`,
        status: response.status,
      };
      throw error;
    }

    const data = await response.json();
    return data as T;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        const error: ApiError = {
          message: '요청 시간이 초과되었습니다.',
        };
        throw error;
      }
      
      const error: ApiError = {
        message: err.message,
      };
      throw error;
    }

    throw err;
  }
}

/**
 * GET 요청을 수행하는 헬퍼 함수
 * @param endpoint - API 엔드포인트
 * @param params - 쿼리 파라미터 객체
 * @returns Promise<T>
 */
export async function get<T>(
  endpoint: string,
  params?: Record<string, string | number>
): Promise<T> {
  let url = endpoint;
  
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString();
    url = `${endpoint}?${queryString}`;
  }

  return apiClient<T>(url, { method: 'GET' });
}

/**
 * POST 요청을 수행하는 헬퍼 함수
 * TODO: 필요시 구현
 * @param endpoint - API 엔드포인트
 * @param data - 요청 바디 데이터
 * @returns Promise<T>
 */
export async function post<T>(endpoint: string, data: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

