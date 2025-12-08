import React, { useState, useEffect } from 'react';
import { login } from '../api';
import type { User } from '../types';
import './ConsolePage.css';

/**
 * 세션스토리지 키
 */
const SESSION_USER_KEY = 'ym_library_user';

/**
 * 콘솔 페이지
 * 로그인 후 관리 기능을 제공합니다.
 */
function ConsolePage() {
  // 로그인 상태
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  // 유저 정보
  const [user, setUser] = useState<User | null>(null);
  // 아이디 입력값
  const [nickname, setNickname] = useState<string>('');
  // 비밀번호 입력값
  const [password, setPassword] = useState<string>('');
  // 로그인 중 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 에러 메시지
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 페이지 로드 시 세션스토리지에서 유저 정보 복원
   */
  useEffect(() => {
    const savedUser = sessionStorage.getItem(SESSION_USER_KEY);
    if (savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        sessionStorage.removeItem(SESSION_USER_KEY);
      }
    }
  }, []);

  /**
   * 세션스토리지에 유저 정보 저장
   */
  const saveUserToSession = (userData: User) => {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userData));
  };

  /**
   * 로그인 처리 함수
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!nickname.trim() || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await login(nickname, password);
      
      // 유저 정보 추출 (응답 형식에 따라 유연하게 처리)
      let userData: User | null = null;
      
      if (response.user) {
        userData = response.user;
      } else if (response.id && response.nickname) {
        // 응답이 플랫한 구조인 경우
        userData = {
          id: response.id,
          name: response.name || '',
          nickname: response.nickname,
          deleted: response.deleted || false,
          created_at: response.created_at || '',
        };
      }

      if (!userData) {
        throw new Error('Invalid response: user data not found');
      }

      // 탈퇴한 유저 체크
      if (userData.deleted) {
        setErrorMessage('탈퇴한 유저입니다.\n재가입은 관리자에게 문의해주세요.');
        return;
      }

      // 로그인 성공
      setUser(userData);
      saveUserToSession(userData);
      setIsLoggedIn(true);
      console.log('Login successful:', userData);
    } catch (err) {
      // 로그인 실패
      setErrorMessage('로그인에 실패했습니다.\n회원가입은 관리자에게 문의해주세요.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 엔터키로 로그인
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin(e as any);
    }
  };

  // 로그인 전 화면
  if (!isLoggedIn) {
    return (
      <div className="console-page">
        <div className="login-container">
          <h1 className="login-title">관리 콘솔</h1>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="nickname" className="input-label">아이디</label>
              <input
                id="nickname"
                type="text"
                className="login-input"
                placeholder="아이디를 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">비밀번호</label>
              <input
                id="password"
                type="password"
                className="login-input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="error-message">
                {errorMessage.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /**
   * 로그아웃 처리
   */
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_USER_KEY);
    setUser(null);
    setIsLoggedIn(false);
    setNickname('');
    setPassword('');
  };

  // 로그인 후 화면
  return (
    <div className="console-page">
      <div className="container">
        <div className="console-header">
          <h1 className="title">관리 콘솔</h1>
          {user && (
            <div className="user-info">
              <span className="user-name">{user.name} ({user.nickname})</span>
              <button onClick={handleLogout} className="logout-button">
                로그아웃
              </button>
            </div>
          )}
        </div>
        <p className="placeholder">관리 기능이 곧 추가됩니다.</p>
      </div>
    </div>
  );
}

export default ConsolePage;

