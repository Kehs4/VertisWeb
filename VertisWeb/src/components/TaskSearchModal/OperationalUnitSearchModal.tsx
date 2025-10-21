import React, { useState, useEffect } from 'react';
import './OperationalUnitSearchModal.css';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

export interface OperationalUnit {
    id: number;
    nom_unid_oper: string;
    nom_unid_negoc: string;
}

interface OperationalUnitSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (unit: OperationalUnit) => void;
}

const OperationalUnitSearchModal: React.FC<OperationalUnitSearchModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [units, setUnits] = useState<OperationalUnit[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchUnits = async () => {
                setIsLoading(true);
                try {
                    // O endpoint /api/units já existe e busca por nome por padrão
                    const response = await fetch(`/api/units?search_term=${searchTerm}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUnits(data);
                    } else {
                        console.error("Falha ao buscar unidades operacionais.");
                    }
                } catch (error) {
                    console.error("Erro de rede ao buscar unidades:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUnits();
        }
    }, [isOpen, searchTerm]);

    const handleSelectUnit = (unit: OperationalUnit) => {
        onSelect(unit);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content operational-unit-search-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Pesquisar Unidade Operacional</h2>
                    <button onClick={onClose} className="close-button"><CloseIcon /></button>
                </div>

                <div className="operational-unit-modal-toolbar">
                    <div className="search-input-wrapper">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Pesquisar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="filter-search-input"
                            style={{ color: 'black', backgroundColor: 'white' }}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="operational-unit-table-wrapper">
                    <table className="operational-unit-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Unidade Operacional</th>
                                <th>Unidade de Negócio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={3} className="table-loading-state">Carregando...</td></tr>
                            ) : units.length > 0 ? (
                                units.map(unit => (
                                    <tr key={unit.id} onDoubleClick={() => handleSelectUnit(unit)} title="Dê um duplo clique para selecionar">
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.id}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.nom_unid_oper}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.nom_unid_negoc}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={3} className="table-loading-state">Nenhuma unidade encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OperationalUnitSearchModal;