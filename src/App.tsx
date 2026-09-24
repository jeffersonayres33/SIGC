import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, MainSection } from './components/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProfissionaisView } from './components/cadastros/ProfissionaisView';
import { EmpresasView } from './components/cadastros/EmpresasView';
import { CadastrosBasicosView } from './components/cadastros/CadastrosBasicosView';
import { FinanceiroView } from './components/financeiro/FinanceiroView';
import { JuridicoView } from './components/juridico/JuridicoView';
import { FiscalizacaoView } from './components/fiscalizacao/FiscalizacaoView';
import { RelatoriosView } from './components/relatorios/RelatoriosView';
import { FormulariosView } from './components/formularios/FormulariosView';
import { ProtocolosView } from './components/protocolos/ProtocolosView';
import { PortalView } from './components/portal/PortalView';
import { MicrosservicosView } from './components/arquitetura/MicrosservicosView';
import { ConfiguracoesView } from './components/configuracoes/ConfiguracoesView';
import { ToastContainer } from './components/common/ToastContainer';

import { CrtModal } from './components/modals/CrtModal';
import { BoletoPixModal } from './components/modals/BoletoPixModal';
import { CdaModal } from './components/modals/CdaModal';
import { SupabaseManagerModal } from './components/common/SupabaseManagerModal';

import { UserRole, Empresa, LancamentoFinanceiro, ProcessoCobranca } from './types';
import { storageService } from './services/storageService';
import { toastService } from './services/toastService';

export default function App() {
  const [activeSection, setActiveSection] = useState<MainSection>('dashboard');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('DIRETORIA');
  const [networkStatus, setNetworkStatus] = useState(storageService.getNetworkStatus());
  const [councilConfig, setCouncilConfig] = useState(storageService.getCouncilConfig());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Modals state
  const [crtEmpresa, setCrtEmpresa] = useState<Empresa | null>(null);
  const [boletoLancamento, setBoletoLancamento] = useState<LancamentoFinanceiro | null>(null);
  const [cdaProcesso, setCdaProcesso] = useState<ProcessoCobranca | null>(null);

  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setNetworkStatus(storageService.getNetworkStatus());
      setCouncilConfig(storageService.getCouncilConfig());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSyncOffline = () => {
    const syncedCount = storageService.syncOfflineQueue();
    setNetworkStatus(storageService.getNetworkStatus());
    if (syncedCount > 0) {
      toastService.success(
        'Sincronização Concluída',
        `${syncedCount} termos e autos fiscais sincronizados com o servidor central.`
      );
    } else {
      toastService.info('Fila Vazia', 'Nenhum registro pendente para sincronização.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentRole={currentUserRole}
        onRoleChange={setCurrentUserRole}
        networkStatus={networkStatus}
        onSyncOffline={handleSyncOffline}
        activeModule={activeSection}
        councilConfig={councilConfig}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => {
          setActiveSection('configuracoes');
          setIsSidebarOpen(false);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Sidebar Drawer */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={(section) => {
            setActiveSection(section);
            setIsSidebarOpen(false);
          }}
          currentRole={currentUserRole}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          councilConfig={councilConfig}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {activeSection === 'dashboard' && (
              <DashboardView onNavigate={(sec) => setActiveSection(sec)} />
            )}

            {activeSection === 'profissionais' && (
              <ProfissionaisView onOpenBoletoPix={setBoletoLancamento} />
            )}

            {activeSection === 'empresas' && (
              <EmpresasView onOpenCrtModal={setCrtEmpresa} onOpenBoletoPix={setBoletoLancamento} />
            )}

            {activeSection === 'cadastros_basicos' && (
              <CadastrosBasicosView />
            )}

            {activeSection === 'financeiro' && (
              <FinanceiroView onOpenBoletoPix={setBoletoLancamento} />
            )}

            {activeSection === 'cobranca_juridico' && (
              <JuridicoView onOpenCdaModal={setCdaProcesso} />
            )}

            {activeSection === 'fiscalizacao' && (
              <FiscalizacaoView />
            )}

            {activeSection === 'relatorios' && (
              <RelatoriosView />
            )}

            {activeSection === 'formularios' && (
              <FormulariosView />
            )}

            {activeSection === 'protocolos' && (
              <ProtocolosView />
            )}

            {activeSection === 'portal_inscrito' && (
              <PortalView
                onOpenBoletoPix={setBoletoLancamento}
                onOpenCrtModal={setCrtEmpresa}
              />
            )}

            {activeSection === 'configuracoes' && (
              <ConfiguracoesView />
            )}

            {activeSection === 'microsservicos' && (
              <MicrosservicosView />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <CrtModal
        empresa={crtEmpresa}
        onClose={() => setCrtEmpresa(null)}
      />

      <BoletoPixModal
        lancamento={boletoLancamento}
        onClose={() => setBoletoLancamento(null)}
      />

      <CdaModal
        cobranca={cdaProcesso}
        onClose={() => setCdaProcesso(null)}
      />

      <SupabaseManagerModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Global Toast Alerts */}
      <ToastContainer />
    </div>
  );
}
