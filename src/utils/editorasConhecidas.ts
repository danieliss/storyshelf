// src/utils/editorasConhecidas.ts
const editorasConhecidas = [
    'companhia das letras',
    'penguin',
    'record',
    'principis',
    'rocco',
    'intrínseca',
    'sextante',
    'arqueiro',
    'globo livros',
    'planeta',
    'harpercollins',
    'suma',
    'todavia',
    'zahar',
    'globo',
    'lvm',
    'l&pm',
    'nova fronteira',
    'martins fontes',
    'darkside',
    'leya',
    'novo século',
    'vestígio',
    'editora 34',
    'wmf martins fontes',
  ]
  
  export function ehEditoraConhecida(nomeEditora: string): boolean {
    const normalizado = nomeEditora.toLowerCase().trim()
    return editorasConhecidas.some((editora) => normalizado.includes(editora))
  }