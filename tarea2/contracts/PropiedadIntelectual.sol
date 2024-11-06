//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;


contract PropiedadIntelectual{

    Struct Archivo{
        string titulo;
        string descripcion;
        string hash;
        uint tiempo;
    }

    mapping(address => Archivo[]) public archivos;

    // Eventos
    event registroRealizado(address propietario, string hash_ipfs, string titulo, uint fecha);
    

/*Registro de Propiedad: Los usuarios pueden registrar un archivo en IPFS, almacenando el hash en la blockchain junto con título, descripción y una marca de tiempo para demostrar la existencia de la obra.*/
function registro (string memory hash, string memory titulo, string memory descripcion) public {
    require(bytes(hash_ipfs).length > 0, "La longitud del hash es incorrecta");
    require(bytes(titulo).length > 0, "La longitud del titulo es incorrecta");
    require(bytes(descripcion).length > 0, "La longitud de la descripcion es incorrecta");

    Archivo nuevoArchivo = Archivo(titulo,descripcion,hash_ipfs,block.timestamp); //Se crea un nuevo archivo
    archivos[msg.sender].push(nuevoArchivo);

    emitirNft();//emitir certificado digital

    emit registroRealizado(msg.sender,hash_ipfs,titulo,block.timestamp);//Se emite el evento de registro realizado
}

/*Recompensas en NFT:  el sistema puede emitir un NFT como certificado digital cada vez que un usuario registre un archivo, permitiendo la tokenización de su propiedad intelectual.*/
function emitirNft (){

}

/*Transferencia de Propiedad: Los propietarios pueden transferir sus derechos sobre un archivo a otro usuario, registrando la transacción en la blockchain.*/

/*Control de Acceso: Permite al propietario otorgar permisos de visualización a usuarios específicos sin ceder la propiedad. */

/*Licencias Temporales: Los propietarios pueden conceder licencias temporales para dar acceso limitado a sus archivos. La licencia se revoca automáticamente al vencer*/

/*Verificación de Propiedad: Cualquier usuario puede verificar públicamente si una obra registrada pertenece a una dirección específica, como prueba de autoría.*/

/*Certificación de Registro (Timestamp): Se puede consultar un “certificado” que incluye el hash, título, descripción y fecha de registro, como prueba de propiedad y autenticidad.*/

/*Auditoría de Integridad de Archivos: Permite verificar que el archivo no ha cambiado desde su registro, comparando el hash almacenado con el hash actual.*/

/*Historial de Transferencias: Mantiene un historial completo de todas las transferencias de propiedad realizadas para un archivo, útil para rastrear la cadena de propiedad.*/

/*Gestión de Disputas: Los usuarios pueden registrar disputas sobre derechos de autor, notificando al propietario y creando un registro público de la disputa.*/

}