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
import TrendingPage from './pages/TrendingPage';
import CategoryTrendingPage from './pages/CategoryTrendingPage';
import PersonalizedPage from './pages/PersonalizedPage';
import SimilarPostsPage from './pages/SimilarPostsPage';
import { LayoutProvider } from './context/LayoutContext';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './contexts/NavigationContext';

function App() {
  const [activeCategory, setActiveCategory] = useState(null);

  return (
    <AuthProvider>
      <LayoutProvider>
        <Router>
          <NavigationProvider>
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
                <Route path="/post/:postId/similar" element={<SimilarPostsPage />} />
                <Route path="/anime/:animeName" element={<AnimeInfoPage />} />
                <Route path="/trending" element={<TrendingPage />} />
                <Route path="/trending/category/:categoryId" element={<CategoryTrendingPage />} />
                <Route path="/recommendations" element={<PersonalizedPage />} />
                <Route path="/raw" element={<RawPage />} />
                <Route path="/saved" element={<SavedPage />} />
                <Route path="/my-posts" element={<MyPostsPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
              </Routes>
            </Layout>
          </NavigationProvider>
        </Router>
      </LayoutProvider>
    </AuthProvider>
  );
}

export default App;