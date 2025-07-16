import React from 'react';
import { HelpCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const SupportPage: React.FC = () => {
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
          <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Support Center</h2>
          <p className="text-gray-400 mb-6">Get help with your Nothing devices and services</p>
          <div className="flex justify-center space-x-4">
            <button className="bg-white text-black px-6 py-3 rounded-full hover:bg-gray-200 transition-colors text-sm font-medium">
              Contact Support
            </button>
            <button className="bg-gray-900 border border-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors text-sm font-medium">
              Browse FAQ
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupportPage;