import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Turma } from '../interfaces/Turma';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus } from '@fortawesome/free-solid-svg-icons';
import Modal from '../components/Modal'; // Import Modal

// Define the type for the form state
type TurmaFormData = Omit<Turma, 'id'> & { id?: number };

const TurmasPage: React.FC = () => {
  const { dados, isLoading, addTurma, updateTurma, deleteTurma } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal
  const [currentTurma, setCurrentTurma] = useState<TurmaFormData>({
    nome: '',
    periodo: '',
    observacoes: '',
  });

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTurma((prev: TurmaFormData) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentTurma({ nome: '', periodo: '', observacoes: '' });
    setIsModalOpen(false); // Close modal on reset
  };

  // Effect to reset form fields when modal closes (if not editing)
  useEffect(() => {
    if (!isModalOpen && !isEditing) {
        setCurrentTurma({ nome: '', periodo: '', observacoes: '' });
    }
  }, [isModalOpen, isEditing]);

  const handleEdit = useCallback((turma: Turma) => {
    setIsEditing(true);
    setCurrentTurma({ ...turma }); // Load existing data into form
    setIsModalOpen(true); // Open modal for editing
  }, []);

  const handleDelete = (id: number) => {
    // Confirmation and dependency check are handled in context
    deleteTurma(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTurma.nome) {
      alert('Por favor, preencha o nome da turma.');
      return;
    }

    try {
        if (isEditing && currentTurma.id != null) {
          updateTurma(currentTurma as Turma); // Call update function (returns void)
        } else {
          const { id, ...newTurmaData } = currentTurma;
          addTurma(newTurmaData); // Call add function (returns void)
        }
        resetForm(); // Close modal and clear form on success
    } catch (error) {
        console.error("Erro ao salvar turma:", error);
        // alert("Ocorreu um erro ao salvar a turma.");
    }
  };

  // --- Render ---
  if (isLoading) {
    return <div className="p-6">Carregando turmas...</div>;
  }

  return (
    <div className="p-6"> {/* Main Page Container */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">Gerenciar Turmas</h2>
        <button
          onClick={() => { setIsEditing(false); setIsModalOpen(true); }} // Open modal for adding
          className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Adicionar Turma
        </button>
      </div>

      {/* Turma List Table */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observações</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dados.turmas.length === 0 ? (
              <tr>
                <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan={4}>Nenhuma turma cadastrada</td>
              </tr>
            ) : (
              dados.turmas.map((turma, index) => (
                <tr
                  key={turma.id}
                  className={`${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-indigo-50 transition duration-150 ease-in-out`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{turma.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{turma.periodo || "-"}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate" title={turma.observacoes}>{turma.observacoes || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(turma)}
                      className="text-indigo-600 hover:text-indigo-800 mr-4 transition duration-150 ease-in-out"
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} size="lg" />
                    </button>
                    <button
                      onClick={() => handleDelete(turma.id)}
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
        title={isEditing ? 'Editar Turma' : 'Adicionar Nova Turma'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-nome" className="block text-sm font-medium text-gray-700">Nome da Turma</label>
              <input
                type="text"
                id="modal-nome"
                name="nome"
                value={currentTurma.nome}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-periodo" className="block text-sm font-medium text-gray-700">Período</label>
              <input
                type="text"
                id="modal-periodo"
                name="periodo"
                placeholder="Ex: Manhã, Tarde, 2024.1"
                value={currentTurma.periodo || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
              />
            </div>
          </div>
          <div>
            <label htmlFor="modal-observacoes" className="block text-sm font-medium text-gray-700">Observações (opcional)</label>
            <textarea
              id="modal-observacoes"
              name="observacoes"
              value={currentTurma.observacoes || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
              rows={3}
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
              {isEditing ? 'Salvar Alterações' : 'Adicionar Turma'}
            </button>
          </div>
        </form>
      </Modal>

    </div> // End of main return div
  );
};

export default TurmasPage;
