/**
 * Auth API 관련 함수
 * 인증 관련 API 호출을 담당합니다.
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import type { LoginRequest, LoginResponse, User } from '../types';

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

/**
 * 모든 유저 목록을 조회합니다.
 * @returns Promise<User[]> - 유저 목록
 */
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await get<User[]>(API_ENDPOINTS.AUTH_USERS);
    return response;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}

