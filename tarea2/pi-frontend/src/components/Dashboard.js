import React, { useState } from "react";
import UploadFile from "./UploadFile"; // Importamos el componente UploadFile

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Funciones para navegar por las funcionalidades del dashboard
  const functionalities = [
    { title: "Subir Archivo", action: () => setIsModalOpen(true) }, // Abre el modal de subida de archivo
    { title: "Ver Certificados", action: () => alert("Navegar a certificados") },
    { title: "Historial de Transferencias", action: () => alert("Navegar a transferencias") },
    { title: "Verificar Propiedad", action: () => alert("Navegar a verificar") },
    { title: "Historial de Disputas", action: () => alert("Navegar a disputas") },
  ];

  const closeModal = () => setIsModalOpen(false); // Función para cerrar el modal

  return (
    <div
      className={`min-h-screen bg-cover bg-center flex flex-col items-center justify-center relative font-sans transition-all duration-300 ${
        isModalOpen ? "backdrop-blur-sm" : ""
      }`}
      style={{
        backgroundImage: "url('https://wallpapers.com/images/hd/minimalist-blockchain-illustration-sq1y4w1fh5vt0dp2.jpg')",
      }}
    >
      {/* Fondo oscuro detrás del contenido */}
      <div
        className={`bg-black bg-opacity-60 w-full h-full absolute top-0 left-0 ${
          isModalOpen ? "opacity-80" : "opacity-60"
        } transition-opacity duration-300`}
      ></div>

      <h1 className="relative text-4xl text-white font-bold mb-10 z-10">Gestión de propiedad intelectual</h1>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 z-10">
        {functionalities.map((func, index) => (
          <div
            key={index}
            onClick={func.action}
            className="bg-teal-600 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:bg-teal-500 hover:scale-105 transform transition-transform duration-300 group"
          >
            <h2 className="text-xl font-semibold text-white group-hover:text-gray-100">{func.title}</h2>
          </div>
        ))}
      </div>

      {/* Modal de Subir Archivo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative max-w-lg mx-auto">
            <UploadFile closeModal={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
