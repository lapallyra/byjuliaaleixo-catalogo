import React from "react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order, CommemorativeDate } from "../../types";
import { safeFormat, safeFormatISO } from "../../lib/dateUtils";
import { ChevronLeft, ChevronRight, User, Hash, Star } from "lucide-react";

// Helper for dynamic dates (copied from CommemorativeDatesTab)
const getMobileDateOccurrence = (mobileId: string, year: number) => {
  if (mobileId === "mothers_day") {
    // 2nd Sunday of May
    const mayFirst = new Date(year, 4, 1);
    const dayOfWeek = mayFirst.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    return { day: 1 + daysUntilSunday + 7, month: 5 };
  }
  if (mobileId === "fathers_day") {
    // 2nd Sunday of August
    const augFirst = new Date(year, 7, 1);
    const dayOfWeek = augFirst.getDay();
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    return { day: 1 + daysUntilSunday + 7, month: 8 };
  }
  if (mobileId === "easter") {
    // Simplified Easter calculation
    return { day: 31, month: 3 }; 
  }
  return { day: 1, month: 1 };
};

const getFullDate = (d: CommemorativeDate, year = new Date().getFullYear()) => {
  if (d.year_fixed) return new Date(year, d.month - 1, d.day);
  if (d.mobile_id) {
    const occurrence = getMobileDateOccurrence(d.mobile_id, year);
    return new Date(year, occurrence.month - 1, occurrence.day);
  }
  return new Date(year, d.month - 1, d.day);
};

interface AgendaTabProps {
  orders: Order[];
  dates: CommemorativeDate[];
  onSelectOrder?: (orderId: string) => void;
}

export const AgendaTab: React.FC<AgendaTabProps> = ({
  orders,
  dates,
  onSelectOrder,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [searchTerm, setSearchTerm] = React.useState("");

  const filteredOrders = orders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.code && o.code.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a function to get a nice background color based on the customer name
  const getOrderStyle = (customerName: string) => {
    const colors = [
      "bg-emerald-500 border-emerald-600",
      "bg-blue-500 border-blue-600",
      "bg-rose-500 border-rose-600",
      "bg-amber-500 border-amber-600",
      "bg-indigo-500 border-indigo-600",
      "bg-violet-500 border-violet-600",
      "bg-orange-500 border-orange-600",
      "bg-purple-500 border-purple-600",
    ];
    let hash = 0;
    for (let i = 0; i < customerName.length; i++) {
      hash = customerName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div
      className="space-y-6"
      style={{ fontFamily: "Tahoma, Verdana, Segoe UI, sans-serif" }}
    >
      {/* Top Bar with Search */}
      <div className="relative w-full max-w-xl mx-auto mb-10">
        <Hash
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A09898]"
          size={18}
        />
        <input
          type="text"
          placeholder="Pesquisar na agenda por cliente ou código..."
          className="w-full pl-12 pr-4 py-4 rounded-3xl bg-white border border-lilac/30 text-[10px] uppercase font-bold tracking-widest outline-none focus:border-lilac transition-all shadow-sm text-slate-900"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Calendar - Span full width now */}
        <div className="xl:col-span-4 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
              {safeFormat(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                className="p-3 rounded-xl bg-white border border-lilac/20 hover:bg-lilac text-slate-900 hover:text-white transition-all shadow-sm group"
              >
                <ChevronLeft size={18} className="group-hover:text-white" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 rounded-xl bg-white border border-lilac/20 hover:bg-lilac text-slate-900 hover:text-white transition-all shadow-sm group"
              >
                <ChevronRight size={18} className="group-hover:text-white" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-px bg-lilac/20 rounded-3xl overflow-hidden border border-lilac/20 shadow-xl">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div
                key={d}
                className="bg-white p-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-900"
              >
                {d}
              </div>
            ))}
            {(() => {
              const firstDayOfWeek = monthStart.getDay();
              const cells = [];

              // Padding for start of month
              for (let i = 0; i < firstDayOfWeek; i++) {
                cells.push(
                  <div
                    key={`empty-${i}`}
                    className="bg-lilac/[0.02] min-h-[160px] border border-transparent"
                  />,
                );
              }

              days.forEach((day) => {
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);

                const dayOrders = filteredOrders
                  .filter((o) => {
                    if (!o.deliveryDate) return false;

                    const deliveryDate = new Date(o.deliveryDate + "T12:00:00");
                    deliveryDate.setHours(23, 59, 59, 999);

                    let registrationDate: Date;
                    if (o.createdAt) {
                      const millis =
                        (o.createdAt as any)?.toMillis?.() ||
                        (o.createdAt as any)?.seconds * 1000 ||
                        new Date(o.createdAt as any).getTime();
                      registrationDate = new Date(millis);
                    } else {
                      registrationDate = deliveryDate;
                    }
                    registrationDate.setHours(0, 0, 0, 0);

                    return (
                      day.getTime() >= registrationDate.getTime() &&
                      day.getTime() <= deliveryDate.getTime()
                    );
                  })
                  .sort((a, b) => (a.code || "").localeCompare(b.code || ""));

                cells.push(
                  <div
                    key={day.toISOString()}
                    className="min-h-[160px] bg-white p-1 hover:bg-lilac/5 transition-all group flex flex-col gap-0.5 border border-transparent"
                  >
                    <span
                      className={`text-[10px] font-black transition-colors mb-1 ml-1 ${isSameDay(day, new Date()) ? "text-lilac" : "text-[#A09898] group-hover:text-slate-900"}`}
                    >
                      {safeFormat(day, "d")}
                    </span>
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {dayOrders.map((order, oIdx) => {
                        const deliveryDate = new Date(
                          order.deliveryDate + "T12:00:00",
                        );
                        deliveryDate.setHours(0, 0, 0, 0);

                        const millis =
                          (order.createdAt as any)?.toMillis?.() ||
                          (order.createdAt as any)?.seconds * 1000 ||
                          new Date(order.createdAt as any).getTime();
                        const registrationDate = new Date(millis);
                        registrationDate.setHours(0, 0, 0, 0);

                        const isStart = isSameDay(day, registrationDate);
                        const isEnd = isSameDay(day, deliveryDate);

                        const showLabel = isStart || day.getDay() === 1;

                        return (
                          <div
                            key={`${day.toISOString()}-${order.id}-${oIdx}`}
                            onClick={() => onSelectOrder?.(order.id)}
                            className={`h-5 px-1.5 flex items-center gap-1 cursor-pointer transition-opacity hover:opacity-80 ${getOrderStyle(order.customerName)} ${isStart ? "rounded-l-md ml-0.5" : "border-l-0"} ${isEnd ? "rounded-r-md mr-0.5" : "border-r-0"} shadow-sm`}
                            title={`${order.customerName} - ${order.code}`}
                          >
                            {isStart && (
                              <div className="w-1 h-1 rounded-full bg-white shrink-0" />
                            )}
                            <span className="text-[7px] font-black uppercase text-white truncate leading-none">
                              {showLabel ? order.customerName : "\u00A0"}
                            </span>
                            {isEnd && (
                              <div className="ml-auto w-1 h-1 rounded-full bg-white/50 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                      {dates.filter(d => d.active && isSameDay(getFullDate(d), day)).map((event, eIdx) => (
                        <div
                           key={`commem-${day.toISOString()}-${eIdx}`}
                           className="h-4 mt-0.5 mx-0.5 bg-[#FAF9F6] border border-[#F0E6D2] rounded flex items-center gap-1 px-1"
                           title={event.name}
                        >
                           <Star size={8} className="text-[#D48C8C]" fill="currentColor" />
                           <span className="text-[6px] font-bold uppercase text-[#D48C8C] truncate w-full">
                             {event.name}
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>,
                );
              });

              return cells;
            })()}
          </div>

          {/* Legend / Upcoming Orders in Focus */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {filteredOrders
              .filter(
                (o) => o.status === "production" || o.status === "pending",
              )
              .slice(0, 6)
              .map((order) => {
                const style = getOrderStyle(order.customerName);
                const colorBase = style.split(" ")[0].replace("bg-", "");

                return (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder?.(order.id)}
                    className="p-5 rounded-3xl bg-white border border-lilac/10 flex items-center gap-4 group hover:border-lilac/40 transition-all shadow-sm cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-white ${style}`}
                    >
                      <User size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-black text-slate-900 uppercase truncate">
                          {order.customerName}
                        </span>
                        <span
                          className={`text-[8px] font-mono font-black text-${colorBase === "lilac" ? "lilac" : colorBase}`}
                        >
                          #{order.code}
                        </span>
                      </div>
                      <p className="text-[8px] text-[#A09898] font-bold uppercase tracking-widest">
                        Entrega:{" "}
                        {safeFormatISO(order.deliveryDate || "", "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
