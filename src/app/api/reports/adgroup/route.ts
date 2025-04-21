import { NextResponse } from 'next/server';
import { getAdGroupPerformanceReport } from '@/lib/googleAds';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 날짜 범위 파라미터 (기본값: 2023년 전체)
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';
  
  // 캠페인 ID 파라미터 (선택사항)
  const campaignId = searchParams.get('campaignId') || null;
  
  try {
    // Google Ads API에서 데이터 가져오기
    const report = await getAdGroupPerformanceReport(startDate, endDate, campaignId);
    
    console.log(`광고 그룹 API 응답 받음: ${report.length}개 항목`);
    
    // API 응답 데이터 변환 (필요한 형식으로 변환)
    const formattedReport = report.map((item: any) => {
      // 마이크로 단위 비용을 실제 화폐 단위로 변환
      const costMicros = item.metrics?.cost_micros || 0;
      const convertedCost = Number(costMicros) / 1000000;
      
      return {
        id: item.ad_group?.id || '',
        name: item.ad_group?.name || '',
        campaignId: item.campaign?.id || '',
        campaignName: item.campaign?.name || '',
        impressions: Number(item.metrics?.impressions) || 0,
        clicks: Number(item.metrics?.clicks) || 0,
        cost: convertedCost,
        conversions: Number(item.metrics?.conversions) || 0,
        ctr: Number(item.metrics?.ctr) || 0
      };
    });
    
    console.log(`${formattedReport.length}개의 광고 그룹 리포트 데이터를 반환합니다.`);
    return NextResponse.json({ data: formattedReport });
  } catch (error: any) {
    console.error('광고 그룹 리포트 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '광고 그룹 성과 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 