'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import ReportTable from './components/ReportTable';
import DailyReportTable from './components/DailyReportTable';
import { Loading, Error } from './components/StatusIndicator';
import { fetchCampaignReport, fetchKeywordReport, fetchAdGroupsByCampaign, fetchKeywordsByAdGroup, fetchAdGroupReport, fetchCampaignDailyReport, fetchAdGroupDailyReport, fetchKeywordDailyReport } from '@/lib/api';
import { CampaignReport, KeywordReport, DateRange, AdGroup, Keyword, CampaignDailyReport, AdGroupDailyReport } from '@/types';
import 'react-datepicker/dist/react-datepicker.css';
import DateRangePicker from './components/DateRangePicker';

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
  const [adGroupReportData, setAdGroupReportData] = useState<any[]>([]);
  const [dailyReportData, setDailyReportData] = useState<CampaignDailyReport[]>([]);
  const [showDailyReport, setShowDailyReport] = useState<boolean>(false);
  const [loadingDailyReport, setLoadingDailyReport] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [selectedAdGroup, setSelectedAdGroup] = useState<string>('');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [selectedKeywordId, setSelectedKeywordId] = useState<string>('');
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [loadingAdGroups, setLoadingAdGroups] = useState<boolean>(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loadingKeywords, setLoadingKeywords] = useState<boolean>(false);
  const [allCampaigns, setAllCampaigns] = useState<CampaignReport[]>([]);

  // 리포트 데이터 가져오기
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'campaign') {
        // 캠페인 탭일 때는 이미 데이터가 있으므로 필터링만 적용
        let filteredData = [...allCampaigns];
        
        // 캠페인 필터 적용
        if (selectedCampaign) {
          filteredData = filteredData.filter(item => item.id === selectedCampaign);
          
          // 선택된 캠페인이 있으면 일별 데이터도 가져오기
          await fetchDailyReportData(selectedCampaign);
        } else {
          // 캠페인이 선택되지 않았으면 일별 데이터 숨기기
          setShowDailyReport(false);
          setDailyReportData([]);
        }
        
        setCampaignData(filteredData);
      } else if (activeTab === 'keyword') {
        // 키워드 리포트 데이터 가져오기
        console.log(`키워드 리포트 요청 - 필터: 캠페인=${selectedCampaign || '없음'}, 광고그룹=${selectedAdGroup || '없음'}, 키워드=${selectedKeyword || '없음'}, 키워드ID=${selectedKeywordId || '없음'}`);
        
        // selectedKeywordId가 있으면 직접 사용
        const keywordIdToUse = selectedKeywordId || undefined;
        
        if (keywordIdToUse) {
          console.log(`키워드 ID로 필터링: ${keywordIdToUse}`);
        } else {
          console.log('키워드 ID가 없습니다. 필터가 제대로 적용되지 않을 수 있습니다.');
        }
        
        const response = await fetchKeywordReport(
          dateRange, 
          keywordIdToUse, 
          selectedAdGroup || undefined, 
          selectedCampaign || undefined
        );
        
        if (response.error) {
          setError(response.error);
        } else {
          let filteredData = response.data || [];
          
          // 캠페인 필터 적용
          if (selectedCampaign) {
            const campaign = allCampaigns.find(c => c.id === selectedCampaign);
            if (campaign) {
              filteredData = filteredData.filter(item => item.campaignName === campaign.name);
            }
            
            // 광고 그룹 필터 적용
            if (selectedAdGroup) {
              const adGroup = adGroups.find(g => g.id === selectedAdGroup);
              if (adGroup) {
                filteredData = filteredData.filter(item => item.adGroupName === adGroup.name);
              }
              
              // 키워드 필터 적용
              if (selectedKeyword) {
                filteredData = filteredData.filter(item => item.keyword === selectedKeyword);
              }
            }
          }
          
          setKeywordData(filteredData);
        }
      } else if (activeTab === 'adGroup') {
        // 광고 그룹 리포트 데이터 가져오기
        const response = await fetchAdGroupReport(
          dateRange,
          selectedCampaign || undefined
        );
        
        if (response.error) {
          setError(response.error);
        } else {
          let adGroupData = response.data || [];
          
          // 선택된 광고 그룹이 있으면 해당 그룹으로 필터링
          if (selectedAdGroup) {
            adGroupData = adGroupData.filter(item => item.id === selectedAdGroup);
            console.log(`선택된 광고 그룹(${selectedAdGroup})으로 필터링: ${adGroupData.length}개 항목`);
          }
          
          setAdGroupReportData(adGroupData);
        }
      }
    } catch (err: any) {
      setError(err.message || '리포트 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 일별 리포트 데이터 가져오기
  const fetchDailyReportData = async (campaignId: string) => {
    if (!campaignId) {
      setShowDailyReport(false);
      setDailyReportData([]);
      return;
    }

    setLoadingDailyReport(true);
    setError(null);

    try {
      const response = await fetchCampaignDailyReport(dateRange, campaignId);
      
      if (response.error) {
        console.error('일별 리포트 가져오기 오류:', response.error);
        setError(response.error);
        setShowDailyReport(false);
      } else {
        console.log(`${response.data?.length || 0}개의 일별 데이터 로드됨`);
        setDailyReportData(response.data || []);
        setShowDailyReport(true);
      }
    } catch (error) {
      console.error('일별 리포트 로딩 중 오류 발생:', error);
      setError('일별 리포트를 가져오는 중 오류가 발생했습니다.');
      setShowDailyReport(false);
    } finally {
      setLoadingDailyReport(false);
    }
  };

  // 광고 그룹 일별 리포트 데이터 가져오기
  const fetchAdGroupDailyReportData = async (adGroupId: string) => {
    if (!adGroupId) {
      setShowDailyReport(false);
      setDailyReportData([]);
      return;
    }

    setLoadingDailyReport(true);
    setError(null);

    try {
      // 광고 그룹의 캠페인 ID 가져오기
      const adGroup = adGroups.find(g => g.id === adGroupId);
      const campaignId = adGroup?.campaignId;
      
      console.log(`광고 그룹 일별 리포트 요청 - 광고 그룹 ID: ${adGroupId}, 캠페인 ID: ${campaignId || '알 수 없음'}`);
      
      const response = await fetchAdGroupDailyReport(dateRange, campaignId, adGroupId);
      
      if (response.error) {
        console.error('광고 그룹 일별 리포트 가져오기 오류:', response.error);
        setError(response.error);
        setShowDailyReport(false);
      } else {
        console.log(`${response.data?.length || 0}개의 광고 그룹 일별 데이터 로드됨`);
        setDailyReportData(response.data || []);
        setShowDailyReport(true);
      }
    } catch (error) {
      console.error('광고 그룹 일별 리포트 로딩 중 오류 발생:', error);
      setError('광고 그룹 일별 리포트를 가져오는 중 오류가 발생했습니다.');
      setShowDailyReport(false);
    } finally {
      setLoadingDailyReport(false);
    }
  };

  // 키워드 일별 성과 리포트 데이터 가져오기
  const fetchKeywordDailyReportData = async (keywordId: string) => {
    if (!keywordId) {
      setShowDailyReport(false);
      setDailyReportData([]);
      return;
    }

    setLoadingDailyReport(true);
    setError(null);

    try {
      console.log(`키워드 일별 리포트 요청 - 키워드 ID: ${keywordId}`);
      
      const report = await fetchKeywordDailyReport(dateRange, keywordId, selectedCampaign || undefined, selectedAdGroup || undefined);
      
      if (!report || report.length === 0) {
        console.log('키워드 일별 데이터가 없습니다.');
        setShowDailyReport(false);
        setDailyReportData([]);
      } else {
        console.log(`${report.length}개의 키워드 일별 데이터 로드됨`);
        setDailyReportData(report);
        setShowDailyReport(true);
      }
    } catch (error: any) {
      console.error('키워드 일별 리포트 로딩 중 오류 발생:', error);
      setError('키워드 일별 리포트를 가져오는 중 오류가 발생했습니다.');
      setShowDailyReport(false);
    } finally {
      setLoadingDailyReport(false);
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

  // 데이터 타입에 따른 적절한 필터 적용
  const getFilteredData = () => {
    if (activeTab === 'campaign') {
      let filtered = campaignData;
      
      if (selectedCampaign) {
        filtered = filtered.filter(c => c.id === selectedCampaign);
      }
      
      return filtered;
    } else if (activeTab === 'keyword') {
      let filtered = keywordData;
      
      // 선택된 캠페인에 따라 필터링
      if (selectedCampaign) {
        const campaign = campaignData.find(c => c.id === selectedCampaign);
        if (campaign) {
          filtered = filtered.filter(k => k.campaignName === campaign.name);
        }
      }
      
      // 선택된 광고 그룹에 따라 필터링
      if (selectedAdGroup) {
        const adGroup = adGroups.find(g => g.id === selectedAdGroup);
        if (adGroup) {
          filtered = filtered.filter(k => k.adGroupName === adGroup.name);
        }
      }
      
      // 선택된 키워드에 따라 필터링
      if (selectedKeyword) {
        filtered = filtered.filter(k => k.keyword === selectedKeyword);
      }
      
      return filtered;
    } else {
      // 광고 그룹 탭에서는 이미 필터링된 데이터 사용
      return adGroupReportData;
    }
  };

  // 현재 탭에 따라 표시할 데이터 결정
  const getReportData = () => {
    if (activeTab === 'campaign') {
      return {
        currentData: getFilteredData(),
        reportTitle: '캠페인 퍼포먼스 리포트'
      };
    } else if (activeTab === 'keyword') {
      return {
        currentData: getFilteredData(),
        reportTitle: '키워드 퍼포먼스 리포트'
      };
    } else {
      return {
        currentData: adGroupReportData,
        reportTitle: '광고 그룹 퍼포먼스 리포트'
      };
    }
  };

  const { currentData, reportTitle } = getReportData();

  // 탭 변경 처리
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // 탭 변경 시 일별 리포트 상태 업데이트
    if (tabId === 'campaign' && selectedCampaign) {
      fetchDailyReportData(selectedCampaign);
    } else if (tabId === 'adGroup' && selectedAdGroup) {
      fetchAdGroupDailyReportData(selectedAdGroup);
    } else if (tabId === 'keyword' && selectedKeywordId) {
      fetchKeywordDailyReportData(selectedKeywordId);
    } else {
      setShowDailyReport(false);
      setDailyReportData([]);
    }
  };

  // 캠페인 ID로 광고 그룹 가져오기
  const fetchAdGroups = async (campaignId: string) => {
    if (!campaignId) {
      setAdGroups([]);
      return;
    }
    
    setLoadingAdGroups(true);
    try {
      console.log(`캠페인 ID로 광고 그룹 가져오기: ${campaignId}`);
      const response = await fetchAdGroupsByCampaign(campaignId);
      if (response.error) {
        console.error('광고 그룹 로딩 오류:', response.error);
        setAdGroups([]);
      } else {
        console.log(`${response.data?.length || 0}개의 광고 그룹 데이터 로드됨`);
        setAdGroups(response.data || []);
      }
    } catch (error) {
      console.error('광고 그룹 로딩 중 오류 발생:', error);
      setAdGroups([]);
    } finally {
      setLoadingAdGroups(false);
    }
  };

  // 캠페인 목록만 가져오는 함수 수정
  const fetchCampaignList = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchCampaignReport(dateRange);
      if (response.error) {
        setError(response.error);
      } else {
        const campaigns = response.data || [];
        setAllCampaigns(campaigns); // 모든 캠페인 목록 저장
        setCampaignData(campaigns); // 필터링 적용 가능한 데이터 복사본
      }
    } catch (err: any) {
      setError(err.message || '캠페인 목록을 가져오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 캠페인 목록만 가져오기
  useEffect(() => {
    fetchCampaignList();
  }, []); // 페이지 로드 시 1회만 실행

  // 날짜 범위 변경 시 데이터를 자동으로 가져오지 않음
  useEffect(() => {
    // 날짜 변경 시 자동으로 데이터 로딩하지 않음
    // fetchReportData();
  }, [dateRange]);

  // 탭 변경 시 필터 초기화
  useEffect(() => {
    // 탭이 변경되면 필터 초기화
    setSelectedCampaign('');
    setSelectedAdGroup('');
    setSelectedKeyword('');
    setSelectedKeywordId('');
    setAdGroups([]);
    setKeywords([]);
  }, [activeTab]);

  // 필터 변경 처리 함수 수정
  const handleFilterChange = (type: 'campaign' | 'adGroup' | 'keyword', value: string) => {
    if (type === 'campaign') {
      setSelectedCampaign(value);
      setSelectedAdGroup(''); // 캠페인이 변경되면 광고 그룹 선택 초기화
      setSelectedKeyword(''); // 캠페인이 변경되면 키워드 선택 초기화
      setSelectedKeywordId(''); // 캠페인이 변경되면 키워드 ID 초기화
      setKeywords([]); // 키워드 목록 초기화
      
      // 캠페인이 선택되었고 캠페인 탭이 활성화되어 있으면 일별 데이터 가져오기
      if (value && activeTab === 'campaign') {
        fetchDailyReportData(value);
      } else {
        // 캠페인이 선택 해제되면 일별 데이터 숨기기
        setShowDailyReport(false);
        setDailyReportData([]);
      }
      
      // 캠페인이 선택되면 즉시 광고 그룹 데이터 가져오기
      if (value) {
        fetchAdGroups(value);
      } else {
        setAdGroups([]); // 캠페인이 선택 해제되면 광고 그룹 목록 초기화
      }
      
      // 활성 탭이 광고 그룹인 경우 데이터 즉시 갱신
      if (activeTab === 'adGroup') {
        fetchReportData();
      }
    } else if (type === 'adGroup') {
      setSelectedAdGroup(value);
      setSelectedKeyword(''); // 광고 그룹이 변경되면 키워드 선택 초기화
      setSelectedKeywordId(''); // 광고 그룹이 변경되면 키워드 ID 초기화
      
      // 광고 그룹이 선택되면 즉시 키워드 데이터 가져오기
      if (value) {
        fetchKeywords(value);
        
        // 광고 그룹 탭이 활성화되어 있으면 일별 데이터도 가져오기
        if (activeTab === 'adGroup') {
          fetchAdGroupDailyReportData(value);
        }
      } else {
        setKeywords([]); // 광고 그룹이 선택 해제되면 키워드 목록 초기화
        // 광고 그룹이 선택 해제되면 일별 데이터 숨기기
        setShowDailyReport(false);
        setDailyReportData([]);
      }
      
      // 활성 탭이 광고 그룹인 경우 데이터 즉시 갱신
      if (activeTab === 'adGroup') {
        fetchReportData();
      }
    } else {
      setSelectedKeyword(value);
    }
  };

  // 필터 변경 시 데이터 업데이트
  useEffect(() => {
    if (campaignData.length > 0 || keywordData.length > 0) {
      // 이미 데이터가 있는 경우만 필터링 적용
      applyFilters();
    }
  }, [selectedCampaign, selectedAdGroup, selectedKeyword]);

  // 필터 적용 함수 수정
  const applyFilters = () => {
    if (activeTab === 'campaign') {
      // 캠페인 필터링은 더이상 실제 데이터를 변경하지 않음
      // 리포트 테이블에 표시될 내용만 필터링되도록 수정
      if (selectedCampaign) {
        const filteredData = allCampaigns.filter(item => item.id === selectedCampaign);
        setCampaignData(filteredData);
      } else {
        setCampaignData(allCampaigns);
      }
    } else if (activeTab === 'keyword') {
      // 기존 코드 유지
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
    } else if (activeTab === 'adGroup') {
      // 광고 그룹 탭에서는 선택 변경 시 fetchReportData가 자동 호출되므로 
      // 여기서는 별도 처리 필요 없음
    }
  };

  // 광고 그룹 ID로 키워드 가져오기
  const fetchKeywords = async (adGroupId: string) => {
    if (!adGroupId) {
      setKeywords([]);
      return;
    }
    
    setLoadingKeywords(true);
    try {
      console.log(`광고 그룹 ID로 키워드 가져오기: ${adGroupId}`);
      const response = await fetchKeywordsByAdGroup(adGroupId);
      if (response.error) {
        console.error('키워드 로딩 오류:', response.error);
        setKeywords([]);
      } else {
        console.log(`${response.data?.length || 0}개의 키워드 데이터 로드됨`);
        setKeywords(response.data || []);
      }
    } catch (error) {
      console.error('키워드 로딩 중 오류 발생:', error);
      setKeywords([]);
    } finally {
      setLoadingKeywords(false);
    }
  };

  // 키워드 필터링을 위한 유니크 키워드 리스트 가져오기
  const getUniqueKeywords = () => {
    // 이미 가져온 키워드 데이터가 있으면 해당 데이터에서 중복 제거한 목록 반환
    if (keywords.length > 0) {
      return [...new Set(keywords.map(k => k.keyword))];
    }
    
    // 없으면 키워드 리포트 데이터에서 필터링
    let filteredKeywords = keywordData;
    
    // 선택된 캠페인에 따라 필터링
    if (selectedCampaign) {
      const campaign = campaignData.find(c => c.id === selectedCampaign);
      if (campaign) {
        filteredKeywords = keywordData.filter(k => k.campaignName === campaign.name);
      }
    }
    
    // 선택된 광고 그룹에 따라 필터링
    if (selectedAdGroup) {
      const adGroup = adGroups.find(g => g.id === selectedAdGroup);
      if (adGroup) {
        filteredKeywords = filteredKeywords.filter(k => k.adGroupName === adGroup.name);
      }
    }
    
    // 중복 제거한 키워드 목록 반환
    return [...new Set(filteredKeywords.map(k => k.keyword))];
  };

  // 키워드 선택 핸들러 수정
  const handleKeywordSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const keywordValue = event.target.value;
    setSelectedKeyword(keywordValue);
    
    console.log(`키워드 선택됨: ${keywordValue}`);
    
    // 선택된 키워드에 해당하는 ID 저장
    if (keywordValue && keywords.length > 0) {
      const selectedKeywordObj = keywords.find(k => k.keyword === keywordValue);
      if (selectedKeywordObj) {
        const keywordId = selectedKeywordObj.id;
        console.log(`선택된 키워드 ID: ${keywordId}`);
        setSelectedKeywordId(keywordId);
        
        // 키워드 탭이 활성화되어 있고 키워드 ID가 있는 경우 일별 데이터 가져오기
        if (activeTab === 'keyword' && keywordId) {
          fetchKeywordDailyReportData(keywordId);
        }
      } else {
        setSelectedKeywordId('');
        setShowDailyReport(false);
        setDailyReportData([]);
      }
    } else {
      setSelectedKeywordId('');
      setShowDailyReport(false);
      setDailyReportData([]);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">구글 광고 리포트</h1>
        
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
              {allCampaigns.map(campaign => (
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
              disabled={!selectedCampaign || loadingAdGroups}
            >
              <option value="">모든 광고 그룹</option>
              {loadingAdGroups ? (
                <option disabled>로딩 중...</option>
              ) : (
                adGroups.map(adGroup => (
                  <option key={adGroup.id} value={adGroup.id}>
                    {adGroup.name}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">키워드</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedKeyword}
              onChange={handleKeywordSelect}
              disabled={!selectedAdGroup || loadingKeywords}
            >
              <option value="">모든 키워드</option>
              {loadingKeywords ? (
                <option disabled>로딩 중...</option>
              ) : (
                getUniqueKeywords().map(keyword => (
                  <option key={keyword} value={keyword}>
                    {keyword}
                  </option>
                ))
              )}
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
              activeTab === 'adGroup'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleTabChange('adGroup')}
          >
            광고 그룹 리포트
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
            <>
              <ReportTable data={currentData} title={reportTitle} />
              
              {/* 일별 리포트 - 캠페인 탭 */}
              {showDailyReport && activeTab === 'campaign' && selectedCampaign && (
                <div className="mt-8">
                  {loadingDailyReport ? (
                    <Loading />
                  ) : dailyReportData.length > 0 ? (
                    <DailyReportTable 
                      data={dailyReportData} 
                      title="일별 캠페인 성과 리포트" 
                    />
                  ) : (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-gray-500">선택한 기간에 해당하는 일별 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 일별 리포트 - 광고 그룹 탭 */}
              {showDailyReport && activeTab === 'adGroup' && selectedAdGroup && (
                <div className="mt-8">
                  {loadingDailyReport ? (
                    <Loading />
                  ) : dailyReportData.length > 0 ? (
                    <DailyReportTable 
                      data={dailyReportData} 
                      title="일별 광고 그룹 성과 리포트" 
                    />
                  ) : (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-gray-500">선택한 기간에 해당하는 일별 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 일별 리포트 - 키워드 탭 */}
              {showDailyReport && activeTab === 'keyword' && selectedKeywordId && (
                <div className="mt-8">
                  {loadingDailyReport ? (
                    <Loading />
                  ) : dailyReportData.length > 0 ? (
                    <DailyReportTable 
                      data={dailyReportData} 
                      title="일별 키워드 성과 리포트" 
                    />
                  ) : (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-gray-500">선택한 기간에 해당하는 일별 데이터가 없습니다.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
