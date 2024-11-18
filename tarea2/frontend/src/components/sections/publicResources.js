import React from 'react';
import ResourceCard from '../ui/resourceCard';

function PublicResources() {
  const publicItems = [
    'Ver certificados de registro',
    'Consultar historial de transferencias',
    'Verificar propiedad intelectual',
    'Consultar historial de disputas',
  ];

  return (
    <ResourceCard
      title="Recursos para todos"
      items={publicItems}
      ownerResources={false}
    />
  );
}

export default PublicResources;
