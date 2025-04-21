import axios from 'axios';
import { DateRange, ApiResponse, CampaignReport, KeywordReport, AdGroup } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 캠페인 리포트 데이터 가져오기
export async function fetchCampaignReport(dateRange: DateRange): Promise<ApiResponse<CampaignReport>> {
  try {
    const { startDate, endDate } = dateRange;
    const response = await axios.get(`${API_URL}/api/reports/campaign`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error('캠페인 리포트 데이터 가져오기 오류:', error);
    return {
      error: error.response?.data?.error || '캠페인 리포트를 가져오는 중 오류가 발생했습니다.',
    };
  }
}

// 키워드 리포트 데이터 가져오기
export async function fetchKeywordReport(dateRange: DateRange): Promise<ApiResponse<KeywordReport>> {
  try {
    const { startDate, endDate } = dateRange;
    const response = await axios.get(`${API_URL}/api/reports/keyword`, {
      params: { startDate, endDate },
    });
    return response.data;
  } catch (error: any) {
    console.error('키워드 리포트 데이터 가져오기 오류:', error);
    return {
      error: error.response?.data?.error || '키워드 리포트를 가져오는 중 오류가 발생했습니다.',
    };
  }
}

// 광고 그룹 리포트 데이터 가져오기
export async function fetchAdGroupReport(dateRange: DateRange, campaignId?: string, adGroupId?: string): Promise<ApiResponse<any>> {
  try {
    const { startDate, endDate } = dateRange;
    const params: Record<string, string> = { startDate, endDate };
    
    // 선택적 파라미터 추가
    if (campaignId) {
      params.campaignId = campaignId;
    }
    
    if (adGroupId) {
      params.adGroupId = adGroupId;
    }
    
    console.log(`광고 그룹 리포트 요청 - 기간: ${startDate}~${endDate}, 캠페인 ID: ${campaignId || '전체'}, 광고 그룹 ID: ${adGroupId || '전체'}`);
    
    const response = await axios.get(`${API_URL}/api/reports/adgroup`, { params });
    
    // API 응답 데이터 구조 로깅
    console.log(`광고 그룹 리포트 API 응답 구조:`, 
      response.data && typeof response.data === 'object' 
        ? Object.keys(response.data).join(', ') 
        : typeof response.data
    );
    
    // 데이터가 { data: [...] } 형식이면 해당 데이터 반환
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return { data: response.data.data };
    }
    
    // 데이터가 직접 배열 형식이면 그대로 반환
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    
    // 알 수 없는 형식이면 빈 배열 반환
    console.warn('알 수 없는 API 응답 형식:', typeof response.data);
    return { data: [] };
  } catch (error: any) {
    console.error('광고 그룹 리포트 데이터 가져오기 오류:', error);
    return {
      error: error.response?.data?.error || '광고 그룹 리포트를 가져오는 중 오류가 발생했습니다.',
    };
  }
}

// 캠페인 ID로 광고 그룹 데이터 가져오기
export async function fetchAdGroupsByCampaign(campaignId: string): Promise<ApiResponse<AdGroup>> {
  try {
    const response = await axios.get(`${API_URL}/api/adgroups`, {
      params: { campaignId },
    });
    
    // API 응답 데이터 구조 로깅
    console.log(`광고 그룹 API 응답 구조:`, 
      response.data && typeof response.data === 'object' 
        ? Object.keys(response.data).join(', ') 
        : typeof response.data
    );
    
    // 데이터가 { data: [...] } 형식이면 해당 데이터 반환
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return { data: response.data.data };
    }
    
    // 데이터가 직접 배열 형식이면 그대로 반환
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    
    // 알 수 없는 형식이면 빈 배열 반환
    console.warn('알 수 없는 API 응답 형식:', typeof response.data);
    return { data: [] };
  } catch (error: any) {
    console.error('광고 그룹 데이터 가져오기 오류:', error);
    return {
      error: error.response?.data?.error || '광고 그룹 데이터를 가져오는 중 오류가 발생했습니다.',
    };
  }
}

// 광고 그룹 ID로 키워드 데이터 가져오기
export async function fetchKeywordsByAdGroup(adGroupId: string): Promise<ApiResponse<any>> {
  try {
    console.log(`API 요청 시작 - 광고 그룹 ID [${adGroupId}]로 키워드 데이터 가져오기`);
    
    const response = await axios.get(`${API_URL}/api/keywords`, {
      params: { adGroupId },
    });
    
    // API 응답 데이터 구조 로깅
    console.log(`키워드 API 응답 구조:`, 
      response.data && typeof response.data === 'object' 
        ? Object.keys(response.data).join(', ') 
        : typeof response.data
    );
    
    // 데이터 길이 확인
    if (response.data && response.data.data) {
      console.log(`API에서 키워드 ${response.data.data.length}개 받음`);
      if (response.data.data.length > 0) {
        console.log(`첫 번째 키워드 샘플:`, response.data.data[0]);
      }
    }
    
    // 데이터가 { data: [...] } 형식이면 해당 데이터 반환
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return { data: response.data.data };
    }
    
    // 데이터가 직접 배열 형식이면 그대로 반환
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    
    // 알 수 없는 형식이면 빈 배열 반환
    console.warn('알 수 없는 API 응답 형식:', typeof response.data);
    return { data: [] };
  } catch (error: any) {
    console.error('키워드 데이터 가져오기 오류:', error);
    return {
      error: error.response?.data?.error || '키워드 데이터를 가져오는 중 오류가 발생했습니다.',
    };
  }
}

// 캠페인 일별 리포트 데이터 가져오기
export async function fetchCampaignDailyReport(dateRange: DateRange, campaignId: string): Promise<ApiResponse<any>> {
  try {
    const { startDate, endDate } = dateRange;
    
    console.log(`캠페인 일별 리포트 요청 - 캠페인 ID: ${campaignId}, 기간: ${startDate} ~ ${endDate}`);
    
    const response = await axios.get(`${API_URL}/api/reports/campaign/daily`, {
      params: { startDate, endDate, campaignId },
    });
    
    // API 응답 데이터 구조 로깅
    console.log(`캠페인 일별 리포트 API 응답 구조:`, 
      response.data && typeof response.data === 'object' 
        ? Object.keys(response.data).join(', ') 
        : typeof response.data
    );
    
    // 데이터가 { data: [...] } 형식이면 해당 데이터 반환
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return { data: response.data.data };
    }
    
    // 데이터가 직접 배열 형식이면 그대로 반환
    if (Array.isArray(response.data)) {
      return { data: response.data };
    }
    
    // 알 수 없는 형식이면 빈 배열 반환
    console.warn('알 수 없는 API 응답 형식:', typeof response.data);
    return { data: [] };
  } catch (error: any) {
    console.error('캠페인 일별 리포트 데이터 가져오기 오류:', error);
    return {
      error: error.response?.data?.error || '캠페인 일별 리포트를 가져오는 중 오류가 발생했습니다.',
    };
  }
} 