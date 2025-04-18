'use client';

import { useState } from 'react';
import { CampaignReport, KeywordReport } from '@/types';

interface Column {
  header: string;
  accessorKey: string;
  cell?: (value: any) => React.ReactNode;
}

interface ReportTableProps {
  data: CampaignReport[] | KeywordReport[];
  title: string;
}

export default function ReportTable({ data, title }: ReportTableProps) {
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 테이블 헤더를 클릭하여 정렬
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // 정렬된 데이터
  const sortedData = [...data].sort((a: any, b: any) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy];
    const bValue = b[sortBy];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // 컬럼 정의
  const isCampaignReport = data.length > 0 && 'name' in data[0];
  const columns: Column[] = isCampaignReport
    ? [
        { header: '캠페인 ID', accessorKey: 'id' },
        { header: '캠페인명', accessorKey: 'name' },
        {
          header: '노출 수',
          accessorKey: 'impressions',
          cell: (value) => value.toLocaleString(),
        },
        {
          header: '클릭 수',
          accessorKey: 'clicks',
          cell: (value) => value.toLocaleString(),
        },
        {
          header: '비용',
          accessorKey: 'cost',
          cell: (value) => `₩${value.toLocaleString()}`,
        },
        {
          header: '전환 수',
          accessorKey: 'conversions',
          cell: (value) => value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        },
        {
          header: 'CTR',
          accessorKey: 'ctr',
          cell: (value) => `${(value * 100).toFixed(2)}%`,
        },
      ]
    : [
        { header: '키워드', accessorKey: 'keyword' },
        { header: '캠페인명', accessorKey: 'campaignName' },
        { header: '광고 그룹명', accessorKey: 'adGroupName' },
        {
          header: '노출 수',
          accessorKey: 'impressions',
          cell: (value) => value.toLocaleString(),
        },
        {
          header: '클릭 수',
          accessorKey: 'clicks',
          cell: (value) => value.toLocaleString(),
        },
        {
          header: '비용',
          accessorKey: 'cost',
          cell: (value) => `₩${value.toLocaleString()}`,
        },
        {
          header: '전환 수',
          accessorKey: 'conversions',
          cell: (value) => value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        },
        {
          header: 'CTR',
          accessorKey: 'ctr',
          cell: (value) => `${(value * 100).toFixed(2)}%`,
        },
      ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mt-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessorKey}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort(column.accessorKey)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {sortBy === column.accessorKey && (
                      <span className="ml-1">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.length > 0 ? (
              sortedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.accessorKey}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {column.cell
                        ? column.cell((row as any)[column.accessorKey])
                        : (row as any)[column.accessorKey]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-sm text-center text-gray-500"
                >
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 