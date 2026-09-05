const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/DashboardTab.tsx', 'utf8');

const regexTotalMetrics = /const activeOrders = useMemo\(\(\) => \{/;

const atelierMetricsCode = `
  const atelierMetrics = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => !['cancelled', 'pending'].includes(o.status));
    const companies = [
      { id: 'pallyra', name: 'La Pallyra' },
      { id: 'guennita', name: 'com amor, Guennita' },
      { id: 'mimada', name: 'Mimada Sim' },
      { id: 'tuttymimo', name: 'Tutty Mimo' },
      { id: 'madrinha', name: 'Madrinha' }
    ];

    return companies.map(company => {
      const companyOrders = completedOrders.filter(o => o.companyId === company.id);
      const count = companyOrders.length;
      const revenue = companyOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return { ...company, count, revenue };
    });
  }, [filteredOrders]);

  const activeOrders = useMemo(() => {`;

code = code.replace(regexTotalMetrics, atelierMetricsCode);

fs.writeFileSync('src/components/Admin/DashboardTab.tsx', code);
