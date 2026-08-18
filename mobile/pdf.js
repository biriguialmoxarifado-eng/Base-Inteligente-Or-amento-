// mobile/pdf.js
// Geração de PDF da ficha de EPI no cliente (jsPDF). Não armazena
// imagem biométrica bruta — só a confirmação/método de identificação
// e os dados necessários para auditoria (ver seção 13 do prompt).
import { toast, fmtDate, fmtDateTime } from './ui-kit.js';
import { CONFIG } from '../core/config.js';

export function gerarFichaPDF(ficha, item, colaborador) {
  if (!window.jspdf) { toast('Biblioteca de PDF não carregou.', 'err'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16); doc.text(CONFIG.APP_NAME, 14, 18);
  doc.setFontSize(10); doc.setTextColor(90); doc.text(CONFIG.APP_TAGLINE, 14, 24);
  doc.setTextColor(0); doc.setFontSize(12); doc.text('Ficha de Entrega de EPI', 14, 33);
  doc.setDrawColor(200); doc.line(14, 37, 196, 37);

  let y = 47;
  const linha = (k, v) => { doc.setFontSize(10); doc.text(`${k}:`, 14, y); doc.text(String(v), 75, y); y += 8; };
  linha('Nome do colaborador', colaborador.nome);
  linha('Matrícula', colaborador.matricula);
  linha('Função', colaborador.funcao);
  linha('Obra', colaborador.obra);
  linha('Data', fmtDate(ficha.data));
  linha('Hora', ficha.hora || new Date(ficha.data).toLocaleTimeString('pt-BR'));
  y += 2; doc.line(14, y, 196, y); y += 10;

  linha('Produto', item ? item.nome : ficha.itemId);
  linha('CA', item ? item.ca : '—');
  linha('Quantidade', `${ficha.qtd} ${item ? item.unidade : ''} (${ficha.tamanho || '—'})`);
  linha('Código', item ? item.codigo : '—');
  linha('Nº da solicitação', ficha.solicitacaoId);
  y += 2; doc.line(14, y, 196, y); y += 10;

  doc.setFont(undefined, 'bold'); doc.text('CONFIRMAÇÃO DE IDENTIDADE', 14, y); doc.setFont(undefined, 'normal'); y += 8;
  linha('Método', ficha.metodo);
  linha('Data/hora da autenticação', fmtDateTime(ficha.data));
  linha('Identificador da autenticação', ficha.id);
  linha('Status', 'IDENTIDADE CONFIRMADA');
  y += 14;

  doc.line(14, y, 90, y); doc.setFontSize(8); doc.text('Assinatura / confirmação do colaborador', 14, y + 5);
  doc.line(110, y, 186, y); doc.text('Confirmação do responsável', 110, y + 5);

  doc.save(`ficha_epi_${ficha.solicitacaoId}.pdf`);
  toast('PDF gerado.', 'ok');
}
