import React, { useState, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { Agendamento } from '../interfaces/Agendamento';

// Define types for report results (can be refined later)
type EducadorReportItem = { educador: string; horas: string; totalAgendamentos: number; oficinasMinistradas: number; ultimosAgendamentos: any[] };
type OficinaReportItem = { oficina: string; cargaHoraria: number; totalAgendamentos: number; horasMinistradas: string; educadores: number; turmas: number };
type TurmaReportItem = { data: string; oficina: string; horario: string; educador: string };

const RelatoriosPage: React.FC = () => {
  const { dados, isLoading } = useData();

  // State for filters
  const [educadorPeriodo, setEducadorPeriodo] = useState<'todos' | 'mes' | 'semana'>('todos');
  const [oficinaPeriodo, setOficinaPeriodo] = useState<'todos' | 'mes' | 'semana'>('todos');
  const [turmaIdFiltro, setTurmaIdFiltro] = useState<string>('');
  const [turmaPeriodo, setTurmaPeriodo] = useState<'todos' | 'mes' | 'semana'>('todos');

  // State for report results
  const [educadorReport, setEducadorReport] = useState<EducadorReportItem[] | null>(null);
  const [oficinaReport, setOficinaReport] = useState<OficinaReportItem[] | null>(null);
  const [turmaReport, setTurmaReport] = useState<{ turmaNome: string; totalHoras: string; totalOficinas: number; totalEducadores: number; totalDias: number; cronograma: TurmaReportItem[] } | null>(null);

  // --- Helper Function to Filter by Period ---
  const filtrarAgendamentosPorPeriodo = useCallback((agendamentos: Agendamento[], periodo: 'todos' | 'mes' | 'semana'): Agendamento[] => {
    if (periodo === 'todos') return agendamentos;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let inicioPeriodo: Date;
    let fimPeriodo: Date;

    if (periodo === 'semana') {
      inicioPeriodo = new Date(hoje);
      inicioPeriodo.setDate(hoje.getDate() - hoje.getDay());
      inicioPeriodo.setHours(0, 0, 0, 0);
      fimPeriodo = new Date(inicioPeriodo);
      fimPeriodo.setDate(inicioPeriodo.getDate() + 6);
      fimPeriodo.setHours(23, 59, 59, 999);
    } else { // mes
      inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      fimPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      fimPeriodo.setHours(23, 59, 59, 999);
    }

    return agendamentos.filter(a => {
      const dataAgendamento = new Date(a.data + 'T00:00:00');
      return dataAgendamento >= inicioPeriodo && dataAgendamento <= fimPeriodo;
    });
  }, []);


  // --- Report Generation Logic ---

  const gerarRelatorioEducador = useCallback(() => {
    const agendamentosFiltrados = filtrarAgendamentosPorPeriodo(dados.agendamentos, educadorPeriodo);
    const horasPorEducador: EducadorReportItem[] = [];

    dados.educadores.forEach(educador => {
      const agendamentosEducador = agendamentosFiltrados.filter(a => a.educadorId === educador.id);
      if (agendamentosEducador.length > 0) {
        let totalMinutos = 0;
        let oficinasMinistradas = new Set<number>();
        let ultimosAgendamentos: any[] = []; // Simplified for now

        agendamentosEducador.sort((a, b) => new Date(`${b.data}T${b.horaInicio}`).getTime() - new Date(`${a.data}T${a.horaInicio}`).getTime());

        agendamentosEducador.forEach(agendamento => {
          const inicio = new Date(`2000-01-01T${agendamento.horaInicio}`);
          const fim = new Date(`2000-01-01T${agendamento.horaFim}`);
          if (inicio < fim) {
            totalMinutos += (fim.getTime() - inicio.getTime()) / (1000 * 60);
          }
          oficinasMinistradas.add(agendamento.oficinaId);
          // Get last 3 (simplified)
          if (ultimosAgendamentos.length < 3) {
             const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId);
             ultimosAgendamentos.push({ data: agendamento.data, oficina: oficina?.nome || '?', horario: `${agendamento.horaInicio}-${agendamento.horaFim}` });
          }
        });

        horasPorEducador.push({
          educador: educador.nome,
          horas: (totalMinutos / 60).toFixed(1),
          totalAgendamentos: agendamentosEducador.length,
          oficinasMinistradas: oficinasMinistradas.size,
          ultimosAgendamentos
        });
      }
    });
    setEducadorReport(horasPorEducador.sort((a, b) => parseFloat(b.horas) - parseFloat(a.horas)));
  }, [dados.agendamentos, dados.educadores, dados.oficinas, educadorPeriodo, filtrarAgendamentosPorPeriodo]);

  const gerarRelatorioOficinas = useCallback(() => {
     const agendamentosFiltrados = filtrarAgendamentosPorPeriodo(dados.agendamentos, oficinaPeriodo);
     const statsOficina: OficinaReportItem[] = [];

     dados.oficinas.forEach(oficina => {
         const agendamentosOficina = agendamentosFiltrados.filter(a => a.oficinaId === oficina.id);
         if (agendamentosOficina.length > 0) {
             let totalMinutos = 0;
             let educadoresUnicos = new Set<number>();
             let turmasUnicas = new Set<number>();

             agendamentosOficina.forEach(agendamento => {
                 const inicio = new Date(`2000-01-01T${agendamento.horaInicio}`);
                 const fim = new Date(`2000-01-01T${agendamento.horaFim}`);
                 if (inicio < fim) {
                     totalMinutos += (fim.getTime() - inicio.getTime()) / (1000 * 60);
                 }
                 educadoresUnicos.add(agendamento.educadorId);
                 turmasUnicas.add(agendamento.turmaId);
             });

             statsOficina.push({
                 oficina: oficina.nome,
                 cargaHoraria: oficina.cargaHoraria,
                 totalAgendamentos: agendamentosOficina.length,
                 horasMinistradas: (totalMinutos / 60).toFixed(1),
                 educadores: educadoresUnicos.size,
                 turmas: turmasUnicas.size
             });
         }
     });
     setOficinaReport(statsOficina.sort((a, b) => b.totalAgendamentos - a.totalAgendamentos));
  }, [dados.agendamentos, dados.oficinas, oficinaPeriodo, filtrarAgendamentosPorPeriodo]);

  const gerarRelatorioTurma = useCallback(() => {
      if (!turmaIdFiltro) {
          setTurmaReport(null); // Clear report if no turma selected
          alert("Selecione uma turma para gerar o relatório.");
          return;
      }
      const turmaNumId = parseInt(turmaIdFiltro, 10);
      const agendamentosFiltrados = filtrarAgendamentosPorPeriodo(dados.agendamentos, turmaPeriodo)
                                      .filter(a => a.turmaId === turmaNumId);

      if (agendamentosFiltrados.length === 0) {
          setTurmaReport(null);
          alert("Nenhum agendamento encontrado para esta turma no período selecionado.");
          return;
      }

      const turma = dados.turmas.find(t => t.id === turmaNumId);
      let totalMinutos = 0;
      const oficinasUnicas = new Set<number>();
      const educadoresUnicos = new Set<number>();
      const diasComOficinas = new Set<string>();
      const cronograma: TurmaReportItem[] = [];

      agendamentosFiltrados.sort((a, b) => new Date(`${a.data}T${a.horaInicio}`).getTime() - new Date(`${b.data}T${b.horaInicio}`).getTime());

      agendamentosFiltrados.forEach(agendamento => {
          const inicio = new Date(`2000-01-01T${agendamento.horaInicio}`);
          const fim = new Date(`2000-01-01T${agendamento.horaFim}`);
          if (inicio < fim) {
              totalMinutos += (fim.getTime() - inicio.getTime()) / (1000 * 60);
          }
          oficinasUnicas.add(agendamento.oficinaId);
          educadoresUnicos.add(agendamento.educadorId);
          diasComOficinas.add(agendamento.data);

          const oficina = dados.oficinas.find(o => o.id === agendamento.oficinaId);
          const educador = dados.educadores.find(e => e.id === agendamento.educadorId);
          const dataAg = new Date(agendamento.data + 'T00:00:00');

          cronograma.push({
              data: dataAg.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }),
              oficina: oficina?.nome || '?',
              horario: `${agendamento.horaInicio} - ${agendamento.horaFim}`,
              educador: educador?.nome || '?'
          });
      });

      setTurmaReport({
          turmaNome: turma?.nome || 'Desconhecida',
          totalHoras: (totalMinutos / 60).toFixed(1),
          totalOficinas: oficinasUnicas.size,
          totalEducadores: educadoresUnicos.size,
          totalDias: diasComOficinas.size,
          cronograma
      });

  }, [dados.agendamentos, dados.turmas, dados.oficinas, dados.educadores, turmaIdFiltro, turmaPeriodo, filtrarAgendamentosPorPeriodo]);


  if (isLoading) {
    return <div>Carregando dados para relatórios...</div>;
  }

  return (
    <div className="p-6"> {/* Added padding */}
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Relatórios</h2> {/* Reduced margin for intro */}
      
      {/* Introduction Text */}
      <p className="text-gray-600 mb-6 text-sm">
        Gere relatórios para visualizar informações consolidadas sobre educadores, oficinas e turmas. Selecione os filtros desejados e clique em "Gerar" para visualizar os dados.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"> {/* Adjusted grid and gap */}
        
        {/* Carga Horária por Educador Section */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Carga Horária por Educador</h3> {/* Consistent heading */}
          <div className="flex space-x-3 mb-4">
             <select 
               value={educadorPeriodo} 
               onChange={(e) => setEducadorPeriodo(e.target.value as typeof educadorPeriodo)}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
             >
                <option value="todos">Todo o período</option>
                <option value="mes">Este mês</option>
                <option value="semana">Esta semana</option>
             </select>
            {/* Refined Primary Button Style */}
            <button onClick={gerarRelatorioEducador} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">Gerar</button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[150px] max-h-96 overflow-y-auto">
            {educadorReport === null && (
                <p className="text-sm text-gray-500 italic">Selecione um período e clique em "Gerar".</p>
            )}
            {educadorReport !== null && educadorReport.length === 0 && (
                 <p className="text-sm text-gray-500 italic">Nenhum dado encontrado para o período selecionado.</p>
            )}
            {educadorReport && educadorReport.length > 0 && (
                <div className="space-y-4">
                    {educadorReport.map(item => (
                         <div key={item.educador} className="border-b border-gray-200 pb-3 last:border-b-0"> {/* Added border color, removed last border */}
                            <div className="flex justify-between items-baseline">
                                <h4 className="font-semibold text-md text-gray-800">{item.educador}</h4>
                                <span className="font-bold text-lg text-indigo-600">{item.horas}h</span>
                            </div>
                             <div className="flex text-xs text-gray-600 mt-1 space-x-3">
                                <span>{item.totalAgendamentos} agendamentos</span>
                                <span>{item.oficinasMinistradas} oficinas</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
        
        {/* Oficinas mais Agendadas Section */}
         <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Oficinas mais Agendadas</h3> {/* Consistent heading */}
           <div className="flex space-x-3 mb-4">
             <select 
               value={oficinaPeriodo} 
               onChange={(e) => setOficinaPeriodo(e.target.value as typeof oficinaPeriodo)}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
             >
                <option value="todos">Todo o período</option>
                <option value="mes">Este mês</option>
                <option value="semana">Esta semana</option>
             </select>
            {/* Refined Primary Button Style */}
            <button onClick={gerarRelatorioOficinas} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">Gerar</button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[150px] max-h-96 overflow-y-auto">
             {oficinaReport === null && (
                <p className="text-sm text-gray-500 italic">Selecione um período e clique em "Gerar".</p>
             )}
             {oficinaReport !== null && oficinaReport.length === 0 && (
                 <p className="text-sm text-gray-500 italic">Nenhum dado encontrado para o período selecionado.</p>
             )}
             {oficinaReport && oficinaReport.length > 0 && (
                 <table className="min-w-full text-sm">
                     <thead className="bg-gray-100">
                         <tr>
                             <th className="text-left py-2 px-3 font-semibold text-gray-600 uppercase tracking-wider">Oficina</th>
                             <th className="text-center py-2 px-3 font-semibold text-gray-600 uppercase tracking-wider">Agend.</th>
                             <th className="text-center py-2 px-3 font-semibold text-gray-600 uppercase tracking-wider">Horas</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200"> {/* Added divide-y */}
                         {oficinaReport.map((item, index) => (
                             <tr key={item.oficina} className={`${index % 2 !== 0 ? 'bg-gray-100' : 'bg-white'} hover:bg-gray-200`}> {/* Added hover */}
                                 <td className="py-2 px-3 font-medium text-gray-800">{item.oficina}</td>
                                 <td className="py-2 px-3 text-center text-gray-600">{item.totalAgendamentos}</td>
                                 <td className="py-2 px-3 text-center text-gray-600">{item.horasMinistradas}h</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             )}
          </div>
        </div>

      </div>

       {/* Agendamentos por Turma Section */}
       <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8 md:col-span-2">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Agendamentos por Turma</h3> {/* Consistent heading */}
           <div className="flex flex-wrap gap-3 mb-4 items-center">
             <select 
               value={turmaIdFiltro} 
               onChange={(e) => setTurmaIdFiltro(e.target.value)}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
             >
                 <option value="">Selecione uma turma...</option>
                 {dados.turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
             </select>
             <select 
               value={turmaPeriodo} 
               onChange={(e) => setTurmaPeriodo(e.target.value as typeof turmaPeriodo)}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white p-2"
             >
                <option value="todos">Todo o período</option>
                <option value="mes">Este mês</option>
                <option value="semana">Esta semana</option>
             </select>
            {/* Refined Primary Button Style */}
            <button onClick={gerarRelatorioTurma} className="inline-flex justify-center py-2 px-5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">Gerar</button>
          </div>
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 min-h-[150px] max-h-[500px] overflow-y-auto">
             {turmaReport === null && (
                <p className="text-sm text-gray-500 italic">Selecione uma turma e período, depois clique em "Gerar".</p>
             )}
             {turmaReport && ( // Check if turmaReport is not null before accessing properties
                <div>
                    <div className="bg-indigo-100 p-3 rounded-md mb-4 text-sm border border-indigo-200">
                        <h4 className="font-semibold text-lg text-indigo-800 mb-1">{turmaReport.turmaNome}</h4>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-xs">
                            <span className="text-indigo-700">Total Horas: <span className="font-medium">{turmaReport.totalHoras}h</span></span>
                            <span className="text-indigo-700">Oficinas: <span className="font-medium">{turmaReport.totalOficinas}</span></span>
                            <span className="text-indigo-700">Educadores: <span className="font-medium">{turmaReport.totalEducadores}</span></span>
                            <span className="text-indigo-700">Dias c/ Aulas: <span className="font-medium">{turmaReport.totalDias}</span></span>
                        </div>
                    </div>
                    <h5 className="font-semibold text-md mb-2 text-gray-700 mt-3">Cronograma:</h5>
                    <ul className="space-y-2">
                        {turmaReport.cronograma.map((item, index) => (
                            <li key={index} className="border-b border-gray-200 pb-2 mb-2 text-sm last:border-b-0 last:pb-0 last:mb-0"> {/* Removed last border/margin */}
                                <div className="font-semibold text-gray-800">{item.data}</div>
                                <div className="pl-2 text-gray-600">{item.horario} - {item.oficina} ({item.educador})</div>
                            </li>
                        ))}
                    </ul>
                </div>
             )}
             {/* Added case for when report exists but cronograma is empty (though unlikely with current logic) */}
             {turmaReport && turmaReport.cronograma.length === 0 && (
                 <p className="text-sm text-gray-500 italic">Nenhum agendamento encontrado para esta turma no período selecionado.</p>
             )}
          </div>
        </div>

    </div>
  );
};

export default RelatoriosPage;
