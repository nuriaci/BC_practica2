import React, { useEffect, useState } from "react";
import { create } from "kubo-rpc-client";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import { addresses, abis } from "../contracts"; // Contratos

const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);
const signer = await defaultProvider.getSigner();
const ipfsContract = new ethers.Contract(addresses.ipfs, abis.ipfs, signer);

async function registerFile(hash, title, description) {
  const signer = await defaultProvider.getSigner();
  const ipfsWithSigner = ipfsContract.connect(signer);
  const tx = await ipfsWithSigner.registro(hash, title, description);
  console.log("Transaction:", tx);
  await tx.wait();  // Esperar a que la transacción sea confirmada
  console.log("Transaction confirmed!");
}

function UploadFile() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ipfsHash, setIpfsHash] = useState("");
  const [loading, setLoading] = useState(false);  // Estado de carga
  const navigate = useNavigate(); // Hook para redirigir a otra página

  useEffect(() => {
    window.ethereum.enable(); // Habilitar conexión con MetaMask
  }, []);

  // Manejar la carga del archivo
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);  // Activar el estado de carga

      let client = await create("/ip4/127.0.0.1/tcp/5002"); // Conectar al nodo IPFS local
      const result = await client.add(file); // Agregar archivo a IPFS
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`); // Copiar archivo al sistema de archivos de IPFS
      console.log(result.cid);

      // Registrar archivo en Ethereum
      await registerFile(result.cid.toString(), title, description);

      // Establecer el hash de IPFS
      setIpfsHash(result.cid.toString());

    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false); // Desactivar el estado de carga

      // Redirigir al Dashboard después de la transacción
      navigate("/"); // Asegúrate de que esta línea se ejecuta al final, para evitar redirecciones prematuras
    }
  };

  // Leer archivo y convertirlo en buffer
  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    reader.onloadend = () => {
      setFile(Buffer(reader.result));
    };
    e.preventDefault();
  };

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
        Subir Archivo a IPFS y Registrar en Ethereum
      </h1>

      <div className="relative w-1/4 p-4 bg-gray-800 text-white rounded-lg shadow-lg z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="file"
            name="data"
            onChange={retrieveFile}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
          />
          <div>
            <label className="text-sm font-medium" htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={loading} // Desactivar el botón si está cargando
            className={`w-full py-3 ${loading ? 'bg-gray-500' : 'bg-teal-600'} text-white font-semibold rounded-lg transition transform hover:bg-teal-500 hover:scale-105`}
          >
            {loading ? 'Subiendo...' : 'Upload and Register'}
          </button>
        </form>
        {ipfsHash && (
          <div className="mt-4">
            <p>Archivo subido a IPFS con el hash:</p>
            <p className="font-semibold text-teal-400">{ipfsHash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadFile;
