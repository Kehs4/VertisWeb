export interface FlagConfig {
    id: string;
    label: string;
    background: string;
    color: string;
}

export const flags: FlagConfig[] = [
    { id: '1', label: 'Atualização', background: '#e3f2fd', color: '#1565c0' },
    { id: '2', label: 'Banco de Dados', background: '#e8f5e9', color: '#2e7d32' },
    { id: '3', label: 'Configuração', background: '#fce4ec', color: '#c2185b' },
    { id: '4', label: 'Falhas sistêmicas', background: '#fbe9e7', color: '#d84315' },
    { id: '5', label: 'Infra', background: '#efebe9', color: '#4e342e' },
    { id: '6', label: 'Instalações', background: '#e0f7fa', color: '#006064' },
    { id: '7', label: 'Integrações', background: '#f3e5f5', color: '#6a1b9a' },
    { id: '8', label: 'Interfaces', background: '#e8eaf6', color: '#283593' },
    { id: '9', label: 'Liberar Acessos', background: '#fffde7', color: '#f9a825' },
    { id: '10', label: 'Notas Fiscais', background: '#e1f5fe', color: '#0277bd' },
    { id: '11', label: 'Operacionais', background: '#f9fbe7', color: '#9e9d24' },
    { id: '12', label: 'Portal', background: '#f0f4c3', color: '#558b2f' },
    { id: '13', label: 'Publicadores', background: '#fff3e0', color: '#ef6c00' },
    { id: '14', label: 'Cadastros', background: '#ede7f6', color: '#4527a0' },
    { id: '15', label: 'Treinamento', background: '#e0f2f1', color: '#00695c' },
];

// Cria um mapa para busca rápida das configurações por ID, incluindo um valor padrão.
export const flagsMap = new Map<string, FlagConfig>(
    flags.map(flag => [flag.id, flag])
);

flagsMap.set('default', {
    id: 'default',
    label: 'Desconhecido',
    background: '#eceff1',
    color: '#37474f'
});