import axios from 'axios';
import { DateRange, ApiResponse, CampaignReport, KeywordReport } from '@/types';

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