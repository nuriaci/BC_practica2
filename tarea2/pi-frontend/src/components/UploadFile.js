import React, { useState } from "react";
import { create } from "kubo-rpc-client"; // Cliente IPFS de Kubo
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { addresses, abis } from "../contracts"; // Contratos

// Constantes globales
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";

// Proveedor de Ethereum
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

// Instancia del contrato en Ethereum
const registroContract = new ethers.Contract(
  addresses.ipfs, // Dirección del contrato de registro
  abis.ipfs,      // ABI del contrato de registro
  defaultProvider
);

function UploadFile({ closeModal }) {
  const [file, setFile] = useState(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [ipfsHash, setIpfsHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Leer y convertir el archivo seleccionado
  const retrieveFile = (e) => {
    const data = e.target.files[0];

    if (data && data instanceof Blob) {
      const reader = new window.FileReader();

      reader.onloadend = () => {
        setFile(Buffer(reader.result)); // Convertir el archivo en Buffer para IPFS
      };

      // Leer el archivo como ArrayBuffer
      reader.readAsArrayBuffer(data);
    } else {
      alert("Por favor selecciona un archivo válido.");
    }
    e.preventDefault();
  };

  // Verificar si el usuario tiene fondos suficientes para la transacción
  const checkSufficientGas = async () => {
    const signer = defaultProvider.getSigner();
    const balance = await signer.getBalance(); // Obtiene el balance de la cuenta

    // Estimar el gas para la transacción
    const tx = {
      from: await signer.getAddress(),
      to: addresses.ipfs,
      data: registroContract.interface.encodeFunctionData("registro", ["hash-placeholder", titulo, descripcion]),
    };

    try {
      const gasEstimate = await defaultProvider.estimateGas(tx);

      const gasCost = gasEstimate.mul(await defaultProvider.getGasPrice());
      if (balance.lt(gasCost)) {
        setErrorMessage("No tienes suficiente saldo para cubrir el gas de la transacción.");
        return false;
      }
    } catch (error) {
      console.error("Error al estimar el gas:", error);
      setErrorMessage("Hubo un problema al estimar el gas. Inténtalo nuevamente.");
      return false;
    }

    return true;
  };

  const registrarArchivo = async (hash, titulo, descripcion) => {
    try {
      const registroWithSigner = registroContract.connect(defaultProvider.getSigner());
      const tx = await registroWithSigner.registro(hash, titulo, descripcion);
      console.log("Transacción enviada:", tx);
      await tx.wait(); // Esperar la confirmación

      console.log("Transacción confirmada:", tx);
    } catch (error) {
      if (error.code === 4001) {
        // Rechazo de la transacción en MetaMask
        setErrorMessage("Transacción rechazada por el usuario.");
      } else {
        console.error("Error al interactuar con el contrato:", error.message);
        setErrorMessage("No se pudo registrar el archivo en Ethereum.");
      }
      throw new Error("No se pudo registrar el archivo en Ethereum.");
    }
  };

  // Subir archivo a IPFS y registrarlo en Ethereum
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !titulo || !descripcion) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(""); // Reiniciar mensajes de error

    try {
      // Verificar si el usuario tiene suficiente saldo para cubrir el gas
      const hasSufficientGas = await checkSufficientGas();
      if (!hasSufficientGas) {
        return; // Detener si no tiene suficiente gas
      }

      const client = await create("/ip4/127.0.0.1/tcp/5001"); // Cliente IPFS de Kubo
      const result = await client.add(file);

      // Añadir archivo al sistema de archivos del nodo local
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);

      // Registrar el hash IPFS, título y descripción en Ethereum
      await registrarArchivo(result.cid.toString(), titulo, descripcion);

      setIpfsHash(result.cid.toString());
      alert(`Archivo subido y registrado con éxito: ${result.cid.toString()}`);
      closeModal(); // Cerrar el modal después de subir el archivo
    } catch (error) {
      console.error("Error al subir el archivo:", error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-blue-gray-900 text-white rounded-lg shadow-lg p-8 w-96 relative">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-lg"
        >
          &times;
        </button>
        <h2 className="text-2xl font-light mb-4">Registrar Archivo</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600"
            onChange={retrieveFile}
          />
          <input
            type="text"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="block w-full text-sm bg-gray-800 text-white p-2 mt-4 rounded"
            required
          />
          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="block w-full text-sm bg-gray-800 text-white p-2 mt-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-600 text-white mt-4 py-2 px-4 rounded w-full"
          >
            {isUploading ? "Subiendo..." : "Registrar"}
          </button>
        </form>

        {/* Mensajes de éxito y error */}
        {ipfsHash && (
          <p className="mt-4 text-green-600">
            Archivo subido con éxito:{" "}
            <a
              href={`http://127.0.0.1:5001/ipfs/${ipfsHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-500"
            >
              {ipfsHash}
            </a>
          </p>
        )}
        {errorMessage && <p className="mt-4 text-red-600">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default UploadFile;
