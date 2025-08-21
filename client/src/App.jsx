import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import EditorPage from './pages/EditorPage';
import useAuth from './hooks/useAuth';
import { Navigate } from 'react-router-dom';

function App() {
  const { userInfo } = useAuth();

  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={userInfo ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/documents/:id" element={userInfo ? <EditorPage /> : <Navigate to="/login" />} />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to={userInfo ? "/" : "/login"} />} />
      </Routes>
    </>
  );
}

export default App;