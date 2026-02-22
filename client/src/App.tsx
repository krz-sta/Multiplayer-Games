import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from "./components/AuthPage.tsx"
import MainPage from "./components/MainPage.tsx"
import { useEffect, useState } from 'react'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error("Error validating session:", error);
      } finally {
        setLoading(false);
      }
      
    };

    checkSession();
  }, []);

  if (loading) return <h1>Validating Session</h1>

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={!user ? <AuthPage /> : <Navigate to="/"/>}
          />
          <Route
            path="/"
            element={user ? <MainPage user={user} /> : <Navigate to="/login"/>}
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
