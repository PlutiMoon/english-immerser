interface StatCardProps {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="surface-card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}
