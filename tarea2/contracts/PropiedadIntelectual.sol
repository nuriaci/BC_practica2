//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import "./openzeppelin-contracts/token/ERC721/ERC721.sol";
import "./openzeppelin-contracts/token/ERC721/extensions/ERC721URIStorage.sol";

//Un contrato - tipo ERC-721 que emite el NFT  (Gestion de NFTs)
/*Recompensas en NFT:  el sistema puede emitir un NFT como certificado digital cada vez que un usuario registre un archivo, permitiendo la tokenización de su propiedad intelectual.*/
contract PropiedadIntelectualNFT  is ERC721URIStorage {
    uint256 private _tokenIdCounter; // Variable -> cuenta
    
    // Almacena el permiso de acceso para cada tokenId
    mapping(uint256 => mapping(address => bool)) private _accessList;
    // Almacena la expiración de las licencias temporales
    mapping(uint256 => mapping(address => uint)) private _licenciasTemporales;

    constructor() ERC721("PropiedadIntelectualNFT", "PI_NFT") {
        _tokenIdCounter = 0;
    }
 
    // Función para emitir un nuevo NFT y asignarlo al propietario
    function emitirNFT(address propietario, string memory uri) public returns (uint256) {
        _tokenIdCounter++; // // Incrementa el contador para obtener un nuevo ID de token
        uint256 nuevoTokenId = _tokenIdCounter; // Obtiene el valor actual del contador como nuevo ID
        _safeMint(propietario, nuevoTokenId);//Crea un NFT y lo asigna al propietario
        _setTokenURI(nuevoTokenId, uri);//Asigna un URI (identificador de recursos) al token
        return nuevoTokenId;
    }
    /*Control de Acceso: Permite al propietario otorgar permisos de visualización a usuarios específicos sin ceder la propiedad. */
    function accesoNFT(uint256 tokenId, address usuario) public{
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede dar acceso");//Comprueba si es el propietario del archivo
        _accessList[tokenId][usuario] = true; //Otorga permisos de visualizacion
    }

     /*Comprueba el acceso: Verifica si un usuario tiene acceso al NFT*/
    function comprobarAcceso(uint256 tokenId, address usuario) public view returns (bool) {
        if (ownerOf(tokenId) == usuario) {//El propietario siempre tiene acceso
        return true;
        }
        return _accessList[tokenId][usuario];
    }

    // Revocar acceso: Permite al propietario revocar el acceso de un usuario
    function revocarAcceso(uint256 tokenId, address usuario) public {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede revocar el acceso");
        _accessList[tokenId][usuario] = false; // Revoca el permiso de acceso
    }

    // Verificar propiedad: permite al usuario verificar a quién le pertenece un recurso.
    function verifyProperty(uint256 tokenId, address usuario) public view returns (bool) {
        return ownerOf(tokenId) == usuario;
    }

    // Verificar si una propiedad es mío
    function verifyMyProperty(uint256 tokenId) public view returns (bool){
        return ownerOf(tokenId) == msg.sender;    
    }

    /*Licencias Temporales: Los propietarios pueden conceder licencias temporales para dar acceso limitado a sus archivos. La licencia se revoca automáticamente al vencer*/
    function tempLicense(uint256 tokenId, address usuario, uint duracionLicencia) public {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede dar acceso limitado");
        _licenciasTemporales[tokenId][usuario] = block.timestamp + duracionLicencia; //Se almacena la expiracion de la licencia temporal
        _accessList[tokenId][usuario] = true; //Otorga permisos de visualizacion
    }
    /*Comprobar si sigue vigente la licencia temporal*/
    function CheckTempLicense(uint256 tokenId, address usuario) public view returns (bool) {
        if (_accessList[tokenId][usuario] && block.timestamp < _licenciasTemporales[tokenId][usuario]) {
            return true;
        } else {
            return false;
        }
    }

}


contract PropiedadIntelectual{

    struct Archivo {
        string titulo;
        string descripcion;
        string hash;
        uint256 tiempo;
    }

    struct Transferencia {
        address antiguoPropietario;
        address nuevoPropietario;
        uint256 fecha;
    }

    struct Disputa {
        address denunciante;
        string motivo;
        uint256 fecha;
    }
    
    PropiedadIntelectualNFT public nftContract;

    mapping(address => Archivo[]) public archivos;
    mapping(uint256 => Transferencia[]) public historialTransferencias;
    mapping(uint256 => Disputa[]) public historialDisputas;

    // Eventos
    event registroRealizado(address propietario, string hash_ipfs, string titulo, uint fecha,uint256 tokenId);
    event TransferenciaPropiedad(address indexed antiguoPropietario, address indexed nuevoPropietario, uint256 tokenId, uint fecha);
    event DisputaRegistrada(address indexed reportante, address indexed propietario, uint256 tokenId, string motivo, uint fecha);
    event Debug(address message);

    constructor(address nftAddress) {
        nftContract = PropiedadIntelectualNFT(nftAddress); // Inicializa el contrato 
    }

    /*Registro de Propiedad: Los usuarios pueden registrar un archivo en IPFS, almacenando el hash en la blockchain junto con título, descripción y una marca de tiempo para demostrar la existencia de la obra.*/
    function registro (string memory hash_ipfs, string memory titulo, string memory descripcion) public {
        require(bytes(hash_ipfs).length > 0, "La longitud del hash es incorrecta");
        require(bytes(titulo).length > 0, "La longitud del titulo es incorrecta");
        require(bytes(descripcion).length > 0, "La longitud de la descripcion es incorrecta");

        Archivo memory nuevoArchivo = Archivo(titulo,descripcion,hash_ipfs,block.timestamp); //Se crea un nuevo archivo
        archivos[msg.sender].push(nuevoArchivo);
        string memory uri = string(abi.encodePacked("ipfs://", hash_ipfs));//Se genera la uri
        uint256 tokenId = nftContract.emitirNFT(msg.sender,uri);//emitir certificado digital
        
        emit registroRealizado(msg.sender,hash_ipfs,titulo,block.timestamp, tokenId);//Se emite el evento de registro realizado
    }


    /*Transferencia de Propiedad: Los propietarios pueden transferir sus derechos sobre un archivo a otro usuario, registrando la transacción en la blockchain.*/
    function transferProperty(address nuevoPropietario, uint256 tokenId) public {
        require(nuevoPropietario != address(0), "El nuevo propietario no puede ser la direccion cero");
        require(nftContract.ownerOf(tokenId) == msg.sender, "Solo el propietario actual puede transferir la propiedad");

        // Asegurar de que el contrato es aprobado para transferir el token
        nftContract.approve(address(this), tokenId);

        // Agregar la transferencia al historial
        historialTransferencias[tokenId].push(Transferencia({
            antiguoPropietario: msg.sender,
            nuevoPropietario: nuevoPropietario,
            fecha: block.timestamp
        }));

        nftContract.safeTransferFrom(msg.sender, nuevoPropietario, tokenId);
        
        emit TransferenciaPropiedad(msg.sender, nuevoPropietario, tokenId, block.timestamp);
    }

    // Función condecer licencia temporal a un archivo 
    function darLicenciasTemporales(uint256 tokenId, address usuario, uint256 duracionLicencia) public {
        nftContract.tempLicense(tokenId, usuario, duracionLicencia);
    }

    /*Certificación de Registro (Timestamp): Se puede consultar un “certificado” que incluye el hash, título, descripción y fecha de registro, como prueba de propiedad y autenticidad.*/
    function registryCertificate(address propietario, uint fileIndex) public view returns (string memory titulo, string memory descripcion, string memory hash, uint tiempo) {
        require(fileIndex < archivos[propietario].length, "Indice fuera de rango");

        Archivo storage archivo = archivos[propietario][fileIndex];
        return (archivo.titulo, archivo.descripcion, archivo.hash, archivo.tiempo);
    }

    /*Auditoría de Integridad de Archivos: Permite verificar que el archivo no ha cambiado desde su registro, comparando el hash almacenado con el hash actual.*/
    function fileAudit(address propietario, uint fileIndex, string memory hashActual) public view returns (bool) {
        require(fileIndex < archivos[propietario].length, "Indice fuera de rango");

        Archivo storage archivo = archivos[propietario][fileIndex];
        return keccak256(abi.encodePacked(archivo.hash)) == keccak256(abi.encodePacked(hashActual));
    }

    /*Historial de Transferencias: Mantiene un historial completo de todas las transferencias de propiedad realizadas para un archivo, útil para rastrear la cadena de propiedad.*/
    function transferHistory(uint256 tokenId) public view returns(Transferencia[] memory) {
        return historialTransferencias[tokenId];
    }

    /*Gestión de Disputas: Los usuarios pueden registrar disputas sobre derechos de autor, notificando al propietario y creando un registro público de la disputa.*/
    function registrarDisputa(uint256 tokenId, string memory motivoDenuncia) public {
        address propietario = nftContract.ownerOf(tokenId);
        require(propietario != address(0), "El token no tiene con propietario.");

        historialDisputas[tokenId].push(Disputa({denunciante: msg.sender, motivo: motivoDenuncia, fecha: block.timestamp}));

        emit DisputaRegistrada(msg.sender, propietario, tokenId, motivoDenuncia , block.timestamp);
    }

    function verDisputas(uint256 tokenId) public view returns (Disputa[] memory) {
            return historialDisputas[tokenId];
    }
}
