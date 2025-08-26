import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import RawPage from './pages/RawPage';
import PostPage from './pages/PostPage';
import { LayoutProvider } from './context/LayoutContext';

function App() {
  const [activeCategory, setActiveCategory] = useState(null);

  return (
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
          </Routes>
        </Layout>
      </Router>
    </LayoutProvider>
  );
}

export default App;