import React, { useEffect, useState } from "react";
import UploadFile from "./UploadFile";
import RegistrarDisputa from "./RegistrarDisputa";
import VisualizarDisputas from "./VisualizarDisputas";
import RecursosPropietario from "./RecursosPropietario";
import { addresses, abis } from "../contracts";
import { ethers } from "ethers";
import axios from 'axios';
import { CloudArrowUpIcon, DocumentTextIcon, ListBulletIcon, MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';
import HistorialTransferencias from "./HistorialTransferencias";

// Proveedor de Ethereum
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

// Instancia del contrato en Ethereum
const registroContract = new ethers.Contract(
  addresses.ipfs, // Dirección del contrato
  abis.ipfs,      // ABI del contrato
  defaultProvider
);

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // Nuevo estado para controlar el tipo de modal
  const [archivos, setArchivos] = useState([]);
  const [archivosCount, setArchivosCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Funciones para navegar por las funcionalidades del dashboard
  const functionalities = [
    { title: "Subir Archivo", action: () => openModal("upload"), icon: <CloudArrowUpIcon className="w-8 h-8" /> },
    { title: "Registrar disputas", action: () => openModal("registrarDisputa"), icon: <DocumentTextIcon className="w-8 h-8" /> },
    { title: "Historial de Transferencias", action: () => openModal("historialTransferencias"), icon: <ListBulletIcon className="w-8 h-8" /> },
    { title: "Visualizar disputas", action: () => openModal("visualizarDisputas"), icon: <MagnifyingGlassCircleIcon className="w-8 h-8" /> },
  ];

  const openModal = (type) => {
    setModalType(type); // Establecer el tipo de modal
    setIsModalOpen(true); // Abrir el modal
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType(""); // Resetear el tipo de modal al cerrarlo
  };

  useEffect(() => {
    buscarArchivos();
  }, []);

  const buscarArchivos = async () => {
    try {
      setLoading(true);
      const signer = await defaultProvider.getSigner();
      const address = await signer.getAddress();
      const archivos = await registroContract.listarTodosArchivos();
      setArchivosCount(archivos.length);
      const archivosProcesados = archivos.map((archivo) => ({
        titulo: archivo[0],
        descripcion: archivo[1],
        hash: archivo[2],
        fecha: Number(archivo[3]),
        tokenId: Number(archivo[4])
      }));

      setArchivos(archivosProcesados);
    } catch (error) {
      console.error("Error al obtener los archivos:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerArchivoDeIPFS = async (hash) => {
    try {
      const ipfsURL = `http://127.0.0.1:8080/ipfs/${hash}`;
      const response = await axios.get(ipfsURL);
      return response.data;
    } catch (error) {
      console.error('Error al obtener archivo: ', error.message);
      setErrorMessage('No se pudo obtener el archivo desde IPFS.');
    }
  };

  const handleFileClick = async (file) => {
    console.log("Archivo seleccionado:", file);
    console.log("Hash:", file.hash);
    console.log("Token ID:", file.tokenId);

    try {
      const signer = await defaultProvider.getSigner();
      const address = await signer.getAddress();

      // Verificar si el archivo pertenece al usuario
      const esPropietario = await registroContract.verifyMyProperty(file.tokenId);
      console.log(file.tokenId)

      // Verificar si el usuario tiene permisos (propietario o compartido)
      const tieneAcceso = esPropietario || (await registroContract.comprobarAcceso(file.tokenId, address));

      if (!tieneAcceso) {
        setErrorMessage('No tienes acceso a este archivo.');
        return;
      }

      // Descargar archivo desde IPFS
      openModal("recursosPropietario")
      setSelectedFile(file); // Actualizar archivo seleccionado
      setErrorMessage(''); // Limpiar mensaje de error
    } catch (error) {
      console.error('Error al procesar el archivo:', error.message);
      setErrorMessage('Hubo un problema al acceder al archivo.');
    }
  };


  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col sm:flex-row items-center sm:items-start justify-between relative font-sans transition-all duration-300"
      style={{
        backgroundImage: "url('https://wallpapers.com/images/hd/minimalist-blockchain-illustration-sq1y4w1fh5vt0dp2.jpg')",
      }}
    >
      {/* Fondo oscuro general */}
      <div className="bg-black bg-opacity-50 w-full h-full absolute top-0 left-0"></div>

      {/* Opciones principales (3/4 del espacio) */}
      <div className="relative z-10 flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-start w-full sm:w-3/4 p-6 gap-6">
        {functionalities.map((func, index) => (
          <div
            key={index}
            onClick={func.action}
            className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg shadow-lg text-center flex flex-col items-center justify-center cursor-pointer hover:scale-110 transform transition-all duration-300 group"
          >
            <div className="text-white text-4xl mb-2">
              {func.icon} {/* Ícono dinámico */}
            </div>
            <h2 className="text-sm sm:text-md font-semibold text-white group-hover:text-gray-100">{func.title}</h2>
          </div>
        ))}
      </div>

      {/* Listado de archivos (1/4 del espacio, largo completo) */}
      <div className="relative z-10 w-full sm:w-1/4 bg-gray-900 bg-opacity-70 p-4 sm:p-6 text-white min-h-screen flex flex-col">
        <h2 className="text-lg font-light mb-4">Archivos registrados</h2>
        <p className="text-sm mb-4">
          Total de archivos registrados: <span className="font-bold text-teal-400">{archivosCount}</span>
        </p>
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <p>Cargando archivos...</p>
          ) : archivos.length === 0 ? (
            <p>No tienes archivos registrados.</p>
          ) : (
            <ul className="space-y-4">
              {archivos.map((archivo, index) => (
                <li
                  key={index}
                  className="bg-gray-800 p-3 rounded-md shadow-md hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => handleFileClick(archivo)}
                >
                  <h3 className="text-md font-bold">{archivo.titulo}</h3>
                  <p className="text-sm text-gray-300">{archivo.descripcion}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Fecha de subida: {archivo.fecha ? new Date(archivo.fecha * 1000).toLocaleString() : 'Fecha no disponible'}
                    <p className="text-xs text-gray-500 mt-2"></p>
                    TokenId: {archivo.tokenId}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>


      {/* Modal de Subir Archivo */}
      {isModalOpen && modalType === "upload" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative max-w-lg mx-auto">
            <UploadFile closeModal={closeModal} />
          </div>
        </div>
      )}

      {/* Modal de Registrar Disputa */}
      {isModalOpen && modalType === "registrarDisputa" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative max-w-lg mx-auto">
            <RegistrarDisputa closeModal={closeModal} />
          </div>
        </div>
      )}

      {/* Modal de Visualizar Disputas */}
      {isModalOpen && modalType === "visualizarDisputas" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative max-w-lg mx-auto">
            <VisualizarDisputas closeModal={closeModal} />
          </div>
        </div>
      )}

      {/* Modal de Recursos Propietario */}
      {isModalOpen && modalType === "recursosPropietario" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative max-w-lg mx-auto">
            <RecursosPropietario closeModal={closeModal} />
          </div>
        </div>
      )}
      {/* Modal de Historial Transferencias */}
      {isModalOpen && modalType === "historialTransferencias" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative max-w-lg mx-auto">
            <HistorialTransferencias closeModal={closeModal} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
