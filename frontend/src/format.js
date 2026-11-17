export const brl = (n) => Number(n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const data = (iso) => iso.split('-').reverse().join('/');
