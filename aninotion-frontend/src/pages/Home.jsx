import React from 'react';

const Home = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Recent Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Posts will be displayed here */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">Sample Post</h3>
          <p className="text-gray-600">This is where your anime/manga posts will appear.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;