import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-gray-800 text-white shadow-md fixed top-0 left-0 right-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">

          <div className="md:hidden">
            <button
              className="focus:outline-none"
              onClick={toggleMenu}
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-gray-700 py-2">
          <nav className="container mx-auto px-4">
            <Link to="/dashboard" className="block py-2 text-gray-300 hover:text-white">Dashboard</Link>
            <Link to="/books" className="block py-2 text-gray-300 hover:text-white">Livros</Link>
            <Link to="/authors" className="block py-2 text-gray-300 hover:text-white">Organizadores</Link>
            <Link to="/sales" className="block py-2 text-gray-300 hover:text-white">Vendas</Link>
            <Link to="/commissions" className="block py-2 text-gray-300 hover:text-white">Comissões</Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;