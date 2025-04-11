import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Oficina } from '../interfaces/Oficina';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import Modal from '../components/Modal'; // Import Modal

// Define the type for the form state
type OficinaFormData = Omit<Oficina, 'id'> & { id?: number };

const OficinasPage: React.FC = () => {
  const { dados, isLoading, addOficina, updateOficina, deleteOficina } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [currentOficina, setCurrentOficina] = useState<OficinaFormData>({
    nome: '',
    cargaHoraria: 0,
    descricao: '',
  });

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentOficina((prev: OficinaFormData) => ({
      ...prev,
      [name]: name === 'cargaHoraria' ? parseFloat(value) || 0 : value,
    }));
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentOficina({ nome: '', cargaHoraria: 0, descricao: '' });
    setIsModalOpen(false); // Close modal on reset
  };

  // Effect to reset form fields when modal closes (if not editing)
   useEffect(() => {
    if (!isModalOpen && !isEditing) {
        setCurrentOficina({ nome: '', cargaHoraria: 0, descricao: '' });
    }
  }, [isModalOpen, isEditing]);

  const handleEdit = useCallback((oficina: Oficina) => {
    setIsEditing(true);
    setCurrentOficina({ ...oficina }); // Load existing data into form
    setIsModalOpen(true); // Open modal for editing
  }, []);

  const handleDelete = (id: number) => {
    deleteOficina(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOficina.nome || currentOficina.cargaHoraria <= 0 || isNaN(currentOficina.cargaHoraria)) {
      alert('Por favor, preencha o nome e uma carga horária válida (> 0).');
      return;
    }

    try {
        if (isEditing && currentOficina.id != null) {
          updateOficina(currentOficina as Oficina);
        } else {
          const { id, ...newOficinaData } = currentOficina;
          addOficina(newOficinaData);
        }
        resetForm();
    } catch (error) {
        console.error("Erro ao salvar oficina:", error);
        // alert("Ocorreu um erro ao salvar a oficina.");
    }
  };

  // --- Render ---
  if (isLoading) {
    return <div className="p-6">Carregando oficinas...</div>;
  }

  return (
    <div className="p-6"> {/* Main Page Container */}
      <div className="flex justify-between items-center mb-4"> {/* Reduced bottom margin */}
        <h2 className="text-2xl font-bold text-indigo-700">Gerenciar Oficinas</h2>
        <button
          onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
          // Refined Primary Button Style
          className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Adicionar Oficina
        </button>
      </div>

      {/* Introduction Text */}
      <p className="text-gray-600 mb-6 text-sm">
        Esta página permite cadastrar, visualizar, editar e excluir as oficinas oferecidas. Utilize o botão "Adicionar Oficina" para criar novas entradas ou os ícones na tabela para editar ou excluir oficinas existentes.
      </p>

      {/* Oficina List Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 table-fixed"> {/* Added table-fixed */}
          <colgroup> {/* Define column widths */}
            <col style={{ width: '30%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carga Horária</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dados.oficinas.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan={4}>Nenhuma oficina cadastrada</td>
              </tr>
            ) : (
              dados.oficinas.map((oficina, index) => (
                <tr
                  key={oficina.id}
                  className={`${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition duration-150 ease-in-out`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{oficina.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{oficina.cargaHoraria} horas</td>
                  {/* Removed truncate and max-w-xs to allow wrapping */}
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500" title={oficina.descricao}>{oficina.descricao || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(oficina)}
                      className="text-indigo-600 hover:text-indigo-800 mr-4 transition duration-150 ease-in-out"
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} size="lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(oficina.id)}
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
        title={isEditing ? 'Editar Oficina' : 'Adicionar Nova Oficina'}
      >
        {/* Changed form layout to vertical stack */}
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label htmlFor="modal-nome" className="block text-sm font-medium text-gray-700">Nome da Oficina</label>
              <input
                type="text"
                id="modal-nome"
                name="nome"
                value={currentOficina.nome}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-cargaHoraria" className="block text-sm font-medium text-gray-700">Carga Horária (horas)</label>
              <input
                type="number"
                id="modal-cargaHoraria"
                name="cargaHoraria"
                value={currentOficina.cargaHoraria === 0 ? '' : currentOficina.cargaHoraria}
                onChange={handleInputChange}
                min="0.5"
                step="0.5"
                placeholder="Ex: 20"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
                required
              />
            </div>
           <div>
            <label htmlFor="modal-descricao" className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
            <textarea
              id="modal-descricao"
              name="descricao"
              value={currentOficina.descricao || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
              rows={4} // Increased rows
            ></textarea>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={resetForm}
              // Refined Secondary Button Style
              className="inline-flex justify-center py-2 px-5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Cancelar
            </button>
            <button
              type="submit"
              // Refined Primary Button Style (Matches Add button)
              className="inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar Oficina'}
            </button>
          </div>
        </form>
      </Modal>

    </div> // End of main return div
  );
};

export default OficinasPage;
