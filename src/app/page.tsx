'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import ReportTable from './components/ReportTable';
import { Loading, Error } from './components/StatusIndicator';
import { fetchCampaignReport, fetchKeywordReport } from '@/lib/api';
import { CampaignReport, KeywordReport, DateRange } from '@/types';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [startDate, setStartDate] = useState<Date | null>(thirtyDaysAgo);
  const [endDate, setEndDate] = useState<Date | null>(today);
  const [campaignData, setCampaignData] = useState<CampaignReport[]>([]);
  const [keywordData, setKeywordData] = useState<KeywordReport[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedAdGroup, setSelectedAdGroup] = useState<string>('');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');

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
          let filteredData = response.data || [];
          
          // 캠페인 필터 적용
          if (selectedCampaign) {
            filteredData = filteredData.filter(item => item.id === selectedCampaign);
          }
          
          setCampaignData(filteredData);
        }
      } else if (activeTab === 'keyword') {
        const response = await fetchKeywordReport(dateRange);
        if (response.error) {
          setError(response.error);
        } else {
          let filteredData = response.data || [];
          
          // 캠페인 필터 적용
          if (selectedCampaign) {
            filteredData = filteredData.filter(item => item.campaignName === selectedCampaign);
            
            // 광고 그룹 필터 적용
            if (selectedAdGroup) {
              filteredData = filteredData.filter(item => item.adGroupName === selectedAdGroup);
              
              // 키워드 필터 적용
              if (selectedKeyword) {
                filteredData = filteredData.filter(item => item.keyword === selectedKeyword);
              }
            }
          }
          
          setKeywordData(filteredData);
        }
      }
    } catch (err: any) {
      setError(err.message || '리포트 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 범위 변경 처리
  const handleDateChange = (key: 'startDate' | 'endDate', date: Date | null) => {
    if (date) {
      const formattedDate = formatDate(date);
      if (key === 'startDate') {
        setStartDate(date);
        setDateRange({ ...dateRange, startDate: formattedDate });
      } else {
        setEndDate(date);
        setDateRange({ ...dateRange, endDate: formattedDate });
      }
    }
  };

  // 기간 빠른 선택 처리
  const handleQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setStartDate(start);
    setEndDate(end);
    setDateRange({
      startDate: formatDate(start),
      endDate: formatDate(end)
    });
  };

  // 현재 탭에 따라 표시할 데이터 결정
  const currentData =
    activeTab === 'campaign' ? campaignData : keywordData;
  const reportTitle =
    activeTab === 'campaign' ? '캠페인 퍼포먼스 리포트' : '키워드 퍼포먼스 리포트';
    
  // 탭 변경 처리
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 필터 변경 처리 함수 추가
  const handleFilterChange = (type: 'campaign' | 'adGroup' | 'keyword', value: string) => {
    if (type === 'campaign') {
      setSelectedCampaign(value);
      setSelectedAdGroup(''); // 캠페인이 변경되면 광고 그룹 선택 초기화
      setSelectedKeyword(''); // 캠페인이 변경되면 키워드 선택 초기화
    } else if (type === 'adGroup') {
      setSelectedAdGroup(value);
      setSelectedKeyword(''); // 광고 그룹이 변경되면 키워드 선택 초기화
    } else {
      setSelectedKeyword(value);
    }
  };

  // 페이지 로드 시 초기 데이터 로딩
  useEffect(() => {
    fetchReportData();
  }, []); // 페이지 로드 시 1회만 실행

  // 필터 변경 시 데이터 업데이트
  useEffect(() => {
    if (campaignData.length > 0 || keywordData.length > 0) {
      // 이미 데이터가 있는 경우만 필터링 적용
      applyFilters();
    }
  }, [selectedCampaign, selectedAdGroup, selectedKeyword]);

  // 필터 적용 함수
  const applyFilters = () => {
    if (activeTab === 'campaign') {
      let filteredData = campaignData;
      
      // 캠페인 필터 적용
      if (selectedCampaign) {
        filteredData = filteredData.filter(item => item.id === selectedCampaign);
      }
      
      setCampaignData(filteredData);
    } else if (activeTab === 'keyword') {
      let filteredData = keywordData;
      
      // 캠페인 필터 적용
      if (selectedCampaign) {
        filteredData = filteredData.filter(item => item.campaignName === selectedCampaign);
        
        // 광고 그룹 필터 적용
        if (selectedAdGroup) {
          filteredData = filteredData.filter(item => item.adGroupName === selectedAdGroup);
          
          // 키워드 필터 적용
          if (selectedKeyword) {
            filteredData = filteredData.filter(item => item.keyword === selectedKeyword);
          }
        }
      }
      
      setKeywordData(filteredData);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">광고 리포트</h1>
        
        {/* 필터 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">캠페인</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCampaign}
              onChange={(e) => handleFilterChange('campaign', e.target.value)}
            >
              <option value="">모든 캠페인</option>
              {campaignData.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">광고 그룹</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAdGroup}
              onChange={(e) => handleFilterChange('adGroup', e.target.value)}
              disabled={!selectedCampaign || activeTab !== 'keyword'}
            >
              <option value="">모든 광고 그룹</option>
              {keywordData
                .filter(item => !selectedCampaign || item.campaignName === selectedCampaign)
                .map(item => item.adGroupName)
                .filter((value, index, self) => self.indexOf(value) === index) // 중복 제거
                .map(adGroupName => (
                  <option key={adGroupName} value={adGroupName}>
                    {adGroupName}
                  </option>
                ))
              }
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">키워드</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedKeyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              disabled={!selectedAdGroup || activeTab !== 'keyword'}
            >
              <option value="">모든 키워드</option>
              {keywordData
                .filter(item => 
                  (!selectedCampaign || item.campaignName === selectedCampaign) &&
                  (!selectedAdGroup || item.adGroupName === selectedAdGroup)
                )
                .map(item => item.keyword)
                .filter((value, index, self) => self.indexOf(value) === index) // 중복 제거
                .map(keyword => (
                  <option key={keyword} value={keyword}>
                    {keyword}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
        
        {/* 날짜 선택 섹션 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => handleDateChange('startDate', date)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => handleDateChange('endDate', date)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="yyyy-MM-dd"
                minDate={startDate || undefined}
              />
            </div>
          </div>
          
          {/* 빠른 날짜 선택 버튼들 */}
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleQuickDateRange(7)}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm text-gray-700"
            >
              최근 7일
            </button>
            <button 
              onClick={() => handleQuickDateRange(30)}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm text-gray-700"
            >
              최근 30일
            </button>
            <button 
              onClick={() => handleQuickDateRange(90)}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm text-gray-700"
            >
              최근 90일
            </button>
          </div>
        </div>
        
        {/* 리포트 타입 선택 */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'campaign'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('campaign')}
          >
            캠페인 리포트
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'keyword'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('keyword')}
          >
            키워드 리포트
          </button>
        </div>
        
        {/* 리포트 생성 버튼 */}
        <button
          onClick={fetchReportData}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md mb-6 transition-colors"
        >
          리포트 생성
        </button>
        
        {/* 리포트 내용 */}
        <div className="mt-4">
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
