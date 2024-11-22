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
    mapping(address => bool) public direccionesRegistradas;
    mapping(address => Archivo[]) private _archivos;
    mapping(uint256 => Transferencia[]) private _historialTransferencias;
    mapping(uint256 => Disputa[]) private _historialDisputas;

    mapping(uint256 => mapping(address => bool)) private _accessList;
    mapping(uint256 => mapping(address => uint256)) private _licenciasTemporales;

    event RegistroRealizado(address indexed propietario, string hash_ipfs, string titulo, uint256 fecha, uint256 tokenId);
    event TransferenciaPropiedad(address indexed antiguoPropietario, address indexed nuevoPropietario, uint256 tokenId, uint256 fecha);
    event DisputaRegistrada(address indexed reportante, address indexed propietario, uint256 tokenId, string motivo, uint256 fecha);

    constructor() ERC721("PropiedadIntelectualNFT", "PI_NFT") {}

    /* ===== Registro de Propiedad ===== */
    function registro(string calldata hash_ipfs, string calldata titulo, string calldata descripcion) external {
        require(bytes(hash_ipfs).length > 0, "Hash invalido");
        require(bytes(titulo).length > 0, "Titulo invalido");
        require(bytes(descripcion).length > 0, "Descripcion invalida");

        uint256 tokenId = ++_tokenIdCounter; // Incrementa y asigna ID único
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", hash_ipfs)));

        _archivos[msg.sender].push(Archivo(titulo, descripcion, hash_ipfs, block.timestamp, tokenId));

        if (!direccionesRegistradas[msg.sender]) {
            direccionesRegistradas[msg.sender] = true;
            propietarios.push(msg.sender);
        }

        emit RegistroRealizado(msg.sender, hash_ipfs, titulo, block.timestamp, tokenId);
    }

    /* ===== Control de Acceso ===== */
    function accesoNFT(uint256 tokenId, address usuario) external {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede otorgar acceso");
        _accessList[tokenId][usuario] = true;
    }

    function comprobarAcceso(uint256 tokenId, address usuario) external view returns (bool) {
        return ownerOf(tokenId) == usuario || _accessList[tokenId][usuario];
    }

    function revocarAcceso(uint256 tokenId, address usuario) external {
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
    function darLicenciaTemporal(uint256 tokenId, address usuario, uint256 duracionLicencia) external {
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede dar acceso limitado");
        _licenciasTemporales[tokenId][usuario] = block.timestamp + duracionLicencia;
        _accessList[tokenId][usuario] = true;
    }

    function verificarLicenciaTemporal(uint256 tokenId, address usuario) external returns (bool) {
        if (_accessList[tokenId][usuario] && block.timestamp < _licenciasTemporales[tokenId][usuario]) {
            return true;
        }
        _accessList[tokenId][usuario] = false;
        return false;
    }

    /* ===== Transferencia de Propiedad ===== */
    function transferProperty(address nuevoPropietario, uint256 tokenId) external {
        require(nuevoPropietario != address(0), "Direccion invalida");
        require(ownerOf(tokenId) == msg.sender, "Solo el propietario puede transferir");

        _historialTransferencias[tokenId].push(Transferencia(msg.sender, nuevoPropietario, block.timestamp));
        safeTransferFrom(msg.sender, nuevoPropietario, tokenId);

        if (!direccionesRegistradas[nuevoPropietario]) {
            direccionesRegistradas[nuevoPropietario] = true;
            propietarios.push(nuevoPropietario);
        }

        emit TransferenciaPropiedad(msg.sender, nuevoPropietario, tokenId, block.timestamp);
    }

    function transferHistory(uint256 tokenId) external view returns (Transferencia[] memory) {
        return _historialTransferencias[tokenId];
    }

    /* ===== Auditoría y Certificación ===== */
    function registryCertificate(address propietario, string calldata hashActual)
        external
        view
        returns (string memory titulo, string memory descripcion, string memory hash, uint256 tiempo)
    {
        Archivo[] storage archivosPropietario = _archivos[propietario];
        for (uint256 i = 0; i < archivosPropietario.length; i++) {
            Archivo storage archivo = archivosPropietario[i];
            if (keccak256(abi.encodePacked(archivo.hash)) == keccak256(abi.encodePacked(hashActual))) {
                return (archivo.titulo, archivo.descripcion, archivo.hash, archivo.tiempo);
            }
        }
        revert("Archivo no encontrado");
    }

    function fileAudit(address propietario, string calldata hashActual) external view returns (bool) {
        require(msg.sender == propietario, "Solo el propietario puede auditar este archivo");
        Archivo[] storage archivosPropietario = _archivos[propietario];
        for (uint256 i = 0; i < archivosPropietario.length; i++) {
            if (keccak256(abi.encodePacked(archivosPropietario[i].hash)) == keccak256(abi.encodePacked(hashActual))) {
                return true;
            }
        }
        return false;
    }

    /* ===== Gestión de Disputas ===== */
    function registrarDisputa(uint256 tokenId, string calldata motivoDenuncia) external {
        address propietario = ownerOf(tokenId);
        require(propietario != address(0), "Token sin propietario");

        _historialDisputas[tokenId].push(Disputa(msg.sender, motivoDenuncia, block.timestamp));
        emit DisputaRegistrada(msg.sender, propietario, tokenId, motivoDenuncia, block.timestamp);
    }

    function verDisputas(uint256 tokenId) external view returns (Disputa[] memory) {
        return _historialDisputas[tokenId];
    }

    /* ===== Listado de Archivos ===== */
    function listarArchivos(address propietario) external view returns (Archivo[] memory) {
        return _archivos[propietario];
    }

    function listarTodosArchivos() external view returns (Archivo[] memory) {
        uint256 totalArchivos;
        for (uint256 i = 0; i < propietarios.length; i++) {
            totalArchivos += _archivos[propietarios[i]].length;
        }

        Archivo[] memory allArchives = new Archivo[](totalArchivos);
        uint256 index;
        for (uint256 i = 0; i < propietarios.length; i++) {
            Archivo[] storage archivosProp = _archivos[propietarios[i]];
            for (uint256 j = 0; j < archivosProp.length; j++) {
                allArchives[index++] = archivosProp[j];
            }
        }
        return allArchives;
    }
}