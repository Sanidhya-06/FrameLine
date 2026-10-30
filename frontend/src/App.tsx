import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoadingPage from './pages/LoadingPage';
import { MapPage } from './pages/MapPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { ComparePage } from './pages/ComparePage';

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/loading" element={<LoadingPage />} />
    <Route path="/map" element={<MapPage />} />
    <Route path="/country/:code" element={<MapPage />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/methodology" element={<MethodologyPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
