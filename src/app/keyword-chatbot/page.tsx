'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchKeywordsByAdGroup, fetchAdGroupsByCampaign } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Keyword {
  id: string;
  keyword: string;
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
}

interface AdGroup {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
}

interface Campaign {
  id: string;
  name: string;
  status?: string;
}

export default function KeywordChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '안녕하세요! 키워드 관리 챗봇입니다. 키워드에 대해 어떤 것이 궁금하신가요?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [showOnlyEnabled, setShowOnlyEnabled] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [adGroups, setAdGroups] = useState<AdGroup[]>([]);
  const [selectedAdGroup, setSelectedAdGroup] = useState<string>('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 페이지 로드 시 캠페인 목록 가져오기
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch('/api/campaigns');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || '캠페인 데이터를 가져오는 중 오류가 발생했습니다.');
        }
        
        console.log('캠페인 데이터 로드 성공:', data);
        
        if (data.data && Array.isArray(data.data)) {
          setCampaigns(data.data);
          setFilteredCampaigns(data.data);
        } else {
          console.warn('예상치 못한 캠페인 데이터 형식:', data);
          setCampaigns([]);
          setFilteredCampaigns([]);
        }
      } catch (error) {
        console.error('캠페인 목록 가져오기 실패:', error);
        // 오류 발생 시 빈 배열 설정
        setCampaigns([]);
        setFilteredCampaigns([]);
      }
    };
    
    fetchCampaigns();
  }, []);

  // 활성화된 캠페인만 필터링
  useEffect(() => {
    if (showOnlyEnabled) {
      const enabled = campaigns.filter(campaign => campaign.status === 'ENABLED');
      setFilteredCampaigns(enabled);
    } else {
      setFilteredCampaigns(campaigns);
    }
  }, [campaigns, showOnlyEnabled]);

  // 필터 토글 핸들러
  const handleFilterToggle = () => {
    setShowOnlyEnabled(!showOnlyEnabled);
    // 필터 변경 시 선택된 캠페인 초기화
    setSelectedCampaign('');
    setSelectedAdGroup('');
    setSelectedKeyword('');
  };
  
  // 캠페인 선택 시 광고 그룹 목록 가져오기
  useEffect(() => {
    const fetchAdGroups = async () => {
      if (!selectedCampaign) {
        setAdGroups([]);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetchAdGroupsByCampaign(selectedCampaign);
        setAdGroups(response.data || []);
      } catch (error) {
        console.error('광고 그룹 목록 가져오기 실패:', error);
        
        // 임시 데이터
        const mockAdGroups = [
          { id: '101', name: '브랜드 키워드 그룹', campaignId: selectedCampaign, campaignName: '브랜드 캠페인' },
          { id: '102', name: '제품 키워드 그룹', campaignId: selectedCampaign, campaignName: '브랜드 캠페인' }
        ];
        setAdGroups(mockAdGroups);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdGroups();
  }, [selectedCampaign]);
  
  // 광고 그룹 선택 시 키워드 목록 가져오기
  useEffect(() => {
    const fetchKeywords = async () => {
      if (!selectedAdGroup) {
        setKeywords([]);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetchKeywordsByAdGroup(selectedAdGroup);
        setKeywords(response.data || []);
      } catch (error) {
        console.error('키워드 목록 가져오기 실패:', error);
        
        // 임시 데이터
        const mockKeywords = [
          { id: '1001', keyword: '브랜드명', adGroupId: selectedAdGroup, adGroupName: '브랜드 키워드 그룹', campaignId: selectedCampaign, campaignName: '브랜드 캠페인' },
          { id: '1002', keyword: '제품명', adGroupId: selectedAdGroup, adGroupName: '브랜드 키워드 그룹', campaignId: selectedCampaign, campaignName: '브랜드 캠페인' },
          { id: '1003', keyword: '할인 쿠폰', adGroupId: selectedAdGroup, adGroupName: '브랜드 키워드 그룹', campaignId: selectedCampaign, campaignName: '브랜드 캠페인' }
        ];
        setKeywords(mockKeywords);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchKeywords();
  }, [selectedAdGroup, selectedCampaign]);
  
  // 메시지 목록이 업데이트될 때마다 스크롤 최하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // 사용자 메시지 추가
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // 선택된 키워드 정보
      const selectedKeywordInfo = keywords.find(k => k.id === selectedKeyword);
      
      // API 요청
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          keywordInfo: selectedKeywordInfo,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '응답을 처리하는 중 오류가 발생했습니다');
      }
      
      // 챗봇 응답 추가
      const botMessage: Message = { 
        role: 'assistant', 
        content: data.response || '응답을 처리할 수 없습니다'
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('메시지 처리 오류:', error);
      // 오류 메시지 추가
      const errorMessage: Message = { 
        role: 'assistant', 
        content: '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <main className="flex min-h-screen flex-col p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">키워드 관리 챗봇</h1>
        
        {/* 필터 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 캠페인 선택 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">캠페인</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabledOnly"
                  checked={showOnlyEnabled}
                  onChange={handleFilterToggle}
                  className="mr-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="enabledOnly" className="text-xs text-gray-600">
                  활성화된 캠페인만 보기
                </label>
              </div>
            </div>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCampaign}
              onChange={(e) => {
                setSelectedCampaign(e.target.value);
                setSelectedAdGroup('');
                setSelectedKeyword('');
              }}
            >
              <option value="">캠페인 선택</option>
              {filteredCampaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} {campaign.status === 'ENABLED' ? '(활성)' : campaign.status === 'PAUSED' ? '(중지)' : campaign.status === 'REMOVED' ? '(삭제됨)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* 광고 그룹 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">광고 그룹</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAdGroup}
              onChange={(e) => {
                setSelectedAdGroup(e.target.value);
                setSelectedKeyword('');
              }}
              disabled={!selectedCampaign || isLoading}
            >
              <option value="">광고 그룹 선택</option>
              {adGroups.map(adGroup => (
                <option key={adGroup.id} value={adGroup.id}>
                  {adGroup.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* 키워드 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">키워드</label>
            <select 
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedKeyword}
              onChange={(e) => setSelectedKeyword(e.target.value)}
              disabled={!selectedAdGroup || isLoading}
            >
              <option value="">키워드 선택</option>
              {keywords.map(keyword => (
                <option key={keyword.id} value={keyword.id}>
                  {keyword.keyword}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 채팅 화면 */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* 메시지 목록 */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 ${message.role === 'user' ? 'text-right' : ''}`}
              >
                <div 
                  className={`inline-block rounded-lg p-3 max-w-xs sm:max-w-md ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* 입력 폼 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 border border-gray-300 rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`px-4 py-2 rounded-r-md ${
                  isLoading || !input.trim() 
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isLoading ? '전송 중...' : '전송'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {selectedKeyword 
                ? `선택된 키워드: ${keywords.find(k => k.id === selectedKeyword)?.keyword}` 
                : '키워드를 선택하면 더 정확한 정보를 제공받을 수 있습니다.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
} 