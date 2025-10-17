import React, { useEffect, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PartnerForm from './PartnerForm.tsx';
import Menu from '../../../Menu/Menu.tsx';

// Definindo tipos para maior segurança e clareza
type PartnerType = 'tutor' | 'clinica' | 'veterinario' | 'fornecedor';

interface PartnerConfig {
    title: string;
    labels: {
        nameLabel: string;
        documentLabel: string;
    };
}

// Tipando o objeto de configuração
const partnerConfig: Record<PartnerType, PartnerConfig> = {
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
    const { partnerType } = useParams<{ partnerType: PartnerType }>();
    const config = useMemo(() => partnerType ? partnerConfig[partnerType] : undefined, [partnerType]);

    useEffect(() => {
        if (config) document.title = `Vertis | ${config.title}`;
    }, [config]);

    if (!config) {
        return <Navigate to="/404" />;
    }

    return (
        <> {/* MainLayout already renders Menu and Header */}
            <PartnerForm title={config.title} labels={config.labels} partnerType={partnerType} />
        </>
    );
}

export default PartnerPage;