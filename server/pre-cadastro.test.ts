import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read source files
const formularioSource = readFileSync(
  join(__dirname, '../client/src/components/FormularioGestante.tsx'),
  'utf-8'
);
const preCadastroSource = readFileSync(
  join(__dirname, '../client/src/pages/PreCadastro.tsx'),
  'utf-8'
);
const gestantesLayoutSource = readFileSync(
  join(__dirname, '../client/src/components/GestantesLayout.tsx'),
  'utf-8'
);
const appSource = readFileSync(
  join(__dirname, '../client/src/App.tsx'),
  'utf-8'
);

describe('Campos obrigatórios no FormularioGestante', () => {
  it('deve validar nome como obrigatório', () => {
    expect(formularioSource).toContain("errors.nome = 'Nome é obrigatório'");
  });

  it('deve validar data de nascimento como obrigatória', () => {
    expect(formularioSource).toContain("errors.dataNascimento = 'Data de nascimento é obrigatória'");
  });

  it('deve validar e-mail como obrigatório', () => {
    expect(formularioSource).toContain("errors.email = 'E-mail é obrigatório'");
  });

  it('deve validar telefone como obrigatório', () => {
    expect(formularioSource).toContain("errors.telefone = 'Telefone é obrigatório'");
  });

  it('deve validar altura como obrigatória', () => {
    expect(formularioSource).toContain("errors.altura = 'Altura é obrigatória'");
  });

  it('deve validar peso inicial como obrigatório', () => {
    expect(formularioSource).toContain("errors.pesoInicial = 'Peso ao engravidar é obrigatório'");
  });

  it('deve ter fieldErrors com todos os campos obrigatórios', () => {
    expect(formularioSource).toContain('nome?: string');
    expect(formularioSource).toContain('dataNascimento?: string');
    expect(formularioSource).toContain('email?: string');
    expect(formularioSource).toContain('telefone?: string');
    expect(formularioSource).toContain('altura?: string');
    expect(formularioSource).toContain('pesoInicial?: string');
  });

  it('deve exibir asterisco vermelho nos campos obrigatórios', () => {
    // Telefone
    expect(formularioSource).toContain('Telefone <span className="text-red-500">*</span>');
    // Altura
    expect(formularioSource).toContain('Altura (cm) <span className="text-red-500">*</span>');
    // Peso
    expect(formularioSource).toContain('Peso Inicial (kg) <span className="text-red-500">*</span>');
  });
});

describe('Página PreCadastro', () => {
  it('deve ter todos os campos obrigatórios', () => {
    expect(preCadastroSource).toContain("errors.nome = ");
    expect(preCadastroSource).toContain("errors.dataNascimento = ");
    expect(preCadastroSource).toContain("errors.telefone = ");
    expect(preCadastroSource).toContain("errors.email = ");
    expect(preCadastroSource).toContain("errors.planoSaudeId = ");
    expect(preCadastroSource).toContain("errors.altura = ");
    expect(preCadastroSource).toContain("errors.pesoInicial = ");
  });

  it('deve ter alerta evidente sobre peso ao engravidar', () => {
    expect(preCadastroSource).toContain('ATENÇÃO: Peso ao Engravidar');
    expect(preCadastroSource).toContain('peso da paciente QUANDO ENGRAVIDOU');
    expect(preCadastroSource).toContain('NÃO o peso de hoje');
  });

  it('deve ter campo de peso com destaque visual (borda amber)', () => {
    expect(preCadastroSource).toContain('border-amber-400');
    expect(preCadastroSource).toContain('bg-amber-50');
  });

  it('deve ter lembrete abaixo do campo de peso', () => {
    expect(preCadastroSource).toContain('Peso QUANDO ENGRAVIDOU, não o peso atual!');
  });

  it('deve usar GestantesLayout', () => {
    expect(preCadastroSource).toContain('GestantesLayout');
  });

  it('deve ter botão de voltar', () => {
    expect(preCadastroSource).toContain('ArrowLeft');
  });

  it('deve suportar adicionar e editar gestantes', () => {
    expect(preCadastroSource).toContain('"add" | "edit"');
    expect(preCadastroSource).toContain('createMutation');
    expect(preCadastroSource).toContain('updateMutation');
  });

  it('deve mostrar campos faltantes na lista', () => {
    expect(preCadastroSource).toContain('missingFields');
    expect(preCadastroSource).toContain('Faltam:');
  });
});

describe('Menu Pré-Cadastro no sidebar', () => {
  it('deve ter item Pré-Cadastro no menu', () => {
    expect(gestantesLayoutSource).toContain('"Pré-Cadastro"');
  });

  it('deve ter path /pre-cadastro', () => {
    expect(gestantesLayoutSource).toContain('"/pre-cadastro"');
  });

  it('deve ser visível apenas para secretária', () => {
    // Encontrar a linha do Pré-Cadastro e verificar que roles contém apenas secretaria
    const preCadastroLine = gestantesLayoutSource
      .split('\n')
      .find(line => line.includes('"Pré-Cadastro"'));
    expect(preCadastroLine).toBeDefined();
    expect(preCadastroLine).toContain("'secretaria'");
    // Não deve conter admin, obstetra ou superadmin
    expect(preCadastroLine).not.toContain("'admin'");
    expect(preCadastroLine).not.toContain("'obstetra'");
    expect(preCadastroLine).not.toContain("'superadmin'");
  });

  it('deve ser o primeiro item do menu', () => {
    const menuStart = gestantesLayoutSource.indexOf('const allMenuItems = [');
    const firstItem = gestantesLayoutSource.indexOf('"Pré-Cadastro"', menuStart);
    const secondItem = gestantesLayoutSource.indexOf('"Gestantes"', menuStart);
    expect(firstItem).toBeLessThan(secondItem);
  });

  it('deve usar ícone ClipboardPlus', () => {
    expect(gestantesLayoutSource).toContain('ClipboardPlus');
    const preCadastroLine = gestantesLayoutSource
      .split('\n')
      .find(line => line.includes('"Pré-Cadastro"'));
    expect(preCadastroLine).toContain('ClipboardPlus');
  });
});

describe('Rota /pre-cadastro no App.tsx', () => {
  it('deve ter rota para /pre-cadastro', () => {
    expect(appSource).toContain('"/pre-cadastro"');
  });

  it('deve importar PreCadastro', () => {
    expect(appSource).toContain('import PreCadastro');
  });

  it('deve ter RoleGuard com secretaria', () => {
    const routeSection = appSource.substring(
      appSource.indexOf('"/pre-cadastro"'),
      appSource.indexOf('"/pre-cadastro"') + 200
    );
    expect(routeSection).toContain('secretaria');
  });
});
