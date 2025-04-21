import { NextResponse } from 'next/server';
import { getAdGroupPerformanceReport } from '@/lib/googleAds';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 날짜 범위 파라미터 (기본값: 2023년 전체)
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';
  const campaignId = searchParams.get('campaignId');
  
  console.log(`애드그룹 성과 리포트 요청: ${startDate} ~ ${endDate}${campaignId ? `, 캠페인 ID: ${campaignId}` : ''}`);
  
  try {
    // Google Ads API에서 애드그룹 성과 데이터 가져오기
    const report = await getAdGroupPerformanceReport(startDate, endDate, campaignId);
    
    console.log(`애드그룹 API 응답 받음: ${report.length}개 항목`);
    if (report.length > 0) {
      console.log('첫 번째 항목 샘플:', JSON.stringify(report[0]).substring(0, 200) + '...');
    }
    
    // API 응답 데이터 변환
    const formattedReport = report.map((item: any) => ({
      id: item.ad_group?.id || '',
      name: item.ad_group?.name || '',
      campaignId: item.campaign?.id || '',
      campaignName: item.campaign?.name || '',
      impressions: Number(item.metrics?.impressions) || 0,
      clicks: Number(item.metrics?.clicks) || 0,
      cost: item.metrics?.cost_micros ? Number(item.metrics.cost_micros) / 1000000 : 0,
      conversions: Number(item.metrics?.conversions) || 0,
      ctr: Number(item.metrics?.ctr) || 0
    }));
    
    console.log(`${formattedReport.length}개의 애드그룹 리포트 데이터를 반환합니다.`);
    
    return NextResponse.json({ data: formattedReport });
  } catch (error: any) {
    console.error('애드그룹 리포트 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '애드그룹 성과 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 