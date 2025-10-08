import React, { useEffect } from 'react';
import Menu from '../../../Menu/Menu';
import OperationalUnitForm from './OperationalUnitForm';

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