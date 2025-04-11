import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Agendamento } from '../interfaces/Agendamento';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlusCircle, faTimesCircle, faPlus } from '@fortawesome/free-solid-svg-icons';
import Modal from '../components/Modal';

// Imports for react-big-calendar
import { Calendar, dateFnsLocalizer, Event as CalendarEventInterface, View } from 'react-big-calendar'; // Removed NavigateAction as it's not used in the simplified handler
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfWeek } from 'date-fns/startOfWeek';
import { getDay } from 'date-fns/getDay';
import { ptBR } from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Define the type for the form state
type AgendamentoFormData = Omit<Agendamento, 'id' | 'data'> & { id?: number; data?: string };

// Define the type for filters
interface AgendamentoFilters {
  oficinaId: string;
  educadorId: string;
  turmaId: string;
  periodo: 'todos' | 'futuro' | 'passado' | 'semana' | 'mes';
}

// Define the structure for calendar events
interface MappedCalendarEvent extends CalendarEventInterface {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
}

// Setup the localizer for react-big-calendar
const locales = {
  'pt-BR': ptBR,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const AgendamentosPage: React.FC = () => {
  const { dados, isLoading, addAgendamento, updateAgendamento, deleteAgendamento } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAgendamento, setCurrentAgendamento] = useState<AgendamentoFormData>({
    oficinaId: 0, educadorId: 0, turmaId: 0, horaInicio: '', horaFim: '', observacoes: '',
  });
  const [dates, setDates] = useState<string[]>(['']);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<AgendamentoFilters>({
    oficinaId: '', educadorId: '', turmaId: '', periodo: 'todos',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  // State for react-big-calendar navigation
  const [calendarView, setCalendarView] = useState<View>('month'); // Default view
  const [calendarNavDate, setCalendarNavDate] = useState<Date>(new Date()); // Date the calendar is showing

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentAgendamento(prev => ({
      ...prev,
      [name]: (name === 'oficinaId' || name === 'educadorId' || name === 'turmaId') ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleDateChange = (index: number, value: string) => {
    const newDates = [...dates];
    newDates[index] = value;
    setDates(newDates);
  };

  const addDateField = () => setDates([...dates, '']);

  const removeDateField = (index: number) => {
    if (dates.length > 1) setDates(dates.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentAgendamento({ oficinaId: 0, educadorId: 0, turmaId: 0, horaInicio: '', horaFim: '', observacoes: '' });
    setDates(['']);
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (!isModalOpen && !isEditing) {
      setCurrentAgendamento({ oficinaId: 0, educadorId: 0, turmaId: 0, horaInicio: '', horaFim: '', observacoes: '' });
      setDates(['']);
    }
  }, [isModalOpen, isEditing]);

  const handleEdit = useCallback((agendamento: Agendamento) => {
    setIsEditing(true);
    setCurrentAgendamento({ ...agendamento });
    setDates([agendamento.data]);
    setIsModalOpen(true);
  }, []);

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      deleteAgendamento(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { oficinaId, educadorId, turmaId, horaInicio, horaFim } = currentAgendamento;
    const validDates = dates.filter(d => d);

    if (!oficinaId || !educadorId || !turmaId || !horaInicio || !horaFim || (validDates.length === 0 && !isEditing) || (isEditing && !currentAgendamento.data)) {
      alert('Preencha todos os campos obrigatórios (Oficina, Educador, Turma, Data(s), Horários).'); return;
    }
    if (horaInicio >= horaFim) {
      alert('O horário de término deve ser posterior ao horário de início.'); return;
    }

    let success = false;
    try {
        if (isEditing && currentAgendamento.id != null && currentAgendamento.data) {
            const agendamentoToUpdate: Agendamento = {
                id: currentAgendamento.id,
                oficinaId: parseInt(currentAgendamento.oficinaId.toString(), 10),
                educadorId: parseInt(currentAgendamento.educadorId.toString(), 10),
                turmaId: parseInt(currentAgendamento.turmaId.toString(), 10),
                data: currentAgendamento.data,
                horaInicio: currentAgendamento.horaInicio,
                horaFim: currentAgendamento.horaFim,
                observacoes: currentAgendamento.observacoes
            };
            updateAgendamento(agendamentoToUpdate);
            success = true;
        } else if (!isEditing) {
            const { id, data, ...baseData } = currentAgendamento;
            const baseDataWithNumbers = {
                ...baseData,
                oficinaId: parseInt(baseData.oficinaId.toString(), 10),
                educadorId: parseInt(baseData.educadorId.toString(), 10),
                turmaId: parseInt(baseData.turmaId.toString(), 10),
            };
            addAgendamento(baseDataWithNumbers, validDates);
            success = true;
        }
    } catch (error) {
        console.error("Erro ao salvar agendamento:", error);
        alert("Ocorreu um erro ao salvar o agendamento.");
    }

    if (success) {
      resetForm();
    }
  };

  // --- Filtering Logic ---
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredAgendamentos = useMemo(() => {
    let filtered = [...dados.agendamentos];
    if (filters.oficinaId) { filtered = filtered.filter(a => a.oficinaId === parseInt(filters.oficinaId, 10)); }
    if (filters.educadorId) { filtered = filtered.filter(a => a.educadorId === parseInt(filters.educadorId, 10)); }
    if (filters.turmaId) { filtered = filtered.filter(a => a.turmaId === parseInt(filters.turmaId, 10)); }
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    if (filters.periodo === 'futuro') { filtered = filtered.filter(a => new Date(a.data + 'T00:00:00') >= hoje); }
    else if (filters.periodo === 'passado') { filtered = filtered.filter(a => new Date(a.data + 'T00:00:00') < hoje); }
    else if (filters.periodo === 'semana') { const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay()); inicioSemana.setHours(0, 0, 0, 0); const fimSemana = new Date(inicioSemana); fimSemana.setDate(inicioSemana.getDate() + 6); fimSemana.setHours(23, 59, 59, 999); filtered = filtered.filter(a => { const dataAgendamento = new Date(a.data + 'T00:00:00'); return dataAgendamento >= inicioSemana && dataAgendamento <= fimSemana; }); }
    else if (filters.periodo === 'mes') { const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1); const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); fimMes.setHours(23, 59, 59, 999); filtered = filtered.filter(a => { const dataAgendamento = new Date(a.data + 'T00:00:00'); return dataAgendamento >= inicioMes && dataAgendamento <= fimMes; }); }
    return filtered.sort((a, b) => new Date(`${a.data}T${a.horaInicio}`).getTime() - new Date(`${b.data}T${b.horaInicio}`).getTime());
  }, [dados.agendamentos, filters]);

  // --- Map Agendamentos to Calendar Events ---
  const calendarEvents: MappedCalendarEvent[] = useMemo(() => {
    return filteredAgendamentos.map(agendamento => {
      const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId);
      const turma = dados.turmas.find(t => t.id === agendamento.turmaId);
      const title = `${oficina?.nome || '?'} - ${turma?.nome || '?'}`;
      const start = parse(`${agendamento.data} ${agendamento.horaInicio}`, 'yyyy-MM-dd HH:mm', new Date());
      const end = parse(`${agendamento.data} ${agendamento.horaFim}`, 'yyyy-MM-dd HH:mm', new Date());

      return {
        id: agendamento.id, title: title, start: start, end: end, resource: agendamento
      };
    }).filter(event => event.start && event.end && !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));
  }, [filteredAgendamentos, dados.oficinas, dados.turmas]);

  // --- Calendar Navigation/View Handlers (Corrected) ---
  const handleCalendarNavigate = useCallback((newDate: Date) => {
      setCalendarNavDate(newDate);
  }, []);

  const handleCalendarView = useCallback((newView: View) => {
      setCalendarView(newView);
  }, []);

  // --- Render ---
  if (isLoading) {
    return <div className="p-6">Carregando agendamentos...</div>;
  }

  return (
    <div className="p-6"> {/* Main Page Container */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-700">Gerenciar Agendamentos</h2>
        <button
          onClick={() => { setIsEditing(false); setCurrentAgendamento({ oficinaId: 0, educadorId: 0, turmaId: 0, horaInicio: '', horaFim: '', observacoes: '' }); setDates(['']); setIsModalOpen(true); }}
          // Refined Primary Button Style
          className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" /> Adicionar Agendamento
        </button>
      </div>

      {/* Introduction Text */}
      <p className="text-gray-600 mb-6 text-sm">
        Visualize e gerencie os agendamentos das oficinas para as turmas. Utilize os filtros para refinar a visualização e alterne entre a lista e o calendário. Adicione novos agendamentos ou edite os existentes clicando nos itens do calendário ou nos botões da lista.
      </p>

      {/* Filters and View Toggle Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
                 <div>
                    <label htmlFor="filtro-oficinaId" className="block text-sm font-medium text-gray-700">Oficina</label>
                    <select id="filtro-oficinaId" name="oficinaId" value={filters.oficinaId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2 text-sm">
                        <option value="">Todas</option>
                        {dados.oficinas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="filtro-educadorId" className="block text-sm font-medium text-gray-700">Educador</label>
                    <select id="filtro-educadorId" name="educadorId" value={filters.educadorId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2 text-sm">
                        <option value="">Todos</option>
                        {dados.educadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="filtro-turmaId" className="block text-sm font-medium text-gray-700">Turma</label>
                    <select id="filtro-turmaId" name="turmaId" value={filters.turmaId} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2 text-sm">
                        <option value="">Todas</option>
                        {dados.turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="filtro-periodo" className="block text-sm font-medium text-gray-700">Período</label>
                    <select id="filtro-periodo" name="periodo" value={filters.periodo} onChange={handleFilterChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2 text-sm">
                        <option value="todos">Todos</option>
                        <option value="futuro">Próximos</option>
                        <option value="passado">Passados</option>
                        <option value="semana">Esta semana</option>
                        <option value="mes">Este mês</option>
                    </select>
                </div>
            </div>
            {/* View Toggle */}
            <div className="flex space-x-2 flex-shrink-0 mt-4 md:mt-0">
                <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-md text-sm font-medium border transition duration-150 ease-in-out ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Lista</button>
                <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 rounded-md text-sm font-medium border transition duration-150 ease-in-out ${viewMode === 'calendar' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Calendário</button>
            </div>
        </div>
      </div>

      {/* Conditional Rendering based on viewMode */}
      {viewMode === 'list' && (
        <div id="list-view" className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oficina</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgendamentos.length === 0 ? (
                <tr>
                  <td className="px-6 py-4 text-center text-sm text-gray-500" colSpan={6}>Nenhum agendamento encontrado com os filtros aplicados.</td>
                </tr>
              ) : (
                filteredAgendamentos.map((agendamento, index) => {
                  const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId);
                  const educador = dados.educadores.find(e => e.id === agendamento.educadorId);
                  const turma = dados.turmas.find(t => t.id === agendamento.turmaId);
                  const dataAg = new Date(agendamento.data + 'T00:00:00');
                  const hoje = new Date(); hoje.setHours(0,0,0,0);
                  const isPast = dataAg < hoje;

                  return (
                    <tr
                      key={agendamento.id}
                      className={`${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'} ${isPast ? 'text-gray-500 italic' : ''} hover:bg-indigo-50 transition duration-150 ease-in-out`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>{dataAg.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agendamento.horaInicio} - {agendamento.horaFim}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{oficina?.nome || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{educador?.nome || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{turma?.nome || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEdit(agendamento)} className="text-indigo-600 hover:text-indigo-800 mr-4 transition duration-150 ease-in-out" title="Editar"><FontAwesomeIcon icon={faEdit} size="lg" /></button>
                        <button onClick={() => handleDelete(agendamento.id)} className="text-red-600 hover:text-red-800 transition duration-150 ease-in-out" title="Excluir"><FontAwesomeIcon icon={faTrashAlt} size="lg" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'calendar' && (
         <div id="calendar-view-container" className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
            <div style={{ height: 600 }}> {/* Set a height for the calendar */}
                <Calendar
                    localizer={localizer} // Ensure localizer is passed only once
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    culture='pt-BR'
                    style={{ height: '100%' }}
                    onSelectEvent={event => handleEdit(event.resource)}
                    // Controlled props for navigation and view
                    view={calendarView}
                    date={calendarNavDate}
                    onView={handleCalendarView}
                    onNavigate={handleCalendarNavigate}
                    // Messages
                    messages={{
                        next: "Próximo",
                        previous: "Anterior",
                        today: "Hoje",
                        month: "Mês",
                        week: "Semana",
                        day: "Dia",
                        agenda: "Agenda",
                        date: "Data",
                        time: "Hora",
                        event: "Evento",
                        noEventsInRange: "Não há eventos neste período.",
                        showMore: (total: number) => `+ Ver mais (${total})`
                    }}
                />
            </div>
         </div>
      )}

      {/* Modal for Add/Edit Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={isEditing ? 'Editar Agendamento' : 'Adicionar Novo Agendamento'}
      >
         <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Oficina, Educador, Turma */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="modal-oficinaId" className="block text-sm font-medium text-gray-700">Oficina</label>
              <select id="modal-oficinaId" name="oficinaId" value={currentAgendamento.oficinaId || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2">
                <option value="">Selecione...</option>
                {dados.oficinas.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="modal-educadorId" className="block text-sm font-medium text-gray-700">Educador</label>
              <select id="modal-educadorId" name="educadorId" value={currentAgendamento.educadorId || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2">
                <option value="">Selecione...</option>
                 {dados.educadores.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="modal-turmaId" className="block text-sm font-medium text-gray-700">Turma</label>
              <select id="modal-turmaId" name="turmaId" value={currentAgendamento.turmaId || ''} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2">
                <option value="">Selecione...</option>
                 {dados.turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </div>
          </div>
          {/* Row 2: Dates, Horarios */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Dates Input */}
             <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEditing ? 'Data' : 'Datas'}
                </label>
                <div id="modal-agendamento-datas-container" className="space-y-2 max-h-32 overflow-y-auto">
                    {dates.map((date, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => handleDateChange(index, e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
                                required={!isEditing && index === 0}
                                disabled={isEditing}
                            />
                            {!isEditing && dates.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeDateField(index)}
                                    className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 rounded-full hover:bg-red-100 transition duration-150 ease-in-out"
                                    title="Remover Data"
                                >
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {!isEditing && (
                    <button
                        type="button"
                        onClick={addDateField}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 inline-flex items-center transition duration-150 ease-in-out"
                    >
                        <FontAwesomeIcon icon={faPlusCircle} className="mr-1" /> Adicionar outra data
                    </button>
                )}
            </div>
            {/* Horarios */}
            <div>
              <label htmlFor="modal-horaInicio" className="block text-sm font-medium text-gray-700">Horário de Início</label>
              <input type="time" id="modal-horaInicio" name="horaInicio" value={currentAgendamento.horaInicio} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2" />
            </div>
            <div>
              <label htmlFor="modal-horaFim" className="block text-sm font-medium text-gray-700">Horário de Término</label>
              <input type="time" id="modal-horaFim" name="horaFim" value={currentAgendamento.horaFim} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2" />
            </div>
          </div>
          {/* Row 3: Observacoes */}
          <div>
            <label htmlFor="modal-observacoes" className="block text-sm font-medium text-gray-700">Observações (opcional)</label>
            <textarea id="modal-observacoes" name="observacoes" value={currentAgendamento.observacoes || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"></textarea>
          </div>
          {/* Row 4: Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
            {/* Refined Secondary Button Style */}
            <button type="button" onClick={resetForm} className="inline-flex justify-center py-2 px-5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                Cancelar
              </button>
            {/* Refined Primary Button Style */}
            <button type="submit" className="inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
              {isEditing ? 'Salvar Alterações' : 'Adicionar Agendamento(s)'}
            </button>
          </div>
        </form>
      </Modal>

    </div> // End of the main return div
  );
};

export default AgendamentosPage;
