interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

const StatCard = ({ title, value, subtitle }: StatCardProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-semibold">{value}</h3>
      {subtitle && <p className="text-xs text-blue-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
