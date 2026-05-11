import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { sendChat, ChatApiError, type ChatTurn } from '../api/chatApi';
import chatbotIconUrl from '../assets/chatbot-icon.png';
import './ChatBot.css';

/**
 * 카탈로그 페이지 우측 하단 챗봇 위젯.
 *
 * 동작 개요:
 * 1. 최초 렌더 시 아이콘이 등장하면서 안내 말풍선이 함께 노출되고,
 *    말풍선 또는 아이콘을 클릭하면 닫히며 localStorage 에 저장되어 다시 나타나지 않습니다.
 * 2. 아이콘을 클릭하면 채팅창이 부드럽게 펼쳐지고, 채팅창 외부를 클릭하면 다시 닫힙니다.
 * 3. 요청 중에는 스피너와 함께 '처리중' 안내가 깜빡이며,
 *    백엔드 응답이 도착하면 답변이 0.05s 단위로 한 글자씩 출력됩니다.
 * 4. 진행 중인 요청은 '중단' 버튼으로 취소할 수 있습니다 (AbortController 활용).
 */

/** localStorage 에 안내 말풍선의 닫힘 여부를 저장하기 위한 키. */
const TOOLTIP_DISMISS_KEY = 'ym-library:chatbot-tooltip-dismissed';

/** 안내 말풍선 등장/사라짐 애니메이션 길이 (ms). CSS 와 동기화 필요. */
const TOOLTIP_ANIMATION_DURATION_MS = 380;

/** 채팅창 등장/사라짐 애니메이션 길이 (ms). CSS 와 동기화 필요. */
const CHAT_ANIMATION_DURATION_MS = 320;

/** 첫 렌더 직후 말풍선이 자연스럽게 등장하도록 주는 지연 시간 (ms). */
const TOOLTIP_APPEAR_DELAY_MS = 500;

/** 응답 텍스트를 한 글자씩 출력할 때 사용할 간격 (ms). */
const TYPING_INTERVAL_MS = 50;

/**
 * 채팅 메시지 (UI 표현용).
 * 모델 응답은 한 글자씩 출력하므로 displayed 와 done 필드를 함께 관리합니다.
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  /** 백엔드에서 받아온 (또는 사용자가 입력한) 원본 메시지 전체. */
  content: string;
  /** 화면에 실제로 표시되고 있는 부분 텍스트. user 메시지는 항상 content 와 동일. */
  displayed: string;
  /** 타이핑 애니메이션이 종료되었는지 여부. */
  done: boolean;
  /** 에러 안내 메시지 여부 (스타일 분기용). */
  isError?: boolean;
}

/** 고유 메시지 id 생성기. */
function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ChatBot() {
  /** 안내 말풍선 표시 여부 (mount 상태). */
  const [tooltipMounted, setTooltipMounted] = useState<boolean>(false);
  /** 말풍선 등장(false) / 닫힘(true) 애니메이션 상태. */
  const [tooltipClosing, setTooltipClosing] = useState<boolean>(false);

  /** 채팅창 열림 여부 (mount 상태). */
  const [chatMounted, setChatMounted] = useState<boolean>(false);
  /** 채팅창 등장(false) / 닫힘(true) 애니메이션 상태. */
  const [chatClosing, setChatClosing] = useState<boolean>(false);

  /** 채팅 메시지 목록. */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** 입력창 값. */
  const [inputValue, setInputValue] = useState<string>('');
  /** 백엔드 응답 대기 여부. */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /** 진행 중 요청을 중단하기 위한 AbortController. */
  const abortControllerRef = useRef<AbortController | null>(null);
  /** 클릭 외부 감지를 위한 컨테이너 ref. */
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** 메시지 목록 자동 스크롤을 위한 ref. */
  const messageListRef = useRef<HTMLDivElement | null>(null);
  /** 입력창 자동 포커스를 위한 ref. */
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** 진행 중인 setTimeout (typewriter) 추적용. unmount 시 모두 정리. */
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  /** unmount 시 보류 중인 모든 timeout 을 정리. */
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * setTimeout 을 래핑하여 ref 에 등록한다.
   * 컴포넌트 unmount 시 일괄 정리할 수 있도록 추적하기 위함.
   */
  const scheduleTimeout = useCallback(
    (cb: () => void, delay: number): ReturnType<typeof setTimeout> => {
      const handle = setTimeout(() => {
        timeoutsRef.current.delete(handle);
        cb();
      }, delay);
      timeoutsRef.current.add(handle);
      return handle;
    },
    [],
  );

  /** 최초 렌더 시 localStorage 를 보고 말풍선 노출 여부 결정. */
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(TOOLTIP_DISMISS_KEY) === '1';
    } catch {
      // localStorage 비활성화 환경 (시크릿 모드 등) 에서는 매번 노출
    }
    if (dismissed) return;

    const handle = scheduleTimeout(() => {
      setTooltipMounted(true);
    }, TOOLTIP_APPEAR_DELAY_MS);

    return () => {
      clearTimeout(handle);
      timeoutsRef.current.delete(handle);
    };
  }, [scheduleTimeout]);

  /** 말풍선 닫기 (역재생 애니메이션 후 unmount + localStorage 기록). */
  const dismissTooltip = useCallback(() => {
    if (!tooltipMounted || tooltipClosing) return;
    setTooltipClosing(true);
    try {
      window.localStorage.setItem(TOOLTIP_DISMISS_KEY, '1');
    } catch {
      // localStorage 사용 불가시 다음 방문에 다시 노출되어도 큰 문제 없음
    }
    scheduleTimeout(() => {
      setTooltipMounted(false);
      setTooltipClosing(false);
    }, TOOLTIP_ANIMATION_DURATION_MS);
  }, [tooltipMounted, tooltipClosing, scheduleTimeout]);

  /** 채팅창 닫기 (역재생 애니메이션 후 unmount). 진행 중 요청은 즉시 취소. */
  const closeChat = useCallback(() => {
    if (!chatMounted || chatClosing) return;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setChatClosing(true);
    scheduleTimeout(() => {
      setChatMounted(false);
      setChatClosing(false);
    }, CHAT_ANIMATION_DURATION_MS);
  }, [chatMounted, chatClosing, scheduleTimeout]);

  /** 아이콘 클릭 — 말풍선이 떠 있다면 닫고 채팅창 토글. */
  const handleIconClick = useCallback(() => {
    if (tooltipMounted) {
      dismissTooltip();
    }
    if (chatMounted) {
      closeChat();
      return;
    }
    setChatMounted(true);
  }, [tooltipMounted, chatMounted, dismissTooltip, closeChat]);

  /** 채팅창 외부 클릭 시 채팅창 닫기. */
  useEffect(() => {
    if (!chatMounted || chatClosing) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (containerRef.current && containerRef.current.contains(target)) return;
      closeChat();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [chatMounted, chatClosing, closeChat]);

  /** 채팅창이 열리면 입력창에 자동 포커스. */
  useEffect(() => {
    if (chatMounted && !chatClosing) {
      const handle = scheduleTimeout(() => inputRef.current?.focus(), 80);
      return () => {
        clearTimeout(handle);
        timeoutsRef.current.delete(handle);
      };
    }
  }, [chatMounted, chatClosing, scheduleTimeout]);

  /** 메시지가 추가되거나 타이핑이 진행될 때 자동으로 하단 스크롤. */
  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages, isLoading]);

  /**
   * 모델 답변을 0.05s 단위로 한 글자씩 displayed 에 누적.
   * 사용자가 채팅창을 닫거나 컴포넌트가 unmount 되면 scheduleTimeout 의 cleanup 으로 정지.
   */
  const startTypewriter = useCallback(
    (messageId: string, fullText: string) => {
      let index = 0;
      const tick = () => {
        index += 1;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  displayed: fullText.slice(0, index),
                  done: index >= fullText.length,
                }
              : m,
          ),
        );
        if (index < fullText.length) {
          scheduleTimeout(tick, TYPING_INTERVAL_MS);
        }
      };
      scheduleTimeout(tick, TYPING_INTERVAL_MS);
    },
    [scheduleTimeout],
  );

  /** 사용자 메시지 전송. */
  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: createMessageId('u'),
      role: 'user',
      content: trimmed,
      displayed: trimmed,
      done: true,
    };

    // 백엔드로 보낼 history 는 "현재 메시지를 제외한 과거 대화" 만 포함.
    const historyForBackend: ChatTurn[] = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { reply } = await sendChat(trimmed, historyForBackend, controller.signal);
      const modelMessage: ChatMessage = {
        id: createMessageId('m'),
        role: 'model',
        content: reply,
        displayed: '',
        done: false,
      };
      setMessages((prev) => [...prev, modelMessage]);
      startTypewriter(modelMessage.id, reply);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 사용자가 의도적으로 취소한 경우는 별도 메시지를 남기지 않음
        return;
      }
      const friendlyMessage =
        err instanceof ChatApiError && err.status === 422
          ? '메시지를 입력해 주세요.'
          : '일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.';
      const errorMessage: ChatMessage = {
        id: createMessageId('e'),
        role: 'model',
        content: friendlyMessage,
        displayed: '',
        done: false,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      startTypewriter(errorMessage.id, friendlyMessage);
    } finally {
      // 같은 controller 가 여전히 활성 controller 인 경우에만 정리
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, startTypewriter]);

  /** 진행 중 요청 중단. */
  const handleAbort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const tooltipClassName = useMemo(() => {
    const base = 'chatbot-tooltip';
    return tooltipClosing ? `${base} ${base}--closing` : base;
  }, [tooltipClosing]);

  const chatClassName = useMemo(() => {
    const base = 'chatbot-window';
    return chatClosing ? `${base} ${base}--closing` : base;
  }, [chatClosing]);

  return (
    <div className="chatbot-root" ref={containerRef}>
      {chatMounted && (
        <div
          className={chatClassName}
          role="dialog"
          aria-label="카탈로그 챗봇"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <header className="chatbot-window__header">
            <img
              src={chatbotIconUrl}
              alt=""
              aria-hidden="true"
              className="chatbot-window__avatar"
            />
            <div className="chatbot-window__title">
              <strong>자료실 챗봇</strong>
              <span>활동/장면을 자연어로 질문해 보세요</span>
            </div>
            <button
              type="button"
              className="chatbot-window__close"
              onClick={closeChat}
              aria-label="챗봇 닫기"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </header>

          <div className="chatbot-window__messages" ref={messageListRef}>
            {messages.length === 0 && !isLoading && (
              <div className="chatbot-window__empty">
                무엇을 찾고 계신가요?
                <br />
                예) "가족초청예배 영상 어디에 백업되어 있어?"
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={[
                  'chatbot-message',
                  `chatbot-message--${message.role}`,
                  message.isError ? 'chatbot-message--error' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="chatbot-message__bubble">
                  {message.displayed}
                  {!message.done && message.role === 'model' && (
                    <span className="chatbot-message__caret" aria-hidden="true" />
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div
                className="chatbot-message chatbot-message--model"
                aria-live="polite"
                aria-busy="true"
              >
                <div className="chatbot-message__bubble chatbot-message__bubble--loading">
                  <span className="chatbot-spinner" aria-hidden="true" />
                  <span className="chatbot-loading-text">처리중</span>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-window__input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="chatbot-window__input"
              placeholder="가초예 영상 위치 찾아줘"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleInputKeyDown}
              disabled={isLoading}
              aria-label="챗봇에게 질문"
            />
            {isLoading ? (
              <button
                type="button"
                className="chatbot-window__abort"
                onClick={handleAbort}
                aria-label="요청 중단"
              >
                중단
              </button>
            ) : (
              <button
                type="button"
                className="chatbot-window__send"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                aria-label="메시지 전송"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path
                    d="M3 11.5l17-7-7 17-2.5-7.5L3 11.5z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {tooltipMounted && (
        <button
          type="button"
          className={tooltipClassName}
          onClick={dismissTooltip}
          aria-label="챗봇 안내 닫기"
        >
          <span className="chatbot-tooltip__text">
            챗봇 기능이 추가되었어요!
            <br />
            챗봇을 통해 데이터를 찾아보세요 😆
          </span>
          <span className="chatbot-tooltip__tail" aria-hidden="true" />
        </button>
      )}

      <button
        type="button"
        className={[
          'chatbot-launcher',
          chatMounted ? 'chatbot-launcher--hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={handleIconClick}
        aria-label={chatMounted ? '챗봇 닫기' : '챗봇 열기'}
        aria-expanded={chatMounted}
      >
        <img src={chatbotIconUrl} alt="" aria-hidden="true" draggable={false} />
      </button>
    </div>
  );
}

export default ChatBot;
