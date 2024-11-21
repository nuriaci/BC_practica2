// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import "./openzeppelin-contracts/token/ERC721/ERC721.sol";
import "./openzeppelin-contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract PropiedadIntelectual is ERC721URIStorage {
    struct Archivo {
        string titulo;
        string descripcion;
        string hash;
        uint256 tiempo;
        uint256 tokenId;
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

    uint256 private _tokenIdCounter;
    address[] public propietarios;
    mapping(address => bool) public direccionesRegistradas; // Optimización: mapping para evitar iterar
    mapping(address => Archivo[]) public archivos;
    mapping(uint256 => Transferencia[]) public historialTransferencias;
    mapping(uint256 => Disputa[]) public historialDisputas;

    // Control de acceso
    mapping(uint256 => mapping(address => bool)) private _accessList;
    mapping(uint256 => mapping(address => uint)) private _licenciasTemporales;

    // Eventos
    event RegistroRealizado(address propietario, string hash_ipfs, string titulo, uint fecha, uint256 tokenId);
    event TransferenciaPropiedad(address indexed antiguoPropietario, address indexed nuevoPropietario, uint256 tokenId, uint fecha);
    event DisputaRegistrada(address indexed reportante, address indexed propietario, uint256 tokenId, string motivo, uint fecha);

    constructor() ERC721("PropiedadIntelectualNFT", "PI_NFT") {
    }

    /* ===== Registro de Propiedad ===== */
    function registro(string memory hash_ipfs, string memory titulo, string memory descripcion) public {
        require(bytes(hash_ipfs).length > 0, "La longitud del hash es incorrecta");
        require(bytes(titulo).length > 0, "La longitud del titulo es incorrecta");
        require(bytes(descripcion).length > 0, "La longitud de la descripcion es incorrecta");

        string memory uri = string(abi.encodePacked("ipfs://", hash_ipfs)); //Se genera la uri
        // Generar NFT 
        _tokenIdCounter++; // Incrementa el contador para obtener un nuevo ID de token
        uint256 tokenId = _tokenIdCounter; // Obtiene el valor actual del contador como nuevo ID
        _safeMint(msg.sender, tokenId); //Crea un NFT y lo asigna al propietario
        _setTokenURI(tokenId, uri);//Asigna un URI (identificador de recursos) al token
        
        // Crear archivo y registrar
        Archivo memory nuevoArchivo = Archivo(titulo, descripcion, hash_ipfs, block.timestamp, tokenId);
        archivos[msg.sender].push(nuevoArchivo);

        if (!direccionesRegistradas[msg.sender]) {
            direccionesRegistradas[msg.sender] = true;
            propietarios.push(msg.sender); 
        }

        emit RegistroRealizado(msg.sender, hash_ipfs, titulo, block.timestamp, tokenId);//Se emite el evento de registro realizado
    }

    /* ===== Control de Acceso ===== */
    function accesoNFT(uint256 tokenId, address usuario) public {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede otorgar acceso");
        _accessList[tokenId][usuario] = true; //Otorga permisos de visualizacion
    }

    function comprobarAcceso(uint256 tokenId, address usuario) public view returns (bool) {
        if (ownerOf(tokenId) == usuario) {
            return true; // El propietario siempre tiene acceso
        }
        return _accessList[tokenId][usuario];
    }

    function revocarAcceso(uint256 tokenId, address usuario) public {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede revocar el acceso");
        _accessList[tokenId][usuario] = false;
    }

    function verifyProperty(uint256 tokenId, address usuario) public view returns (bool) {
        return ownerOf(tokenId) == usuario;
    }

    function verifyMyProperty(uint256 tokenId) public view returns (bool){
        return ownerOf(tokenId) == msg.sender;    
    }

    /* ===== Licencias Temporales ===== */
    function darLicenciaTemporal(uint256 tokenId, address usuario, uint256 duracionLicencia) public {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede dar acceso limitado");
        _licenciasTemporales[tokenId][usuario] = block.timestamp + duracionLicencia; //Se almacena la expiracion de la licencia temporal
        _accessList[tokenId][usuario] = true; //Otorga permisos de visualizacion
    }

    function verificarLicenciaTemporal(uint256 tokenId, address usuario) public returns (bool) {
        if (_accessList[tokenId][usuario] && block.timestamp < _licenciasTemporales[tokenId][usuario]) {
            return true;
        } else {
            _accessList[tokenId][usuario] = false; // Revoca acceso automáticamente si expiró
            return false;
        }
    }

    /* ===== Transferencia de Propiedad ===== */
    function transferProperty(address nuevoPropietario, uint256 tokenId) public {
        require(nuevoPropietario != address(0), "El nuevo propietario no puede ser la direccion cero");
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario actual puede transferir la propiedad");

        // Registrar la transferencia
        historialTransferencias[tokenId].push(Transferencia({
            antiguoPropietario: msg.sender,
            nuevoPropietario: nuevoPropietario,
            fecha: block.timestamp
        }));

        // Transferir el NFT
        safeTransferFrom(msg.sender, nuevoPropietario, tokenId);
        if (!direccionesRegistradas[nuevoPropietario]) {
            direccionesRegistradas[nuevoPropietario] = true;
            propietarios.push(nuevoPropietario); 
        }

        emit TransferenciaPropiedad(msg.sender, nuevoPropietario, tokenId, block.timestamp);
    }

    function transferHistory(uint256 tokenId) public view returns (Transferencia[] memory) {
        return historialTransferencias[tokenId];
    }

    /* ===== Auditoría y Certificación ===== */
    function registryCertificate(address propietario, uint fileIndex) public view returns (string memory titulo, string memory descripcion, string memory hash, uint tiempo) {
        require(msg.sender == propietario, "Solo el propietario puede consultar el certificado");
        require(fileIndex < archivos[propietario].length, "Indice fuera de rango");
        Archivo storage archivo = archivos[propietario][fileIndex];
        return (archivo.titulo, archivo.descripcion, archivo.hash, archivo.tiempo);
    }

    function fileAudit(address propietario, uint fileIndex, string memory hashActual) public view returns (bool) {
        require(msg.sender == propietario, "Solo el propietario puede auditar este archivo");
        require(fileIndex < archivos[propietario].length, "Indice fuera de rango");
        Archivo storage archivo = archivos[propietario][fileIndex];
        return keccak256(abi.encodePacked(archivo.hash)) == keccak256(abi.encodePacked(hashActual));
    }

    /* ===== Gestión de Disputas ===== */
    function registrarDisputa(uint256 tokenId, string memory motivoDenuncia) public {
        address propietario = ownerOf(tokenId);
        require(propietario != address(0), "El token no tiene un propietario.");

        historialDisputas[tokenId].push(Disputa({
            denunciante: msg.sender,
            motivo: motivoDenuncia,
            fecha: block.timestamp
        }));

        emit DisputaRegistrada(msg.sender, propietario, tokenId, motivoDenuncia, block.timestamp);
    }

    function verDisputas(uint256 tokenId) public view returns (Disputa[] memory) {
        return historialDisputas[tokenId];
    }

    /* ===== Listado de Archivos ===== */
    function listarArchivos(address propietario) public view returns (Archivo[] memory) {
        uint256 count = archivos[propietario].length;
        require(count > 0, "El propietario no tiene archivos registrados");

        return archivos[propietario];
    }

    function listarTodosArchivos() public view returns (Archivo[] memory){
        uint totalArchivos;

        for(uint i=0;i<propietarios.length;i++){
            totalArchivos+=archivos[propietarios[i]].length;
        }

        Archivo[] memory allArchives = new Archivo[](totalArchivos);
        uint256 index = 0;
        for ( uint i=0 ; i < propietarios.length; i++) {
            for(uint j= 0;j<archivos[propietarios[i]].length;j++){
                allArchives[index+j] = archivos[propietarios[i]][j];
            }
        }
        
        return allArchives;
    }
}
