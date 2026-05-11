/**
 * 카탈로그 챗봇 API 클라이언트
 * 백엔드 LLM 챗봇 엔드포인트(POST /chat) 호출을 담당합니다.
 *
 * - 백엔드: ym-back FastAPI v1.1.0
 * - 엔드포인트: `${API_BASE_URL}/chat` (예: https://ym-back.icoramdeo.com/api/v1/chat)
 * - 응답은 항상 한국어 plain text 입니다.
 */

import { API_BASE_URL } from './config';

/**
 * 대화 턴의 역할.
 * 백엔드는 'user' / 'model' 두 값만 인식합니다. 그 외 값은 'user'로 강제 변환됩니다.
 */
export type ChatRole = 'user' | 'model';

/**
 * 대화 한 턴 (사용자 입력 또는 모델 응답).
 */
export interface ChatTurn {
  role: ChatRole;
  content: string;
}

/**
 * 백엔드 LLM이 자동 호출한 검색 도구 기록.
 * 디버깅/감사용이며 사용자에게 직접 노출하지 않습니다.
 */
export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
}

/**
 * 챗봇 응답 객체.
 */
export interface ChatResponse {
  reply: string;
  tool_calls: ToolCallRecord[];
}

/**
 * 챗봇 API 호출 실패 시 사용되는 커스텀 에러.
 */
export class ChatApiError extends Error {
  public readonly status: number;
  public readonly detail: string;

  constructor(status: number, detail: string) {
    super(`Chat API ${status}: ${detail}`);
    this.name = 'ChatApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * 챗봇에 한 턴의 메시지를 전송합니다.
 *
 * @param message 사용자 입력 (1자 이상)
 * @param history 이전 대화 히스토리 (현재 메시지를 제외한 과거 대화만 포함)
 * @param signal 취소를 위한 AbortSignal (옵션)
 * @returns 백엔드의 한국어 답변과 도구 호출 기록
 */
export async function sendChat(
  message: string,
  history: ChatTurn[] = [],
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.text();
      if (body) detail = body;
    } catch {
      // 응답 본문 파싱 실패 시 기본 메시지 유지
    }
    throw new ChatApiError(res.status, detail);
  }

  return (await res.json()) as ChatResponse;
}
