const fs = require('fs');
let code = fs.readFileSync('src/components/Admin/DashboardTab.tsx', 'utf8');

const targetStr = `        </div>
      </section>

      {/* EVENT MODAL */}`;

const replaceStr = `        </div>
      </section>

      {/* BLOCO 07: FATURAMENTO & PEDIDOS POR ATELIÊ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {atelierMetrics.map(atelier => (
          <div key={atelier.id} className="clean-3d-card p-4 flex flex-col justify-between border border-slate-100/50 relative overflow-hidden group">
            {/* Soft decorative background glow */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full blur-2xl opacity-50 pointer-events-none" />
            
            <div className="mb-4">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-tight truncate">{atelier.name}</h4>
              <div className="w-6 h-[2px] bg-slate-200 mt-2 rounded-full" />
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pedidos</p>
                <p className="text-sm font-black text-slate-700">{atelier.count.toString().padStart(2, '0')}</p>
              </div>
              
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Faturamento</p>
                <p className="text-sm font-black text-slate-700">{formatCurrency(atelier.revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* EVENT MODAL */}`;

if(code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/Admin/DashboardTab.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Target string not found!");
}
