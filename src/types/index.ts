// 캠페인 리포트 데이터 타입
export interface CampaignReport {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
}

// 키워드 리포트 데이터 타입
export interface KeywordReport {
  keyword: string;
  campaignName: string;
  adGroupName: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
}

// 날짜 범위 타입
export interface DateRange {
  startDate: string;
  endDate: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  data?: T[];
  error?: string;
} 