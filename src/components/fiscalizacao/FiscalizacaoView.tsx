import React, { useState, useEffect } from 'react';
import { TabletAppView } from './TabletAppView';
import { TermosInspecaoView } from './TermosInspecaoView';

interface FiscalizacaoViewProps {
  initialTab?: 'eletronica' | 'termo_inspecao';
  onTabChange?: (tab: 'eletronica' | 'termo_inspecao') => void;
  onExitFiscalizacao?: () => void;
  isTopBarHidden?: boolean;
  onToggleTopBar?: () => void;
}

export const FiscalizacaoView: React.FC<FiscalizacaoViewProps> = ({
  initialTab = 'eletronica',
  onTabChange,
  onExitFiscalizacao,
  isTopBarHidden,
  onToggleTopBar
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'eletronica' | 'termo_inspecao'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSelect = (tab: 'eletronica' | 'termo_inspecao') => {
    setActiveSubTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // 1. Sub-seção: Termo de Inspeção (Todos os Termos, Intimações, Notificações, Autos, Filtros)
  if (activeSubTab === 'termo_inspecao') {
    return (
      <div className="relative animate-in fade-in duration-150">
        <TermosInspecaoView />
      </div>
    );
  }

  // 2. Sub-seção: Fiscalização Eletrônica (Tablet App de Campo)
  return (
    <div className="relative animate-in fade-in duration-150">
      <TabletAppView 
        onSwitchToWebAdmin={() => handleTabSelect('termo_inspecao')}
        onExitFiscalizacao={onExitFiscalizacao}
        isTopBarHidden={isTopBarHidden}
        onToggleTopBar={onToggleTopBar}
      />
    </div>
  );
};
