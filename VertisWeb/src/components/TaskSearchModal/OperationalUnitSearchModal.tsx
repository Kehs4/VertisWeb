import React, { useState, useEffect } from 'react';
import './OperationalUnitSearchModal.css';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

export interface OperationalUnit {
    fkid_unid_negoc: number; // ID da unidade de negócio
    cod_unid_oper: number;
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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Efeito para aplicar o "debounce" no termo de busca.
    // Ele aguarda 300ms após o usuário parar de digitar para atualizar o termo de busca que será usado na API.
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms de atraso

        // A função de limpeza é crucial: ela cancela o timeout anterior se o usuário digitar novamente.
        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]); // Este efeito roda sempre que o `searchTerm` (do input) muda.

    useEffect(() => {
        if (isOpen) {
            const fetchUnits = async () => {
                setIsLoading(true);
                try {
                    // Agora, usa o termo "debounced" para fazer a busca, reduzindo as requisições.
                    const response = await fetch(`/api/units?search=${debouncedSearchTerm}`);
                    if (response.ok) {
                        // A API retorna um objeto { data: [...] }, então precisamos acessar a propriedade 'data'
                        const responseData = await response.json();
                        if (Array.isArray(responseData.data)) {
                            setUnits(responseData.data);
                        }
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
    }, [isOpen, debouncedSearchTerm]); // A busca agora depende do termo "debounced".

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
                                <th>Código Unid.Neg</th>
                                <th>Unidade de Negócio</th>
                                <th>Código Unid. Oper</th>
                                <th>Unidade Operacional</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={3} className="table-loading-state">Carregando...</td></tr>
                            ) : units.length > 0 ? (
                                units.map(unit => (
                                    <tr key={unit.fkid_unid_negoc} onDoubleClick={() => handleSelectUnit(unit)} title="Dê um duplo clique para selecionar">
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.fkid_unid_negoc}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.nom_unid_negoc}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.cod_unid_oper}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.nom_unid_oper}</td>
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