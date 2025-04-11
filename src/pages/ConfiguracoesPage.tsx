import React, { useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faTrashAlt, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
// Assuming you might add a Google icon later if needed
// import { faGoogle } from '@fortawesome/free-brands-svg-icons'; 

const ConfiguracoesPage: React.FC = () => {
  const { exportarDados, importarDados, limparDados } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);

  const handleExportClick = () => {
    exportarDados();
    // Consider adding a success notification via Snackbar here
  };

  const handleImportClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null); // Clear previous errors
    setImportSuccess(false); // Clear previous success message
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== 'application/json') {
      setImportError("O arquivo selecionado não é um JSON válido.");
      if(fileInputRef.current) fileInputRef.current.value = ''; // Clear input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
             throw new Error("Conteúdo do arquivo vazio ou inválido.");
        }
        const success = importarDados(content); // Call context function
        if (success) {
            setImportSuccess(true);
            // Optionally show Snackbar notification
        } else {
             // Error message should be handled by the context alert for now
             // setImportError("Falha ao importar dados. Verifique o console."); 
        }
      } catch (error: any) {
        console.error("Erro ao processar arquivo JSON:", error);
        setImportError(`Erro ao processar arquivo: ${error.message}`);
      } finally {
           if(fileInputRef.current) fileInputRef.current.value = ''; // Clear input regardless of outcome
      }
    };
     reader.onerror = () => {
         setImportError("Erro ao ler o arquivo.");
         if(fileInputRef.current) fileInputRef.current.value = ''; // Clear input
     };
    reader.readAsText(file);
  };

  const handleClearClick = () => {
    // Confirmation is handled within the context function
    limparDados();
    // Consider adding a success notification via Snackbar here
  };


  return (
    <div className="p-6"> {/* Added padding */}
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Configurações</h2> {/* Reduced margin for intro */}

      {/* Introduction Text */}
      <p className="text-gray-600 mb-6 text-sm">
        Gerencie as configurações gerais do sistema, incluindo importação, exportação e limpeza de dados. Tenha cuidado ao usar as opções de limpeza, pois são irreversíveis.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"> {/* Adjusted grid and gap */}
        
        {/* Exportar Dados Card */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Exportar Dados</h3> {/* Consistent heading */}
          <p className="text-sm text-gray-600 mb-5">Exporte todos os dados do sistema (oficinas, educadores, turmas, agendamentos) para um arquivo JSON.</p> {/* Consistent paragraph */}
          <button 
            onClick={handleExportClick}
            // Refined Primary Button Style
            className="inline-flex items-center justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" /> Exportar Dados
          </button>
        </div>
        
        {/* Importar Dados Card */}
         <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Importar Dados</h3> {/* Consistent heading */}
          <p className="text-sm text-gray-600 mb-4">Importe dados de um arquivo JSON previamente exportado.</p> {/* Consistent paragraph */}
          {/* Attention Message */}
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
             <strong className="font-bold"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" /> Atenção:</strong>
             <span className="block sm:inline ml-1">A importação substituirá todos os dados atuais!</span>
          </div>
          <div className="flex flex-col space-y-3">
             {/* Hidden file input */}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".json,application/json" 
                className="hidden" 
             />
             {/* Button to trigger file input */}
            <button 
                onClick={handleImportClick}
                // Refined Primary Button Style
                className="inline-flex items-center w-full justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" /> Selecionar Arquivo e Importar
            </button>
             {/* Status Messages */}
             {importError && <p className="text-red-600 text-sm mt-3">{importError}</p>}
             {importSuccess && <p className="text-green-600 text-sm mt-3 font-medium">Dados importados com sucesso!</p>}
          </div>
        </div>

      </div>
      
      {/* Integrações Card */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8 md:col-span-2">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Integrações</h3> {/* Consistent heading */}
        <p className="text-sm text-gray-600 mb-5">Configure integrações com outros serviços (funcionalidade futura).</p> {/* Consistent paragraph */}
         <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="font-semibold text-md text-gray-700 mb-2">Google Agenda</h4>
            <p className="text-sm text-gray-600 mb-4">Sincronizar agendamentos com o Google Agenda.</p> {/* Consistent paragraph */}
            <button
              className="inline-flex items-center justify-center py-2 px-5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
              disabled
            >
                {/* <FontAwesomeIcon icon={faGoogle} className="mr-2" /> */} Conectar com Google (Em breve)
            </button> {/* Styled disabled button */}
        </div>
      </div>
      
      {/* Limpar Dados Card */}
      <div className="bg-red-50 p-6 rounded-lg shadow-md border border-red-300 md:col-span-2">
        <h3 className="text-xl font-semibold text-red-800 mb-4">Limpar Dados</h3> {/* Consistent heading */}
        <p className="text-sm text-red-700 mb-4">Remova permanentemente todos os dados (oficinas, educadores, turmas, agendamentos) do sistema.</p> {/* Consistent paragraph */}
         {/* Attention Message */}
         <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded relative mb-5 text-sm" role="alert">
             <strong className="font-bold"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" /> Atenção:</strong>
             <span className="block sm:inline ml-1">Esta ação não pode ser desfeita!</span>
         </div>
        <button 
            onClick={handleClearClick}
            // Refined Destructive Button Style
            className="inline-flex items-center justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
        >
          <FontAwesomeIcon icon={faTrashAlt} className="mr-2" /> Limpar Todos os Dados
        </button>
      </div>

    </div>
  );
};

export default ConfiguracoesPage;
