interface Stats {
  totalClientes: number;
  totalArquivos: number;
  enviosHoje: number;
}

export default function StatsGrid({ stats }: { stats: Stats }) {
  const items = [
    { label: "Clientes", value: stats.totalClientes },
    { label: "Arquivos recebidos", value: stats.totalArquivos },
    { label: "Envios hoje", value: stats.enviosHoje },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {items.map((item) => (
        <div key={item.label} className="glass-card px-[18px] py-4">
          <div className="text-2xl font-bold tracking-[-0.5px]">{item.value}</div>
          <div className="text-xs text-text-2 mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
