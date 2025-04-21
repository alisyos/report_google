import { NextResponse } from 'next/server';
import { getAdGroupDailyPerformanceReport } from '@/lib/googleAds';

// 광고 그룹 API 응답 타입 정의
interface AdGroupApiResponse {
  ad_group?: {
    id?: string;
    name?: string;
  };
  campaign?: {
    id?: string;
    name?: string;
  };
  segments?: {
    date?: string;
  };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    cost_micros?: string | number;
    conversions?: string | number;
    ctr?: string | number;
  };
}

/**
 * 애드그룹 일별 성과 보고서 API 엔드포인트
 * GET /api/reports/adgroup/daily
 * 
 * 특정 애드그룹의 일별 성과 데이터를 제공합니다.
 * 
 * 쿼리 파라미터:
 * - startDate: 시작일 (YYYY-MM-DD)
 * - endDate: 종료일 (YYYY-MM-DD)
 * - campaignId: 캠페인 ID (선택)
 * - adGroupId: 애드그룹 ID (선택)
 */
export async function GET(request: Request) {
  console.log('광고 그룹 일별 성과 보고서 API 호출됨');
  
  try {
    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2023-01-01';
    const endDate = searchParams.get('endDate') || '2023-12-31';
    const campaignId = searchParams.get('campaignId');
    const adGroupId = searchParams.get('adGroupId');
    
    console.log(`파라미터: startDate=${startDate}, endDate=${endDate}, campaignId=${campaignId}, adGroupId=${adGroupId}`);
    
    // 광고 그룹 일별 성과 보고서 데이터 가져오기
    const reportData = await getAdGroupDailyPerformanceReport(startDate, endDate, campaignId, adGroupId);
    
    console.log(`광고 그룹 일별 성과 보고서: ${reportData.length}개 항목 반환`);
    if (reportData.length > 0) {
      console.log('첫 번째 항목 샘플:', JSON.stringify(reportData[0]).substring(0, 200) + '...');
    }
    
    // 클라이언트용으로 데이터 포맷팅
    const formattedReport = reportData.map(item => ({
      id: item.ad_group?.id || '',
      name: item.ad_group?.name || '',
      campaignId: item.campaign?.id || '',
      campaignName: item.campaign?.name || '',
      date: item.segments?.date || '',
      impressions: item.metrics?.impressions || 0,
      clicks: item.metrics?.clicks || 0,
      cost: item.metrics?.cost_micros ? Number(item.metrics.cost_micros) / 1000000 : 0,
      conversions: item.metrics?.conversions || 0,
      ctr: item.metrics?.ctr || 0
    }));
    
    return NextResponse.json({ data: formattedReport });
  } catch (error: any) {
    console.error('광고 그룹 일별 성과 보고서 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '광고 그룹 일별 성과 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 