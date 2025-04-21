'use client';

import { useState } from 'react';
import { CampaignDailyReport } from '@/types';

interface DailyReportTableProps {
  data: CampaignDailyReport[];
  title: string;
}

export default function DailyReportTable({ data, title }: DailyReportTableProps) {
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 테이블 헤더를 클릭하여 정렬
  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // 정렬된 데이터
  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;

    const aValue = a[sortBy as keyof CampaignDailyReport];
    const bValue = b[sortBy as keyof CampaignDailyReport];

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
  const columns = [
    { header: '날짜', accessorKey: 'date' },
    {
      header: '노출 수',
      accessorKey: 'impressions',
      cell: (value: number) => value.toLocaleString(),
    },
    {
      header: '클릭 수',
      accessorKey: 'clicks',
      cell: (value: number) => value.toLocaleString(),
    },
    {
      header: '비용',
      accessorKey: 'cost',
      cell: (value: number) => {
        // 값이 없거나 0인 경우
        if (value === undefined || value === null || value === 0) {
          return '₩0';
        }
        // 그 외의 경우는 숫자 형식으로 표시
        return `₩${Number(value).toLocaleString('ko-KR')}`;
      },
    },
    {
      header: '전환 수',
      accessorKey: 'conversions',
      cell: (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
    {
      header: 'CTR',
      accessorKey: 'ctr',
      cell: (value: number) => `${(value * 100).toFixed(2)}%`,
    },
  ];

  // 합계 계산
  const totals = data.reduce(
    (acc, item) => {
      acc.impressions += item.impressions;
      acc.clicks += item.clicks;
      acc.cost += item.cost;
      acc.conversions += item.conversions;
      return acc;
    },
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 }
  );

  // 평균 CTR 계산
  const avgCTR = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden mt-4">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600">
          {data.length > 0 ? `${data[0].name} 캠페인의 일별 성과 데이터` : ''}
        </p>
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
              <>
                {sortedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {columns.map((column) => (
                      <td
                        key={`${rowIndex}-${column.accessorKey}`}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {column.cell
                          ? column.cell(row[column.accessorKey as keyof CampaignDailyReport] as number)
                          : row[column.accessorKey as keyof CampaignDailyReport]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-100 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">합계</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {totals.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {totals.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {totals.cost === 0 ? '₩0' : `₩${totals.cost.toLocaleString('ko-KR')}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {totals.conversions.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {(avgCTR * 100).toFixed(2)}%
                  </td>
                </tr>
              </>
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