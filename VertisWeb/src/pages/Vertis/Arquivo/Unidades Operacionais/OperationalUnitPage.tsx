import React, { useEffect } from 'react';
import OperationalUnitForm from './OperationalUnitForm.tsx';
import Menu from '../../../Menu/Menu.tsx';

function OperationalUnitPage() {

    useEffect(() => {
        document.title = "Vertis | Unidades Operacionais";
    }, []);

    return (
        <>
            <Menu />
            <OperationalUnitForm />
        </>
    );
}

export default OperationalUnitPage;