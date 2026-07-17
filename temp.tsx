  // Birthday reminder for upcoming 7 days
  const birthdayCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!c.birthDate) return false;
      try {
        const parts = c.birthDate.split("/");
        if (parts.length < 2) return false;
        const [day, month] = parts;
        const currentYear = new Date().getFullYear();
        const birthDate = new Date(
          currentYear,
          parseInt(month) - 1,
          parseInt(day)
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        nextWeek.setHours(23, 59, 59, 999);
        return birthDate >= today && birthDate <= nextWeek;
      } catch (e) {
        return false;
      }
    });
  }, [customers]);

  // Global customer metrics map for quick summary, optimized using O(N+M) mapping
  const customerMetricsMap = useMemo(() => {
    const map = new Map<string, {
      activeOrders: number;
      lastPurchaseDate: Date | null;
      isRecurrent: boolean;
      topProducts: string[];
      metrics: any;
    }>();

    // Map sales by normalized match identifiers (phone, CPF/CNPJ, and lowercase trimmed name)
    const salesByCustomerId = new Map<string, any[]>();
    const salesByPhone = new Map<string, any[]>();
    const salesByCpf = new Map<string, any[]>();
    const salesByName = new Map<string, any[]>();

    sales.forEach((o) => {
      const orderCustomerId = o.customerId;
      const orderPhone = o.contact ? o.contact.replace(/\D/g, "") : "";
      const orderCpf = o.customerCpfCnpj ? o.customerCpfCnpj.replace(/\D/g, "") : "";
      const orderName = o.customerName ? o.customerName.toLowerCase().trim() : "";

      if (orderCustomerId) {
        if (!salesByCustomerId.has(orderCustomerId)) salesByCustomerId.set(orderCustomerId, []);
        salesByCustomerId.get(orderCustomerId)!.push(o);
      }
      if (orderPhone) {
        if (!salesByPhone.has(orderPhone)) salesByPhone.set(orderPhone, []);
        salesByPhone.get(orderPhone)!.push(o);
      }
      if (orderCpf) {
        if (!salesByCpf.has(orderCpf)) salesByCpf.set(orderCpf, []);
        salesByCpf.get(orderCpf)!.push(o);
      }
      if (orderName) {
        if (!salesByName.has(orderName)) salesByName.set(orderName, []);
        salesByName.get(orderName)!.push(o);
      }
    });

    customers.forEach((c) => {
      const cleanPhone = c.contact ? c.contact.replace(/\D/g, "") : "";
      const cleanCpf = c.cpfCnpj ? c.cpfCnpj.replace(/\D/g, "") : "";
      const lowerName = c.name ? c.name.toLowerCase().trim() : "";

      // Deduplicate matching orders using a Set to prevent double counting
      const matchedSalesSet = new Set<any>();

      if (c.id && salesByCustomerId.has(c.id)) {
        salesByCustomerId.get(c.id)!.forEach((o) => matchedSalesSet.add(o));
      }
      if (cleanPhone && salesByPhone.has(cleanPhone)) {
        salesByPhone.get(cleanPhone)!.forEach((o) => matchedSalesSet.add(o));
      }
      if (cleanCpf && salesByCpf.has(cleanCpf)) {
        salesByCpf.get(cleanCpf)!.forEach((o) => matchedSalesSet.add(o));
      }
      if (lowerName && salesByName.has(lowerName)) {
        salesByName.get(lowerName)!.forEach((o) => matchedSalesSet.add(o));
      }

      const cSales = Array.from(matchedSalesSet);

      let activeCount = 0;
      let lastDate: Date | null = null;
      const productsMap: { [name: string]: number } = {};

      cSales.forEach((o) => {
        if (["pending", "processing", "production", "shipped"].includes(o.status || "")) {
          activeCount++;
        }
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt || 0);
        if (!lastDate || oDate > lastDate) {
          lastDate = oDate;
        }

        o.items?.forEach((item) => {
          const pName = item.product_name || "Produto";
          productsMap[pName] = (productsMap[pName] || 0) + (item.quantity || 1);
        });
      });

      const topProducts = Object.entries(productsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => entry[0]);

      const metrics = calculateCustomerMetrics(c, cSales);

      map.set(c.id, {
        activeOrders: activeCount,
        lastPurchaseDate: lastDate,
        isRecurrent: cSales.length > 1,
        topProducts,
        metrics
      });
    });

    return map;
