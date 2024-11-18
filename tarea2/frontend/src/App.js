import React from 'react';
import Header from './components/ui/header';
import Footer from './components/ui/footer';
import PublicResources from './components/sections/publicResources';
import OwnerResources from './components/sections/ownerResources';

function App() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(https://wallpapers.com/images/hd/minimalist-blockchain-illustration-sq1y4w1fh5vt0dp2.jpg)', // Cambia esto por la URL de tu imagen
      }}
    >
      {/* Header */}
      <Header />

      <div className="container mx-auto p-4">
        {/* Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recursos para todos */}
          <PublicResources />

          {/* Recursos para propietario */}
          <OwnerResources />
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
