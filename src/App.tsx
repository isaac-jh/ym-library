import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import BackupPage from './pages/BackupPage';
import ConsolePage from './pages/ConsolePage';

/**
 * 메인 App 컴포넌트
 * 라우팅을 설정하고 각 페이지로 연결합니다.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/backup" element={<BackupPage />} />
        <Route path="/console" element={<ConsolePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
