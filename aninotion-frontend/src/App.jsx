import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import CategoryPage from './pages/CategoryPage';

function App() {
  const [activeCategory, setActiveCategory] = useState(null);

  return (
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
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;