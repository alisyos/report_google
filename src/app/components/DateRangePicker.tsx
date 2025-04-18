'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DateRange } from '@/types';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (dateRange: DateRange) => void;
}

export default function DateRangePicker({ dateRange, onChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<Date | null>(
    dateRange.startDate ? new Date(dateRange.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    dateRange.endDate ? new Date(dateRange.endDate) : null
  );

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date) {
      onChange({
        ...dateRange,
        startDate: formatDate(date),
      });
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (date) {
      onChange({
        ...dateRange,
        endDate: formatDate(date),
      });
    }
  };

  // 날짜를 YYYY-MM-DD 형식으로 포맷팅
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg shadow">
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">시작일</label>
        <DatePicker
          selected={startDate}
          onChange={handleStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate || new Date()}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          dateFormat="yyyy-MM-dd"
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">종료일</label>
        <DatePicker
          selected={endDate}
          onChange={handleEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate || undefined}
          maxDate={new Date()}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          dateFormat="yyyy-MM-dd"
        />
      </div>
    </div>
  );
} 