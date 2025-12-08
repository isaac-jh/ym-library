import { useNavigate } from 'react-router-dom';
import './HomePage.css';

/**
 * 홈 페이지
 * iOS 16 리퀴드 스타일의 네비게이션 버튼을 제공합니다.
 */
function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="liquid-container">
        <button
          className="liquid-button catalog"
          onClick={() => navigate('/catalog')}
        >
          <div className="button-content">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <span className="label">자료실</span>
          </div>
        </button>

        <button
          className="liquid-button backup"
          onClick={() => navigate('/backup')}
        >
          <div className="button-content">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </div>
            <span className="label">백업</span>
          </div>
        </button>

        <button
          className="liquid-button console"
          onClick={() => navigate('/console')}
        >
          <div className="button-content">
            <div className="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <span className="label">콘솔</span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default HomePage;

