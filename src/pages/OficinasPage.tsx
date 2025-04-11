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
  }, []); // Removed dependencies as they are stable or handled by hook

  const handleDelete = (id: number) => {
    // Confirmation and dependency check are handled in context now
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
          updateOficina(currentOficina as Oficina); // Call update function (returns void)
        } else {
          const { id, ...newOficinaData } = currentOficina;
          addOficina(newOficinaData); // Call add function (returns void)
        }
        resetForm(); // Close modal and clear form on success (assuming no error thrown)
    } catch (error) {
        console.error("Erro ao salvar oficina:", error);
        // Optionally, display an error message to the user here
        // alert("Ocorreu um erro ao salvar a oficina.");
    }
  };

  // --- Render ---
  if (isLoading) {
    return <div className="p-6">Carregando oficinas...</div>;
  }

  return (
    <div className="p-6"> {/* Main Page Container */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">Gerenciar Oficinas</h2>
        <button
          onClick={() => { setIsEditing(false); setIsModalOpen(true); }} // Open modal for adding
          className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Adicionar Oficina
        </button>
      </div>

      {/* Oficina List Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{oficina.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{oficina.cargaHoraria} horas</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate" title={oficina.descricao}>{oficina.descricao || "-"}</td>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <div>
            <label htmlFor="modal-descricao" className="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
            <textarea
              id="modal-descricao"
              name="descricao"
              value={currentOficina.descricao || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
              rows={3} // Increased rows slightly for modal
            ></textarea>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex justify-center py-2 px-5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            >
              Cancelar
            </button>
            <button
              type="submit"
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
