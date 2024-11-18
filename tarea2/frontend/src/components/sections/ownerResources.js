import React from 'react';
import ResourceCard from '../ui/resourceCard';

function OwnerResources() {
  const ownerItems = [
    'Emitir NFT',
    'Gestionar acceso a NFT',
    'Dar licencias temporales',
    'Transferir propiedad',
    'Resolver disputas',
  ];

  return (
    <ResourceCard
      title="Recursos para propietario"
      items={ownerItems}
      ownerResources={true}
    />
  );
}

export default OwnerResources;
