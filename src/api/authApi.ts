/**
 * Auth API 관련 함수
 * 인증 관련 API 호출을 담당합니다.
 */

import { post } from './client';
import { API_ENDPOINTS } from './config';
import type { LoginRequest, LoginResponse } from '../types';

/**
 * 로그인을 수행합니다.
 * @param nickname - 사용자 닉네임
 * @param password - 비밀번호
 * @returns Promise<LoginResponse> - 로그인 응답
 */
export async function login(
  nickname: string,
  password: string
): Promise<LoginResponse> {
  try {
    const requestBody: LoginRequest = {
      nickname,
      password,
    };

    const response = await post<LoginResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      requestBody
    );

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

