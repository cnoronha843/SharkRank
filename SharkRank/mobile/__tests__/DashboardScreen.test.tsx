import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DashboardScreen } from '../src/screens/DashboardScreen';

// Fazendo Mock da API para não depender de internet no teste
jest.mock('../src/services/api', () => ({
  api: {
    getArenaRanking: jest.fn(() => Promise.resolve({ ranking: [] })),
    getCalibrationReport: jest.fn(() => Promise.resolve(null)),
  }
}));

// Fazendo Mock do sistema de Flags
jest.mock('../src/services/flags', () => ({
  getFlag: jest.fn(() => false),
}));

describe('DashboardScreen - Home', () => {
  it('renderiza os textos principais e as Ações Rápidas', async () => {
    render(<DashboardScreen />);
    
    // Verifica a saudação e o subtítulo
    expect(await screen.findByText('Olá! 👋')).toBeTruthy();
    expect(screen.getByText('Painel de telemetria SharkRank')).toBeTruthy();

    // Verifica se os botões de ação rápida estão renderizando
    expect(screen.getByText('Ações Rápidas')).toBeTruthy();
    expect(screen.getByText('Nova Partida')).toBeTruthy();
    expect(screen.getByText('Novo Atleta')).toBeTruthy();
    expect(screen.getByText('Quadras')).toBeTruthy();
  });

  it('renderiza o placar das Últimas Partidas corretamente', async () => {
    render(<DashboardScreen />);
    
    // Verifica o título da seção
    expect(await screen.findByText('Últimas Partidas')).toBeTruthy();

    // Verifica os status e times
    expect(screen.getByText('Ao Vivo')).toBeTruthy();
    expect(screen.getByText('Rafa & Gui')).toBeTruthy();
    expect(screen.getByText('Carlão & Lucas')).toBeTruthy();
  });
});
