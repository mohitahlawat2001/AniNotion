import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/anime" element={<div>Anime Page</div>} />
          <Route path="/manga" element={<div>Manga Page</div>} />
          <Route path="/other" element={<div>Other Page</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;