import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import RawPage from './pages/RawPage';
import PostPage from './pages/PostPage';
import AnimeInfoPage from './pages/AnimeInfoPage';
import AuthCallback from './pages/AuthCallback';
import SavedPage from './pages/SavedPage';
import MyPostsPage from './pages/MyPostsPage';
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
              <Route path="/post/:id/edit" element={<PostPage />} />
              <Route path="/anime/:animeName" element={<AnimeInfoPage />} />
              <Route path="/raw" element={<RawPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/my-posts" element={<MyPostsPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
            </Routes>
          </Layout>
        </Router>
      </LayoutProvider>
    </AuthProvider>
  );
}

export default App;