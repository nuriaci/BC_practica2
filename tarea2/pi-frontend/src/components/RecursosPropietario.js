import React, { useState } from "react";
import { ethers } from "ethers";
import { addresses, abis } from "../contracts";
import { ArrowsRightLeftIcon, CheckCircleIcon, XCircleIcon, DocumentMagnifyingGlassIcon, FingerPrintIcon, ClockIcon } from '@heroicons/react/24/outline';

// Proveedor de Ethereum
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

// Instancia del contrato en Ethereum
const propietarioContract = new ethers.Contract(
  addresses.ipfs,
  abis.ipfs,
  defaultProvider
);

function RecursosPropietario({ closeModal }) {
  const [activeOption, setActiveOption] = useState(null);
  const [nuevoPropietario, setNuevoPropietario] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const functionalities = [
    { title: "Transferir propiedad", action: () => setActiveOption("transferir") , icon: <ArrowsRightLeftIcon className="w-8 h-8" /> },
    { title: "Proporcionar acceso", action: () => setActiveOption("acceso") , icon: <CheckCircleIcon className="w-8 h-8" /> },
    { title: "Revocar acceso", action: () => setActiveOption("revocar") , icon: <XCircleIcon className="w-8 h-8" /> },
    { title: "Consultar certificado", action: () => setActiveOption("consultar") , icon: <DocumentMagnifyingGlassIcon className="w-8 h-8" /> },
    { title: "Auditar archivo", action: () => setActiveOption("auditar") , icon: <FingerPrintIcon className="w-8 h-8" /> },
    { title: "Dar licencia temporal", action: () => setActiveOption("licencia") , icon: <ClockIcon className="w-8 h-8" /> },
  ];

  const transferirPropiedad = async (e) => {
    e.preventDefault();

    if (!nuevoPropietario || !tokenId) {
        return;
    }

    setErrorMessage("");
    try {
        const signer = defaultProvider.getSigner();
        const contratoConSigner = propietarioContract.connect(signer);

        const tx = await contratoConSigner.transferProperty(
            nuevoPropietario,
            tokenId
        );
        await tx.wait();


    } catch (error){
      console.error("Error al transferir la propiedad:", error.message);
    }
  }

  const renderOptionContent = () => {
    switch (activeOption) {
      case "transferir":
        return (<>
        <form onSubmit={transferirPropiedad}>
            <input
                type="text"
                placeholder="Dirección del nuevo propietario"
                value={nuevoPropietario}
                onChange={(e) => setNuevoPropietario(e.target.value)}
                className="block w-full text-sm bg-gray-800 text-white p-2 mt-4 rounded"
                required />
            <textarea
                placeholder="Token ID"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="block w-full text-sm bg-gray-800 text-white p-2 mt-2 rounded"
                required />
            <button
                type="submit"
                className="bg-teal-500 hover:bg-teal-600 text-white mt-4 py-2 px-4 rounded w-full"
            >
                {"probar"}
            </button>
        </form></>);
      case "acceso":
        return <div>Contenido para Proporcionar acceso</div>;
      case "revocar":
        return <div>Contenido para Revocar acceso</div>;
      case "consultar":
        return <div>Contenido para Consultar certificado</div>;
      case "auditar":
        return <div>Contenido para Auditar archivo</div>;
      case "licencia":
        return <div>Contenido para Dar licencia temporal</div>;
      default:
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
             <button
                onClick={closeModal}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-lg"
                >
                &times;
            </button>
            {functionalities.map((func, index) => (
              <div
                key={index}
                onClick={func.action}
                className="flex flex-col items-center justify-center w-full h-32 bg-gradient-to-r from-teal-600 to-teal-800 rounded-lg shadow-lg text-center cursor-pointer hover:scale-105 transform transition-all duration-300"
              >
                <div className="text-3xl mb-2">{func.icon}</div>
                <h2 className="text-sm sm:text-md font-light text-white">{func.title}</h2>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-cover bg-center bg-opacity-70 bg-gradient-to-br text-white rounded-lg shadow-lg p-6 sm:p-8 w-full sm:w-auto max-w-lg relative transform transition-all duration-300 scale-95 hover:scale-100">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-lg"
        >
          &times;
        </button>
        {activeOption && (
          <button
            onClick={() => setActiveOption(null)}  // Reset to main menu
            className="absolute top-2 left-2 text-gray-200 hover:text-white text-xl transition-all"
          >
            &larr; {/* Left arrow for going back */}
          </button>
        )}
        <h2 className="text-2xl font-semibold mb-4 text-center">{activeOption ? "Detalle de opción" : "Opciones para el propietario"}</h2>
        {renderOptionContent()}
      </div>
    </div>
  );
}

export default RecursosPropietario;
