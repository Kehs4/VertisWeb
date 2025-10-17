import React, { useEffect } from 'react';
import Menu from '../../../Menu/Menu.tsx';
import ServiceOrderForm from './ServiceOrderForm.tsx';

function ServiceOrderPage() {

    useEffect(() => {
        document.title = "Vertis | Ordem de Serviço";
    }, []);

    return (
        <> {/* MainLayout already renders Menu and Header */}
            <ServiceOrderForm />
        </>
    );
}

export default ServiceOrderPage;