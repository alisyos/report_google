// 캠페인 리포트 데이터 타입
export interface CampaignReport {
  id: string;
  name: string;
  status?: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
}

// 일별 캠페인 리포트 데이터 타입
export interface CampaignDailyReport {
  id: string;
  name: string;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
}

// 일별 광고 그룹 리포트 데이터 타입
export interface AdGroupDailyReport {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  date: string;
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

// 광고 그룹 데이터 타입
export interface AdGroup {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
}

// 키워드 데이터 타입
export interface Keyword {
  id: string;
  keyword: string;
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
}

// API 응답 타입 확장
export interface ApiResponse<T> {
  data?: T[];
  error?: string;
} 