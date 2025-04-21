import { NextResponse } from 'next/server';
import { getCampaignPerformanceReport } from '@/lib/googleAds';

export async function GET(request: Request) {
  // URL에서 쿼리 파라미터 추출
  const url = new URL(request.url);
  const startDate = url.searchParams.get('startDate') || '2023-01-01';
  const endDate = url.searchParams.get('endDate') || '2023-12-31';

  console.log(`[API] 캠페인 성과 보고서 요청 - 기간: ${startDate} ~ ${endDate}`);

  try {
    // Google Ads API에서 데이터 가져오기
    const reportData = await getCampaignPerformanceReport(startDate, endDate);
    
    console.log(`[API] 캠페인 성과 보고서 - ${reportData?.length || 0}개 항목 수신`);
    if (reportData && reportData.length > 0) {
      console.log(`[API] 첫 번째 항목 샘플: ${JSON.stringify(reportData[0]).substring(0, 200)}...`);
      
      // 비용 로깅 추가
      if (reportData[0].metrics?.cost_micros) {
        const originalCost = reportData[0].metrics.cost_micros;
        const convertedCost = Number(originalCost) / 1000000;
        console.log(`[API] 비용 마이크로 단위: ${originalCost}, 변환된 비용: ${convertedCost}`);
      }
    }
    
    // 데이터 형식 변환 및 클라이언트용 응답 생성
    if (reportData) {
      const formattedReport = reportData.map(item => ({
        id: item.campaign?.id || '',
        name: item.campaign?.name || '',
        status: item.campaign?.status || '',
        impressions: Number(item.metrics?.impressions) || 0,
        clicks: Number(item.metrics?.clicks) || 0,
        cost: item.metrics?.cost_micros ? Number(item.metrics.cost_micros) / 1000000 : 0,
        conversions: Number(item.metrics?.conversions) || 0,
        ctr: Number(item.metrics?.ctr) || 0
      }));

      console.log(`[API] ${formattedReport.length}개의 캠페인 리포트 데이터를 반환합니다.`);
      return NextResponse.json({
        success: true,
        data: formattedReport
      });
    }

    return NextResponse.json({
      success: false,
      message: '캠페인 성과 보고서를 가져오는 데 실패했습니다.'
    });
  } catch (error) {
    console.error('[API] 캠페인 성과 보고서 오류:', error);
    return NextResponse.json({
      success: false,
      message: '캠페인 성과 보고서를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 