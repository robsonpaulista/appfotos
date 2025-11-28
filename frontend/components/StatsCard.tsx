import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export default function StatsCard({ title, value, icon, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

