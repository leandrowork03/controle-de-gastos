const form = document.getElementById('form');
const desc = document.getElementById('desc');
const valor = document.getElementById('valor');
const tipo = document.getElementById('tipo');
const categoria = document.getElementById('categoria');
const data = document.getElementById('data');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const filtroMes = document.getElementById('filtro-mes');
const filtroCategoria = document.getElementById('filtro-categoria');
const lista = document.getElementById('lista');
const totalReceitas = document.getElementById('total-receitas');
const totalDespesas = document.getElementById('total-despesas');
const saldo = document.getElementById('saldo');
const darkbtn = document.getElementById('toggle-dark');
const btnExportarPdf = document.getElementById('btn-exportar-pdf');

let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let editandoIndex = null;

const graficoPizza = new Chart(document.getElementById('grafico-pizza'), {
  type: 'pie',
  data: {
    labels: [],
    datasets: [{ data: [], backgroundColor: [] }]
  },
  options: { responsive: true }
});

const graficoLinha = new Chart(document.getElementById('grafico-linha'), {
  type: 'line',
  data: {
    labels: [],
    datasets: [{ label: 'Saldo', data: [], fill: false, borderColor: 'blue' }]
  },
  options: { responsive: true }
});

darkbtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

const imagens = [
  'url(../assets/model.jpg)',
];

let index = 0;
const header = document.querySelector('header');

function trocarFundo() {
  header.style.backgroundImage = imagens[index];
  index = (index + 1) % imagens.length;
}

trocarFundo();
setInterval(trocarFundo, 5000);

document.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    button.classList.remove("btn-click");
    void button.offsetWidth;
    button.classList.add("btn-click");
  });
});

function salvar() {
  localStorage.setItem('transacoes', JSON.stringify(transacoes));
}

function normalizarData(dataStr) {
  if (dataStr.includes('/')) {
    const [dia, mes, ano] = dataStr.split('/');
    return `${ano}-${mes}-${dia}`;
  }
  return dataStr;
}

function atualizarFiltros() {
  const meses = [...new Set(transacoes.map(t => t.data.slice(0, 7)))];
  filtroMes.innerHTML = `<option value="todos">Todos os meses</option>` +
    meses.map(m => `<option value="${m}">${m}</option>`).join("");
}

function renderizar() {
  lista.innerHTML = "";
  let receitas = 0;
  let despesas = 0;
  let dadosPizza = {};
  let dadosLinha = {};

  const mesSelecionado = filtroMes.value;
  const catSelecionada = filtroCategoria.value;

  transacoes.forEach((t, i) => {
    const dataTransacao = normalizarData(t.data);
    const anoMes = dataTransacao.slice(0, 7);

    const condicaoMes = mesSelecionado === "todos" || anoMes === mesSelecionado;
    const condicaoCat = catSelecionada === "todas" || t.categoria === catSelecionada;

    if (condicaoMes && condicaoCat) {
      const li = document.createElement("li");
      li.innerHTML = `
        <span><b class="desc-dom">${t.descricao}</b>: R$ ${parseFloat(t.valor).toFixed(2)} | <b class="cat-dom">categoria:</b> ${t.categoria} | <b class="data-dom">data:</b> ${t.data}</span>
        <div>
          <button onclick="editar(${i})">✏️</button>
          <button onclick="excluir(${i})" class="btn-delete">🗑️</button>
        </div>
      `;
      lista.appendChild(li);

      if (t.tipo === "receita") receitas += Number(t.valor);
      if (t.tipo === "despesa") despesas += Number(t.valor);

      if (!dadosPizza[t.categoria]) dadosPizza[t.categoria] = 0;
      dadosPizza[t.categoria] += Number(t.valor);

      if (!dadosLinha[anoMes]) dadosLinha[anoMes] = 0;
      dadosLinha[anoMes] += t.tipo === "receita" ? Number(t.valor) : -Number(t.valor);
    }
  });

  totalReceitas.textContent = receitas.toFixed(2);
  totalDespesas.textContent = despesas.toFixed(2);
  saldo.textContent = (receitas - despesas).toFixed(2);

  graficoPizza.data.labels = Object.keys(dadosPizza);
  graficoPizza.data.datasets[0].data = Object.values(dadosPizza);
  graficoPizza.data.datasets[0].backgroundColor = Object.keys(dadosPizza).map(() =>
    `#${Math.floor(Math.random()*16777215).toString(16)}`
  );
  graficoPizza.update();

  graficoLinha.data.labels = Object.keys(dadosLinha).sort();
  graficoLinha.data.datasets[0].data = Object.keys(dadosLinha).sort().map(m => dadosLinha[m]);
  graficoLinha.update();
}

filtroMes.addEventListener('change', renderizar);
filtroCategoria.addEventListener('change', renderizar);
document.addEventListener('DOMContentLoaded', () => {
  atualizarFiltros();
  renderizar();
});

function editar(i) {
  const t = transacoes[i];
  desc.value = t.desc;
  valor.value = t.valor;
  tipo.value = t.tipo;
  categoria.value = t.categoria;
  data.value = t.data;
  editandoIndex = i;
  btnSalvar.textContent = 'Salvar';
  btnCancelar.style.display = 'inline';
  btnCancelar.style.backgroundColor = 'red'
}

function remover(i) {
  transacoes.splice(i, 1);
  salvar();
  renderizar();
  atualizarFiltros();
}

btnCancelar.addEventListener('click', () => {
  editandoIndex = null;
  btnSalvar.textContent = 'Adicionar';
  btnCancelar.style.display = 'none';
  form.reset();
});

form.addEventListener('submit', e => {
  e.preventDefault();

  const novaTransacao = {
    desc: desc.value,
    valor: valor.value,
    tipo: tipo.value,
    categoria: categoria.value,
    data: data.value
  };

  if (editandoIndex !== null) {
    transacoes[editandoIndex] = novaTransacao;
    editandoIndex = null;
    btnSalvar.textContent = 'Adicionar';
    btnCancelar.style.display = 'none';
  } else {
    transacoes.push(novaTransacao);
  }

  salvar();
  renderizar();
  atualizarFiltros();
  form.reset();
});

btnExportarPdf.addEventListener('click', () => {
  const elemento = document.getElementById('area-pdf');
  const options = {
    margin: 10,
    filename: 'controle-de-gastos.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().from(elemento).set(options).save();
});

filtroMes.addEventListener('change', renderizar);
filtroCategoria.addEventListener('change', renderizar);

renderizar();
atualizarFiltros();
