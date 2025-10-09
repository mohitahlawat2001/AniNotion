import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import RawPage from './pages/RawPage';
import PostPage from './pages/PostPage';
import AuthCallback from './pages/AuthCallback';
import { LayoutProvider } from './context/LayoutContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <AuthProvider>
      <LayoutProvider>
        <Router>
          <Layout 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          >
            <Routes>
              <Route 
                path="/" 
                element={
                  activeCategory ? 
                    <CategoryPage category={activeCategory} /> : 
                    <Home />
                } 
              />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/raw" element={<RawPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </Layout>
        </Router>
      </LayoutProvider>
    </AuthProvider>
  );
}

export default App;