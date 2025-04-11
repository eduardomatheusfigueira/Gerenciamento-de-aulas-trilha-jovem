import React from 'react';
import { useData } from '../context/DataContext'; // Import the hook
import { FaChalkboardTeacher, FaUsers, FaCalendarAlt, FaClock, FaCheckCircle } from 'react-icons/fa'; // Import icons + new ones
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import { format } from 'date-fns/format'; // Named import
import { parse } from 'date-fns/parse'; // Named import
import { startOfWeek } from 'date-fns/startOfWeek'; // Named import
import { getDay } from 'date-fns/getDay'; // Named import
import { differenceInMinutes, isPast } from 'date-fns'; // Add date calculation/comparison
import { ptBR } from 'date-fns/locale/pt-BR'; // Named import

// Setup the localizer by providing the required functions
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

// Define the structure for calendar events based on react-big-calendar's Event interface
interface CalendarEvent extends Event {
  id: number; // Or string, matching Agendamento['id']
  title: string;
  start: Date;
  end: Date;
  resource?: any; // Optional: Can hold original agendamento data
}


const DashboardPage: React.FC = () => {
  const { dados, isLoading } = useData(); // Use the hook to get state and loading status

  if (isLoading) {
    return <div className="p-6">Carregando dados...</div>; // Show loading indicator
  }

  // Map Agendamentos to Calendar Events
  const calendarEvents: CalendarEvent[] = dados.agendamentos.map(agendamento => {
    const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId);
    const turma = dados.turmas.find(t => t.id === agendamento.turmaId);

    const title = `${oficina?.nome || 'Oficina Desconhecida'} - ${turma?.nome || 'Turma Desconhecida'}`;
    
    // Combine date and time strings and parse them into Date objects
    const startDateStr = `${agendamento.data} ${agendamento.horaInicio}`;
    const endDateStr = `${agendamento.data} ${agendamento.horaFim}`;
    
    // Assuming YYYY-MM-DD HH:MM format
    const start = parse(startDateStr, 'yyyy-MM-dd HH:mm', new Date());
    const end = parse(endDateStr, 'yyyy-MM-dd HH:mm', new Date());

    return {
      id: agendamento.id,
      title: title,
      start: start,
      end: end,
      resource: agendamento // Store original data if needed
    };
  }).filter(event => event.start && event.end && !isNaN(event.start.getTime()) && !isNaN(event.end.getTime())); // Ensure dates are valid before filtering

  // --- Summary Card Calculations ---
  const totalAgendamentos = dados.agendamentos.length;
  const totalHorasAlocadas = totalAgendamentos * 4; // Assuming 4 hours per agendamento

  let totalHorasMinistradas = 0;
  const now = new Date();

  dados.agendamentos.forEach(agendamento => {
    try {
      const endDateTime = parse(`${agendamento.data} ${agendamento.horaFim}`, 'yyyy-MM-dd HH:mm', new Date());
      if (!isNaN(endDateTime.getTime()) && isPast(endDateTime)) {
         const startDateTime = parse(`${agendamento.data} ${agendamento.horaInicio}`, 'yyyy-MM-dd HH:mm', new Date());
         if (!isNaN(startDateTime.getTime())) {
            const durationMinutes = differenceInMinutes(endDateTime, startDateTime);
            totalHorasMinistradas += durationMinutes / 60;
         }
      }
    } catch (e) {
      console.error("Error parsing date/time for duration calculation:", e, agendamento);
    }
  });
  // Round to 1 decimal place for display
  totalHorasMinistradas = Math.round(totalHorasMinistradas * 10) / 10;
  // --- End Summary Card Calculations ---


  return (
    <div className="p-6"> {/* Added padding to the main container */}
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Dashboard</h2> {/* Increased bottom margin */}
      
      {/* Summary Table */}
      <div className="mb-8 overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                   <FaChalkboardTeacher className="mr-2 text-blue-600" /> Oficinas
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 <div className="flex items-center">
                    <FaUsers className="mr-2 text-green-600" /> Educadores
                 </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 <div className="flex items-center">
                    <FaCalendarAlt className="mr-2 text-yellow-600" /> Agendamentos
                 </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 <div className="flex items-center">
                    <FaClock className="mr-2 text-purple-600" /> Horas Alocadas
                 </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 <div className="flex items-center">
                    <FaCheckCircle className="mr-2 text-teal-600" /> Horas Ministradas
                 </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-gray-900">{dados.oficinas.length}</td>
              <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-gray-900">{dados.educadores.length}</td>
              <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-gray-900">{totalAgendamentos}</td>
              <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-gray-900">{totalHorasAlocadas}</td>
              <td className="px-6 py-4 whitespace-nowrap text-2xl font-bold text-gray-900">{totalHorasMinistradas}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Placeholder for Dashboard Calendar */}
      {/* Calendar Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-8 border border-gray-200"> {/* Reduced padding for calendar */}
         <h3 className="text-xl font-bold mb-4 text-indigo-700">Calendário de Agendamentos</h3>
         <div style={{ height: 500 }}> {/* Set a height for the calendar container */}
           <Calendar
             localizer={localizer}
             events={calendarEvents}
             startAccessor="start"
             endAccessor="end"
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
                showMore: (total: number) => `+ Ver mais (${total})` // Added type for total
             }}
             culture='pt-BR' // Set culture for messages
             style={{ height: '100%' }}
           />
         </div>
      </div>

      {/* Placeholder for Próximos Agendamentos */}
      {/* --- Removed Upcoming Appointments Section --- */}

    </div>
  );
};

export default DashboardPage;
