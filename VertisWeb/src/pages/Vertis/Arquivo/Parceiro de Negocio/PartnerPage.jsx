import React, { useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PartnerForm from './PartnerForm';
import Menu from '../../../Menu/Menu'; // Importando o menu

const partnerConfig = {
    tutor: {
        title: 'Tutor',
        labels: {
            nameLabel: 'Nome do Tutor',
            documentLabel: 'CPF do Tutor'
        }
    },
    clinica: {
        title: 'Clínica',
        labels: {
            nameLabel: 'Nome da Clínica',
            documentLabel: 'CNPJ'
        }
    },
    veterinario: {
        title: 'Veterinário',
        labels: {
            nameLabel: 'Nome do Veterinário',
            documentLabel: 'CRMV'
        }
    },
    fornecedor: {
        title: 'Fornecedor',
        labels: {
            nameLabel: 'Nome do Fornecedor',
            documentLabel: 'CNPJ'
        }
    }
};

function PartnerPage() {
    const { partnerType } = useParams();
    const config = useMemo(() => partnerConfig[partnerType], [partnerType]);

    useEffect(() => {
        if (config) document.title = `Vertis | ${config.title}`;
    }, [config]);

    if (!config) {
        return <Navigate to="/404" />;
    }

    return (
        <>
            <Menu />
            <PartnerForm title={config.title} labels={config.labels} partnerType={partnerType} />
        </>
    );
}

export default PartnerPage;