'use client';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
type Row = Record<string, string | number>;
const axis = { tick: { fontSize: 11, fill: '#64748b' }, tickLine: false, axisLine: false } as const;
export function BarCard({ data, layout = 'horizontal' }: { data: Row[]; layout?: 'horizontal' | 'vertical' }) {
  const v = layout === 'vertical';
  return (<ResponsiveContainer width="100%" height={Math.max(220, v ? data.length * 34 : 220)}>
    <BarChart data={data} layout={layout} margin={{ left: v ? 40 : 0, right: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={!v} horizontal={v ? false : true} />
      {v ? <><XAxis type="number" {...axis} allowDecimals={false} /><YAxis type="category" dataKey="name" width={110} {...axis} /></> : <><XAxis dataKey="name" {...axis} /><YAxis {...axis} allowDecimals={false} /></>}
      <Tooltip cursor={{ fill: '#f1f5f9' }} /><Bar dataKey="count" fill="#3b82f6" radius={4} />
    </BarChart></ResponsiveContainer>);
}
export function MonthlyChart({ data }: { data: Row[] }) {
  return (<ResponsiveContainer width="100%" height={260}><LineChart data={data} margin={{ right: 8 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} allowDecimals={false} />
    <Tooltip /><Legend iconType="circle" />
    <Line type="monotone" dataKey="lost" stroke="#0b1530" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="found" stroke="#3b82f6" strokeWidth={2} dot={false} />
  </LineChart></ResponsiveContainer>);
}
