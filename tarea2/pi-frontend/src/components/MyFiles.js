import React, { useEffect, useState } from "react";
import { addresses, abis } from "../contracts"; // Contratos
import { ethers } from "ethers";
import axios from "axios";

// Proveedor de Ethereum
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

// Instancia del contrato en Ethereum
const registroContract = new ethers.Contract(
    addresses.ipfs,
    abis.ipfs,
    defaultProvider
);

function MyFiles() {
    const [archivos, setArchivos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [totalArchivos, setTotalArchivos] = useState(0); // Guardar el número total de archivos

    useEffect(() => {
        fetchArchivos();
    }, []);

    // Obtener los archivos desde el contrato utilizando `registryCertificate`
    const fetchArchivos = async () => {
        try {
            setLoading(true);
            const signer = await defaultProvider.getSigner();
            const address = await signer.getAddress();

            // Verifica que la dirección esté correctamente obtenida
            console.log("Dirección del propietario: ", address);

            // Obtener el total de archivos para la dirección
            const totalArchivosCount = await registroContract.archivosCount(address);
            setTotalArchivos(totalArchivosCount.toNumber());
            console.log("Total de archivos registrados: ", totalArchivosCount.toString());

            // Si no hay archivos, muestra un mensaje adecuado
            if (totalArchivosCount.toNumber() === 0) {
                setErrorMessage("No tienes archivos subidos.");
                return;
            }

            // Iteramos sobre los archivos registrados y usamos registryCertificate
            const archivosData = [];
            for (let i = 0; i < totalArchivosCount.toNumber(); i++) {
                const [titulo, descripcion, hash, tiempo] = await registroContract.registryCertificate(address, i);
                archivosData.push({ titulo, descripcion, hash, tiempo });
            }

            setArchivos(archivosData);
        } catch (error) {
            console.error("Error al obtener los archivos:", error);
            setErrorMessage(`Hubo un problema al cargar tus archivos: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Obtener contenido del archivo desde IPFS
    const obtenerArchivoDeIPFS = async (hash) => {
        try {
            const ipfsURL = `https://ipfs.io/ipfs/${hash}`;
            const response = await axios.get(ipfsURL);
            return response.data;
        } catch (error) {
            console.error("Error al obtener archivo de IPFS:", error.message);
            setErrorMessage("No se pudo obtener el archivo desde IPFS.");
        }
    };

    // Visualizar el archivo al hacer clic
    const handleFileClick = async (archivo) => {
        const datosArchivo = await obtenerArchivoDeIPFS(archivo.hash);
        console.log(datosArchivo);
    };

    return (
        <div className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center relative font-sans">
            <h1 className="text-4xl text-white font-bold mb-10">Mis Archivos Subidos</h1>
            {errorMessage && <p className="text-red-600">{errorMessage}</p>}
            <div className="w-1/4 p-4 bg-gray-800 text-white">
                {loading ? (
                    <p>Cargando tus archivos...</p>
                ) : totalArchivos === 0 ? (
                    <p>No tienes archivos subidos.</p>
                ) : (
                    <div>
                        <p className="mb-4">Total de archivos subidos: {totalArchivos}</p>
                        <ul>
                            {archivos.map((archivo, index) => (
                                <li
                                    key={index}
                                    className="cursor-pointer p-3 mb-4 bg-teal-700 rounded hover:bg-teal-600"
                                    onClick={() => handleFileClick(archivo)}
                                >
                                    <h3 className="font-bold text-lg">{archivo.titulo}</h3>
                                    <p className="text-sm">{archivo.descripcion}</p>
                                    <p className="text-xs text-gray-300 mt-2">
                                        Subido: {new Date(parseInt(archivo.tiempo) * 1000).toLocaleString()}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyFiles;
