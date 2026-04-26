import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SharkVisionScreen } from '../src/screens/SharkVisionScreen';

describe('SharkVisionScreen', () => {
  it('renders the screen title and subtitle correctly', () => {
    render(<SharkVisionScreen />);
    
    // Verifica se o título da tela e o subtítulo existem
    expect(screen.getByText('SharkVision')).toBeTruthy();
    expect(screen.getByText('Galeria de Replays e Destaques')).toBeTruthy();
  });

  it('renders the dummy video list correctly', () => {
    render(<SharkVisionScreen />);
    
    // Verifica se os replays mockados estão na tela
    expect(screen.getByText('Rafa vs Matheus - Set 1')).toBeTruthy();
    expect(screen.getByText('Carlão vs Lucas - Match Point')).toBeTruthy();
  });
});
