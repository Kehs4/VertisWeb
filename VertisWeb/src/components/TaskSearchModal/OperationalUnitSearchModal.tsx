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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const LIMIT = 30; // Número de itens por página

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

    // Efeito para resetar a paginação sempre que um novo termo de busca for aplicado
    useEffect(() => {
        setPage(1); // Volta para a primeira página
        setUnits([]); // Limpa as unidades atuais
        setTotalPages(0); // Reseta o total de páginas
    }, [debouncedSearchTerm]);

    useEffect(() => {
        if (isOpen) {
            const fetchUnits = async () => {
                setIsLoading(true);
                try {
                    const offset = (page - 1) * LIMIT;
                    // Agora, usa o termo "debounced" para fazer a busca, reduzindo as requisições.
                    const response = await fetch(`/api/units?search=${debouncedSearchTerm}&limit=${LIMIT}&offset=${offset}`);
                    if (response.ok) {
                        const responseData = await response.json();
                        if (Array.isArray(responseData.data)) {
                            setUnits(responseData.data); // Substitui os dados com os da página atual
                            setHasMore(responseData.hasMore);
                            setTotalPages(Math.ceil(responseData.total / LIMIT));
                        }
                    } else {
                        console.error("Falha ao buscar unidades operacionais.");
                        setUnits([]); // Limpa em caso de erro
                        setHasMore(false);
                    }
                } catch (error) {
                    console.error("Erro de rede ao buscar unidades:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUnits();
        }
    }, [isOpen, debouncedSearchTerm, page]); // A busca agora depende do termo e da página.

    const handleSelectUnit = (unit: OperationalUnit) => {
        onSelect(unit);
        onClose();
    };

    // Lógica para gerar os botões de paginação
    const renderPaginationButtons = () => {
        const buttons: React.JSX.Element[] = [];
        // Mostra até 6 botões de página
        const maxButtons = 6;
        let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
        let endPage = startPage + maxButtons - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`pagination-button ${page === i ? 'active' : ''}`}
                    disabled={isLoading}
                    type="button"
                >
                    {i}
                </button>
            );
        }
        return buttons;
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
                                <tr><td colSpan={4} className="table-loading-state">Carregando...</td></tr>
                            ) : units.length > 0 ? (
                                units.map(unit => (
                                    <tr key={unit.cod_unid_oper} onDoubleClick={() => handleSelectUnit(unit)} title="Dê um duplo clique para selecionar">
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.fkid_unid_negoc}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.nom_unid_negoc}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.cod_unid_oper}</td>
                                        <td className="selectable-cell" onClick={() => handleSelectUnit(unit)}>{unit.nom_unid_oper}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="table-loading-state">Nenhuma unidade encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer pagination-footer">
                    {totalPages > 0 && (
                        <div className="pagination-controls">
                            <button 
                                onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                                disabled={page === 1 || isLoading}
                                className="pagination-button"
                            >&lt;</button> 
                            {renderPaginationButtons()}
                            <button 
                                onClick={() => setPage(prev => prev + 1)} 
                                disabled={!hasMore || isLoading}
                                className="pagination-button"
                            >&gt;</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OperationalUnitSearchModal;