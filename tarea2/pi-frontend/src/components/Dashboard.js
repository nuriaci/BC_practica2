import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import { Contract, ethers } from "ethers"; // Import ethers.js para interactuar con Ethereum
import { addresses, abis } from "../contracts"; // Contratos

const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
const ipfsContract = new ethers.Contract(addresses.ipfs, abis.ipfs, defaultProvider);

function Dashboard() {
  const navigate = useNavigate(); // Hook para navegación
  const [cantidadArchivos, setCantidadArchivos] = useState(0); // Estado para la cantidad de archivos

  useEffect(() => {
    // Función para obtener los archivos del usuario conectado
    const obtenerArchivos = async () => {
      const signer = await defaultProvider.getSigner(); // Obtener la cuenta conectada
      const direccion = await signer.getAddress(); // Obtener la dirección de la cuenta conectada

      try {
        console.log(ipfsContract);
        // Obtener los archivos del propietario desde el mapping
        console.log(direccion)
        const archivos = await ipfsContract.archivosCount(direccion); // Llamada al contrato para obtener los archivos
        setCantidadArchivos(archivos); // Establecer la cantidad de archivos
      } catch (error) {
        console.error("Error al obtener archivos:", error);
      }
    };

    obtenerArchivos(); // Llamar a la función cuando el componente se monte
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center relative font-sans"
      style={{
        backgroundImage: "url('https://wallpapers.com/images/hd/minimalist-blockchain-illustration-sq1y4w1fh5vt0dp2.jpg')",
      }}
    >
      {/* Fondo oscuro detrás del contenido */}
      <div className="bg-black bg-opacity-60 w-full h-full absolute top-0 left-0 opacity-80"></div>

      <h1 className="relative text-4xl text-white font-bold mb-10 z-10">
        Gestión de Propiedad Intelectual
      </h1>

      <div className="relative w-1/4 p-4 bg-gray-800 text-white rounded-lg shadow-lg z-10">
        <p className="mb-4">
          Archivos totales: {cantidadArchivos} {/* Muestra la cantidad de archivos */}
        </p>
        <button
          onClick={() => navigate("/uploadfile")} // Navegar a la página de subir archivo
          className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg transition transform hover:bg-teal-500 hover:scale-105"
        >
          Subir Archivo
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

