import React from 'react';
import { Home, Film, BookOpen, Plus } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-lg h-screen p-4">
      <h1 className="text-2xl font-bold text-primary mb-8">AniNotion</h1>
      
      <nav className="space-y-2">
        <a href="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
          <Home size={20} />
          <span>Home</span>
        </a>
        
        <a href="/anime" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
          <Film size={20} />
          <span>Anime</span>
        </a>
        
        <a href="/manga" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
          <BookOpen size={20} />
          <span>Manga</span>
        </a>
        
        <a href="/other" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100">
          <Plus size={20} />
          <span>Other</span>
        </a>
      </nav>
    </div>
  );
};

export default Sidebar;