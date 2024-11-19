import React, { useEffect, useState } from "react";
import UploadFile from "./UploadFile"; // Importamos el componente UploadFile
import { addresses, abis } from "../contracts"; // Contratos
import { ethers } from "ethers";
import axios from 'axios';

// Proveedor de Ethereum
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

// Instancia del contrato en Ethereum
const registroContract = new ethers.Contract(
  addresses.ipfs, // Dirección del contrato de registro
  abis.ipfs,      // ABI del contrato de registro
  defaultProvider
);

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [archivos, setArchivos] = useState([]);
  const [archivosCount, setArchivosCount] = useState(0); // Contador de archivos con testArchivos
  const [isOwner, setIsOwner] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Funciones para navegar por las funcionalidades del dashboard
  const functionalities = [
    { title: "Subir Archivo", action: () => setIsModalOpen(true) },
    { title: "Ver Certificados", action: () => alert("Navegar a certificados") },
    { title: "Historial de Transferencias", action: () => alert("Navegar a transferencias") },
    { title: "Verificar Propiedad", action: () => alert("Navegar a verificar") },
    { title: "Historial de Disputas", action: () => alert("Navegar a disputas") },
  ];

  useEffect(() => {
    buscarArchivos();
    obtenerTestArchivos();
  }, []);

  const buscarArchivos = async () => {
    try {
      setLoading(true);
      const signer = await defaultProvider.getSigner();
      const address = await signer.getAddress();
      const archivos = await registroContract.obtenerArchivos(address);
      console.log(archivos);

      const archivosProcesados = archivos.map((archivo) => ({
        titulo: archivo[0],
        descripcion: archivo[1],
        hash: archivo[2],
        tiempo: archivo[3].toString(), // Convertir BigNumber a string
      }));

      setArchivos(archivosProcesados);
      console.log("Archivos procesados:", archivosProcesados);
    } catch (error) {
      console.error("Error al obtener los archivos:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTestArchivos = async () => {
    try {
      const signer = await defaultProvider.getSigner();
      const address = await signer.getAddress();
      console.log(address)
      const totalArchivos = await registroContract.archivosCount(address);
      setArchivosCount(totalArchivos.toNumber());
    } catch (error) {
      console.error("Error al obtener el número total de archivos:", error);
    }
  };

  const obtenerArchivoDeIPFS = async (hash) => {
    try {
      const ipfsURL = `https://ipfs.io/ipfs/${hash}`;
      const response = await axios.get(ipfsURL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener archivo: ', error.message);
      setErrorMessage('No se pudo obtener el archivo desde IPFS.');
    }
  };

  const chequearPropietario = async (tokenId) => {
    try {
      const signer = await defaultProvider.getSigner();
      const address = await signer.getAddress();

      const esMio = await registroContract.verifyMyProperty(tokenId);
      setIsOwner(esMio);

      if (!esMio) {
        setErrorMessage('Acceso denegado.');
      } else {
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error al verificar la propiedad:', error.message);
      setErrorMessage('Hubo un error al verificar la propiedad.');
    }
  };

  const handleFileClick = async (file) => {
    setSelectedFile(file);
    chequearPropietario(file.tokenId);

    const datosArchivo = await obtenerArchivoDeIPFS(file.hash);
    console.log(datosArchivo);
  };

  const closeModal = () => setIsModalOpen(false);

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

      {/* Contenedor de Archivos */}
      <div className="w-1/4 p-4 bg-gray-800 text-white">
        <h2 className="text-xl font-light mb-4">Archivos del actual propietario</h2>
        <p className="text-sm mb-4">
          Total de archivos registrados: <span className="font-bold text-teal-400">{archivosCount}</span>
        </p>
        <div>
          {loading ? (
            <p>Cargando archivos...</p>
          ) : archivos.length === 0 ? (
            <p>No tienes archivos registrados.</p>
          ) : (
            <ul>
              {archivos.map((archivo, index) => (
                <li
                  key={index}
                  className="mb-2 cursor-pointer hover:bg-gray-700 p-2 rounded"
                  onClick={() => handleFileClick(archivo)}
                >
                  {archivo.titulo}
                </li>
              ))}
            </ul>
          )}
        </div>
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
