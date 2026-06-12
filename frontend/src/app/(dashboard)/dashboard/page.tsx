export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Ringkasan penjualan dan aktivitas hari ini.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Penjualan Hari Ini", "Total Transaksi", "Cash", "QRIS"].map(
          (title) => (
            <div
              key={title}
              className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">---</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
