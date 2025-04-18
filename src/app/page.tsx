'use client';

import { useState, useEffect } from 'react';
import DateRangePicker from './components/DateRangePicker';
import ReportTable from './components/ReportTable';
import ReportTabs from './components/ReportTabs';
import { Loading, Error } from './components/StatusIndicator';
import { fetchCampaignReport, fetchKeywordReport } from '@/lib/api';
import { CampaignReport, KeywordReport, DateRange } from '@/types';

// 탭 정의
const TABS = [
  { id: 'campaign', label: '캠페인 리포트' },
  { id: 'keyword', label: '키워드 리포트' },
];

export default function Home() {
  // 현재 날짜 기준 지난 30일 기본값 설정
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // 상태 관리
  const [activeTab, setActiveTab] = useState<string>('campaign');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: formatDate(thirtyDaysAgo),
    endDate: formatDate(today),
  });
  const [campaignData, setCampaignData] = useState<CampaignReport[]>([]);
  const [keywordData, setKeywordData] = useState<KeywordReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 리포트 데이터 가져오기
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'campaign') {
        const response = await fetchCampaignReport(dateRange);
        if (response.error) {
          setError(response.error);
        } else {
          setCampaignData(response.data || []);
        }
      } else if (activeTab === 'keyword') {
        const response = await fetchKeywordReport(dateRange);
        if (response.error) {
          setError(response.error);
        } else {
          setKeywordData(response.data || []);
        }
      }
    } catch (err: any) {
      setError(err.message || '리포트 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 처리
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 날짜 범위 변경 처리
  const handleDateRangeChange = (newDateRange: DateRange) => {
    setDateRange(newDateRange);
  };

  // 탭 또는 날짜 범위가 변경될 때 데이터 다시 가져오기
  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateRange]);

  // 현재 탭에 따라 표시할 데이터 결정
  const currentData =
    activeTab === 'campaign' ? campaignData : keywordData;
  const reportTitle =
    activeTab === 'campaign' ? '캠페인 퍼포먼스 리포트' : '키워드 퍼포먼스 리포트';

  return (
    <main className="flex min-h-screen flex-col p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">구글 광고 리포트</h1>
        
        <div className="mb-6">
          <DateRangePicker dateRange={dateRange} onChange={handleDateRangeChange} />
        </div>
        
        <ReportTabs tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />
        
        <div className="mt-6">
          {loading ? (
            <Loading />
          ) : error ? (
            <Error message={error} onRetry={fetchReportData} />
          ) : (
            <ReportTable data={currentData} title={reportTitle} />
          )}
        </div>
      </div>
    </main>
  );
}
