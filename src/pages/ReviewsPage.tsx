import React from 'react';
import { Star } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Sidebar 
        categories={[]}
        selectedCategory=""
        setSelectedCategory={() => {}}
        showCategories={false}
      />

      <main className="lg:col-span-3">
        <div className="text-center py-16">
          <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Reviews</h2>
          <p className="text-gray-400 mb-6">Read and write detailed reviews of Nothing products</p>
          <button 
            onClick={() => navigate('/new-post')}
            className="bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Write a Review
          </button>
        </div>
      </main>
    </div>
  );
};

export default ReviewsPage;