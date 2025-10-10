import React, { useState, useMemo } from 'react';
import './SearchModal.css';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';

// Tipagem para os dados de exemplo. Em um projeto real, viria da sua API.
export interface SearchResult {
    id: number | string;
    name: string;
    document?: string; // CPF/CNPJ/CRMV (made optional for broader use cases like Service Orders)
    phone?: string;
    email?: string;
    [key: string]: any; // Permite outras propriedades
}

// Tipagem para a configuração do modal
export interface SearchConfig {
    title: string;
    searchOptions: { value: string; label: string }[];
    resultHeaders: { key: string; label: string }[];
    mockData: SearchResult[];
}

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: SearchResult) => void;
    config: SearchConfig;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelect, config }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState(config.searchOptions[0]?.value || 'name');
    const [results, setResults] = useState<SearchResult[]>([]);

    const handleSearch = () => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }
        // Simulação de busca: filtra os dados mockados.
        // Em um cenário real, aqui você faria uma chamada de API.
        const filteredResults = config.mockData.filter(item => {
            const itemValue = item[searchBy]?.toString().toLowerCase() || '';
            return itemValue.includes(searchTerm.toLowerCase());
        });
        setResults(filteredResults);
    };

    const handleSelectAndClose = (item: SearchResult) => {
        onSelect(item);
        resetAndClose();
    };

    const resetAndClose = () => {
        setSearchTerm('');
        setResults([]);
        onClose();
    };

    // useMemo para evitar recalcular os headers a cada renderização
    const tableHeaders = useMemo(() => config.resultHeaders, [config]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>{config.title}</h2>
                    <button onClick={resetAndClose} className="modal-close-button">
                        <CloseIcon />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="search-controls">
                        <div className="search-input-group">
                            <select value={searchBy} onChange={(e) => setSearchBy(e.target.value)} className="search-select">
                                {config.searchOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Digite para pesquisar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch} className="search-button">
                                <SearchIcon /> Pesquisar
                            </button>
                        </div>
                    </div>

                    <div className="results-table-container">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    {tableHeaders.map(header => (
                                        <th key={header.key}>{header.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {results.length > 0 ? (
                                    results.map(item => (
                                        <tr key={item.id} onDoubleClick={() => handleSelectAndClose(item)} title="Dê um duplo clique para selecionar">
                                            {tableHeaders.map(header => (
                                                <td key={`${item.id}-${header.key}`}>{item[header.key]}</td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={tableHeaders.length} className="no-results">
                                            Nenhum resultado encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="modal-footer">
                    <span>{results.length} registro(s) encontrado(s).</span>
                    <button onClick={resetAndClose} className="action-button cancel">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default SearchModal;