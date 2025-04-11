import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Educador } from '../interfaces/Educador';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import Modal from '../components/Modal'; // Import Modal

// Define the type for the form state
type EducadorFormData = Omit<Educador, 'id'> & { id?: number };

const EducadoresPage: React.FC = () => {
  const { dados, isLoading, addEducador, updateEducador, deleteEducador } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [currentEducador, setCurrentEducador] = useState<EducadorFormData>({
    nome: '',
    email: '',
    telefone: '',
  });

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentEducador((prev: EducadorFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentEducador({ nome: '', email: '', telefone: '' });
    setIsModalOpen(false); // Close modal on reset
  };

  // Effect to reset form fields when modal closes (if not editing)
  useEffect(() => {
    if (!isModalOpen && !isEditing) {
        setCurrentEducador({ nome: '', email: '', telefone: '' });
    }
  }, [isModalOpen, isEditing]);


  const handleEdit = useCallback((educador: Educador) => {
    setIsEditing(true);
    setCurrentEducador({ ...educador }); // Load existing data into form
    setIsModalOpen(true); // Open modal for editing
  }, []);

  const handleDelete = (id: number) => {
    deleteEducador(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEducador.nome) {
      alert('Por favor, preencha o nome do educador.');
      return;
    }

    try {
        if (isEditing && currentEducador.id != null) {
          updateEducador(currentEducador as Educador);
        } else {
          const { id, ...newEducadorData } = currentEducador;
          addEducador(newEducadorData);
        }
        resetForm();
    } catch (error) {
        console.error("Erro ao salvar educador:", error);
        // alert("Ocorreu um erro ao salvar o educador.");
    }
  };

  // --- Render ---
  if (isLoading) {
    return <div className="p-6">Carregando educadores...</div>;
  }

  return (
    <div className="p-6"> {/* Main Page Container */}
       <div className="flex justify-between items-center mb-4"> {/* Reduced bottom margin */}
        <h2 className="text-2xl font-bold text-indigo-700">Gerenciar Educadores</h2>
        <button
          onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
          // Refined Primary Button Style
          className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Adicionar Educador
        </button>
      </div>

      {/* Introduction Text */}
      <p className="text-gray-600 mb-6 text-sm">
        Gerencie os educadores cadastrados no sistema. Adicione novos educadores, edite informações existentes ou remova registros conforme necessário.
      </p>

      {/* Educador List Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 table-fixed"> {/* Added table-fixed */}
          <colgroup> {/* Define column widths */}
            <col style={{ width: '35%' }} /> {/* Nome */}
            <col style={{ width: '35%' }} /> {/* Email */}
            <col style={{ width: '15%' }} /> {/* Telefone */}
            <col style={{ width: '15%' }} /> {/* Ações */}
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th> {/* Removed w-* class */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th> {/* Removed w-* class */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th> {/* Removed w-* class */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dados.educadores.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan={4}>Nenhum educador cadastrado</td>
              </tr>
            ) : (
              dados.educadores.map((educador, index) => (
                <tr
                  key={educador.id}
                  className={`${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition duration-150 ease-in-out`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" title={educador.nome}>{educador.nome}</td> {/* Removed truncate */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={educador.email}>{educador.email || "-"}</td> {/* Removed truncate */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educador.telefone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(educador)}
                      className="text-indigo-600 hover:text-indigo-800 mr-4 transition duration-150 ease-in-out"
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} size="lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(educador.id)}
                      className="text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                      title="Excluir"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} size="lg" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Add/Edit Form */}
       <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={isEditing ? 'Editar Educador' : 'Adicionar Novo Educador'}
      >
         {/* Simple vertical stack for form fields */}
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="modal-nome" className="block text-sm font-medium text-gray-700">Nome do Educador</label>
              <input
                type="text"
                id="modal-nome"
                name="nome"
                value={currentEducador.nome}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="modal-email"
                name="email"
                value={currentEducador.email || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
              />
            </div>
            <div>
            <label htmlFor="modal-telefone" className="block text-sm font-medium text-gray-700">Telefone (opcional)</label>
            <input
              type="tel"
              id="modal-telefone"
              name="telefone"
              value={currentEducador.telefone || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
            />
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
            {/* Refined Secondary Button Style */}
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex justify-center py-2 px-5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Cancelar
            </button>
            {/* Refined Primary Button Style */}
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar Educador'}
            </button>
          </div>
        </form>
      </Modal>

    </div> // End of main return div
  );
};

export default EducadoresPage;
