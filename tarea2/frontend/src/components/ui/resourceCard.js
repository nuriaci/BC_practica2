import React from 'react';

function ResourceCard({ title, items, ownerResources }) {
  return (
    <div className="bg-[rgba(0,0,0,0.7)] p-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:shadow-xl fade-in">
      <h2 className="text-2xl font-light text-white mb-6">{title}</h2>

      {/* Grid para los ítems */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-[rgba(31,41,55,0.8)] p-6 rounded-lg text-center hover:bg-gray-700 transition ease-in-out duration-300"
          >
            {/* Verifica si el item tiene una imagen */}
            <div
              className="h-24 w-full mb-4 rounded-md overflow-hidden"
              style={{
                backgroundImage: item.image ? `url(${item.image})` : 'url(https://via.placeholder.com/150)', // Imagen predeterminada si no existe
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>

            {/* Nombre del ítem */}
            <a
              href="#"
              className={`block text-white ${ownerResources ? 'text-green-500' : 'text-white'} font-light mb-2`}
            >
              {item.name}
            </a>

            {/* Nombre de la función */}
            {item.functionName && (
              <p className="text-sm text-gray-400">{item.functionName}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResourceCard;
