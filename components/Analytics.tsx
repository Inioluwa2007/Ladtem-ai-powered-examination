
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const data = [
  { name: 'Critical Thinking', average: 65 },
  { name: 'Logic & Structure', average: 82 },
  { name: 'Subject Depth', average: 45 },
  { name: 'Creative Approach', average: 78 },
  { name: 'Formal Tone', average: 91 },
];

const distribution = [
  { name: 'A (90-100)', value: 12 },
  { name: 'B (80-89)', value: 25 },
  { name: 'C (70-79)', value: 30 },
  { name: 'D (60-69)', value: 15 },
  { name: 'F (<60)', value: 8 },
];

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Performance by Rubric Criterion</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} className="text-xs font-medium" />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.average < 50 ? '#ef4444' : entry.average < 75 ? '#6366f1' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-xs text-slate-500 text-center italic">
            "70% of students failed the 'Subject Depth' section - Recommend curriculum review."
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Grade Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
        <div className="flex items-start space-x-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-indigo-900 font-semibold mb-1">AI Insights Report</h4>
            <p className="text-indigo-700 text-sm leading-relaxed">
              Based on the recent grading of 45 submissions, students show a high level of technical competency in 'Formal Tone' but are struggling to connect theoretical concepts to the 'Subject Depth' case study. The AI has flagged 12% of submissions for 'Priority Human Review' due to creative reasoning that deviates from standard rubric pathways.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
